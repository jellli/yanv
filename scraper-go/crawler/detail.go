package crawler

import (
	"log/slog"
	"net/http"
	"regexp"
	"scraper/models"
	"scraper/utils"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gocolly/colly"
)

const (
	selTitle      = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[1]"
	selAuthor     = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/a/font[1]"
	selStar       = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[2]/img"
	selDesc       = "#mainDownInfo > div:nth-child(1) > p:nth-child(3)"
	selUpdateTime = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[5]/td[2]/font"
	selSize       = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[6]/td[2]/font"
	selDownload   = "//a[contains(@href, '/txt/') and contains(text(), '下载')]"
)

var (
	reTags       = regexp.MustCompile(`(?m)内容标签：([^\r\n]*)`)
	reKeys       = regexp.MustCompile(`(?m)搜索关键字：([^\r\n]*)`)
	reShort      = regexp.MustCompile(`(?m)一句话简介：([^\r\n]*)`)
	reConception = regexp.MustCompile(`(?m)立意：([^\r\n]*)`)
	reID         = regexp.MustCompile(`txt-(\d+)\.htm`)
	reStar       = regexp.MustCompile(`\/(\d+)\.gif`)
)

func parseDescription(raw string) models.Novel {
	n := models.Novel{}

	if match := reTags.FindStringSubmatch(raw); len(match) > 1 {
		n.Tags = strings.TrimSpace(strings.ReplaceAll(match[1], " ", ","))
	}
	if match := reKeys.FindStringSubmatch(raw); len(match) > 1 {
		n.Keywords = strings.TrimSpace(strings.ReplaceAll(match[1], "┃", ","))
	}
	if match := reShort.FindStringSubmatch(raw); len(match) > 1 {
		n.ShortIntro = strings.TrimSpace(match[1])
	}
	if match := reConception.FindStringSubmatch(raw); len(match) > 1 {
		n.Conception = strings.TrimSpace(match[1])
	}

	cutMarkers := []string{"内容标签：", "搜索关键字：", "一句话简介：", "立意："}
	cleanSummary := raw
	for _, marker := range cutMarkers {
		if index := strings.Index(cleanSummary, marker); index != -1 {
			cleanSummary = cleanSummary[:index]
		}
	}

	n.Summary = strings.TrimSpace(cleanSummary)
	return n
}

func CrawlDetial(task *models.Task) {
	c := colly.NewCollector(
		colly.AllowedDomains("www.aqxsw333.com"),
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	// 统一获取上下文中的 Novel
	getNovel := func(r *colly.Request) *models.Novel {
		return r.Ctx.GetAny("novel").(*models.Novel)
	}

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 1 * time.Second,
		Parallelism: 1,
	})

	c.OnRequest(func(r *colly.Request) {
		r.Ctx.Put("novel", &models.Novel{})
	})

	c.OnError(func(r *colly.Response, err error) {
		if r.StatusCode == http.StatusNotFound {
			slog.Info("采集结束", "url", r.Request.URL.String())
			return
		}
		slog.Error("请求异常", "url", r.Request.URL.String(), "err", err, "code", r.StatusCode)
	})

	c.OnResponse(func(r *colly.Response) {
		if !utf8.Valid(r.Body) {
			utf8Body, err := utils.GBKToUTF8(r.Body)
			if err != nil {
				slog.Error("编码转换失败", "url", r.Request.URL.String(), "err", err)
				return
			}
			finalBody := strings.Replace(utf8Body, "encoding=\"GBK\"", "encoding=\"UTF-8\"", 1)
			finalBody = strings.Replace(finalBody, "encoding=\"gb2312\"", "encoding=\"UTF-8\"", 1)
			r.Body = []byte(finalBody)
		}
	})

	c.OnXML(selTitle, func(x *colly.XMLElement) {
		getNovel(x.Request).Title = strings.TrimSpace(strings.TrimPrefix(x.Text, "书名："))
	})

	c.OnXML(selAuthor, func(x *colly.XMLElement) {
		getNovel(x.Request).Author = strings.TrimSpace(strings.TrimPrefix(x.Text, "作者："))
	})

	c.OnXML(selStar, func(x *colly.XMLElement) {
		if match := reStar.FindStringSubmatch(x.Attr("src")); len(match) > 1 {
			getNovel(x.Request).StarRating, _ = strconv.ParseFloat(match[1], 64)
		}
	})

	c.OnHTML(selDesc, func(x *colly.HTMLElement) {
		n := getNovel(x.Request)
		parsed := parseDescription(utils.GetTextWithLineBreaks(x.DOM))
		n.Tags = parsed.Tags
		n.Keywords = parsed.Keywords
		n.ShortIntro = parsed.ShortIntro
		n.Conception = parsed.Conception
		n.Summary = parsed.Summary
	})

	c.OnXML(selUpdateTime, func(x *colly.XMLElement) {
		getNovel(x.Request).UpdateTime = strings.TrimSpace(x.Text)
	})

	c.OnXML(selSize, func(x *colly.XMLElement) {
		getNovel(x.Request).Size = strings.TrimSpace(x.Text)
	})

	// 下载链接
	c.OnXML(selDownload, func(x *colly.XMLElement) {
		getNovel(x.Request).DownloadURL = x.Request.AbsoluteURL(x.Attr("href"))
	})

	c.OnScraped(func(r *colly.Response) {
		n := getNovel(r.Request)
		n.SourceURL = r.Request.URL.String()

		if match := reID.FindStringSubmatch(n.SourceURL); len(match) > 1 {
			n.No = match[1]
		}

		if n.Title != "" {
			result := models.DB.Create(n)
			if result.Error != nil {
				slog.Error("数据入库失败", "id", n.ID, "title", n.Title, "err", result.Error.Error())
			} else {
				slog.Info("采集成功", "id", n.ID, "title", n.Title, "size", n.Size)
			}
		}
	})

	slog.Info("开始采集任务", "url", task.URL)
	c.Visit(task.URL)
}
