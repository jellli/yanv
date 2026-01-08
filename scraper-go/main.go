package main

import (
	"bytes"
	"database/sql"
	"io"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
	_ "modernc.org/sqlite"
)

type Novel struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Author      string  `json:"author"`
	StarRating  float64 `json:"star_rating"`
	Summary     string  `json:"summary"`
	ShortIntro  string  `json:"short_intro"`
	Conception  string  `json:"conception"`
	Tags        string  `json:"tags"`
	Keywords    string  `json:"keywords"`
	UpdateTime  string  `json:"update_time"`
	Size        string  `json:"size"`
	SourceURL   string  `json:"source_url"`
	DownloadURL string  `json:"download_url"`
	LocalPath   string  `json:"local_path"`
}

func initDB(db *sql.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS novels (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		unique_id TEXT UNIQUE,
		title TEXT,
		author TEXT,
		star_rating REAL,
		summary TEXT,
		short_intro TEXT,
		conception TEXT,
		tags TEXT,
		keywords TEXT,
		update_time TEXT,
		size TEXT,
		source_url TEXT,
		download_url TEXT,
		local_path TEXT
	);`
	_, err := db.Exec(createTableSQL)
	return err
}

func saveNovelToSQLite(db *sql.DB, n Novel) error {
	if n.ID == "" {
		return nil
	}

	insertSQL := `
	INSERT OR REPLACE INTO novels (
		unique_id, title, author, star_rating, summary, short_intro, 
		conception, tags, keywords, update_time, size, 
		source_url, download_url, local_path
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := db.Exec(insertSQL,
		n.ID,
		n.Title,
		n.Author,
		n.StarRating,
		n.Summary,
		n.ShortIntro,
		n.Conception,
		n.Tags,
		n.Keywords,
		n.UpdateTime,
		n.Size,
		n.SourceURL,
		n.DownloadURL,
		n.LocalPath,
	)
	return err
}

var (
	reTags       = regexp.MustCompile(`(?m)内容标签：([^\r\n]*)`)
	reKeys       = regexp.MustCompile(`(?m)搜索关键字：([^\r\n]*)`)
	reShort      = regexp.MustCompile(`(?m)一句话简介：([^\r\n]*)`)
	reConception = regexp.MustCompile(`(?m)立意：([^\r\n]*)`)
	reLineBreak  = regexp.MustCompile(`(?i)<br\s*/?>|<\s*/p\s*>|<\s*/div\s*>`)
	reID         = regexp.MustCompile(`txt-(\d+)\.htm`)
	reStar       = regexp.MustCompile(`\/(\d+)\.gif`)
)

func GetTextWithLineBreaks(selection *goquery.Selection) string {
	html, _ := selection.Html()
	formatted := reLineBreak.ReplaceAllString(html, "\n")
	doc, _ := goquery.NewDocumentFromReader(strings.NewReader(formatted))
	return strings.TrimSpace(doc.Text())
}

func parseDescription(raw string) Novel {
	n := Novel{}

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

func GBKToUTF8(s []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewDecoder())
	d, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	return string(d), nil
}

func main() {
	db, err := sql.Open("sqlite", "novels.db")
	if err != nil {
		slog.Error("打开数据库失败", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := initDB(db); err != nil {
		slog.Error("初始化数据库表失败", "err", err)
		os.Exit(1)
	}

	setupLogger()

	startURL := "https://www.aqxsw333.com/txt-xx/15/txt-272052.htm"
	crawl(db, startURL)
}

func setupLogger() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
}

const (
	selTitle      = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[1]"
	selAuthor     = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/a/font[1]"
	selStar       = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[2]/img"
	selDesc       = "#mainDownInfo > div:nth-child(1) > p:nth-child(3)"
	selUpdateTime = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[5]/td[2]/font"
	selSize       = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[6]/td[2]/font"
	selDownload   = "//a[contains(@href, '/txt/') and contains(text(), '下载')]"
	selNextPage   = "//*[@id='mainDownInfo']/table/tbody/tr/td/li[1]/a"
)

func crawl(db *sql.DB, startURL string) {
	c := colly.NewCollector(
		colly.AllowedDomains("www.aqxsw333.com"),
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	// 统一获取上下文中的 Novel
	getNovel := func(r *colly.Request) *Novel {
		return r.Ctx.GetAny("novel").(*Novel)
	}

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 1 * time.Second,
		Parallelism: 1,
	})

	c.OnRequest(func(r *colly.Request) {
		r.Ctx.Put("novel", &Novel{})
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
			utf8Body, err := GBKToUTF8(r.Body)
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
		parsed := parseDescription(GetTextWithLineBreaks(x.DOM))
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

	c.OnXML(selNextPage, func(x *colly.XMLElement) {
		next := x.Request.AbsoluteURL(x.Attr("href"))
		x.Request.Ctx.Put("nextPage", next)
	})

	c.OnScraped(func(r *colly.Response) {
		n := getNovel(r.Request)
		n.SourceURL = r.Request.URL.String()

		if match := reID.FindStringSubmatch(n.SourceURL); len(match) > 1 {
			n.ID = match[1]
		}

		if n.Title != "" {
			if err := saveNovelToSQLite(db, *n); err != nil {
				slog.Error("数据入库失败", "id", n.ID, "title", n.Title, "err", err)
			} else {
				slog.Info("采集成功", "id", n.ID, "title", n.Title, "size", n.Size)
			}
		}

		if nextPage := r.Request.Ctx.Get("nextPage"); nextPage != "" && nextPage != n.SourceURL {
			r.Request.Visit(nextPage)
		}
	})

	slog.Info("开始采集任务", "url", startURL)
	c.Visit(startURL)
}
