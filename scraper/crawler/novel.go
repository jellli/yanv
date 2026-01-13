package crawler

import (
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync/atomic"
	"unicode/utf8"
	"yanv/models"
	"yanv/scraper/collector"
	"yanv/scraper/utils"

	"github.com/gocolly/colly"
)

const (
	selTitle      = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[1]"
	selAuthor     = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/a/font[1]"
	selStar       = "//*[@id='mainDownInfo']/div[1]/p[1]/strong/font[2]/img"
	selDesc       = "#mainDownInfo > div:nth-child(1) > p:nth-child(3)"
	selUpdateTime = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[5]/td[2]/font"
	selSize       = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[6]/td[2]/font"
	selDownload   = "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[8]/td[2]/center/a"
	selCategory   = "div.crumb > span > a:last-child"
)

var (
	reTags       = regexp.MustCompile(`(?m)内容标签：([^\r\n]*)`)
	reKeys       = regexp.MustCompile(`(?m)搜索关键字：([^\r\n]*)`)
	reShort      = regexp.MustCompile(`(?m)一句话简介：([^\r\n]*)`)
	reConception = regexp.MustCompile(`(?m)立意：([^\r\n]*)`)
	reID         = regexp.MustCompile(`txt-(\d+)\.htm`)
	reStar       = regexp.MustCompile(`\/(\d+)\.gif`)
)

// Count 使用 int64 以支持原子操作且防止溢出
type Count struct {
	Success int64
	Failed  int64
}

// 统一获取上下文中的 Novel
func getNovel(r *colly.Request) *models.Novel {
	return r.Ctx.GetAny("novel").(*models.Novel)
}

// 从上下文中获取 Task
func getTask(r *colly.Request) *models.Task {
	return r.Ctx.GetAny("task").(*models.Task)
}

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

func RegisterDetailCallbacks(c *colly.Collector, count *Count) {
	c.OnError(func(r *colly.Response, err error) {
		atomic.AddInt64(&count.Failed, 1)
		task := getTask(r.Request)
		models.DB.Model(task).Update("status", 0)

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
		raw := strings.TrimSpace(strings.TrimPrefix(x.Text, "书名："))
		// 移除中文书名号 《 》
		raw = strings.TrimPrefix(raw, "《")
		raw = strings.TrimSuffix(raw, "》")
		getNovel(x.Request).Title = strings.TrimSpace(raw)
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

	c.OnHTML(selCategory, func(h *colly.HTMLElement) {
		getNovel(h.Request).Category = strings.TrimSpace(h.Text)
	})

	// 下载链接
	c.OnXML(selDownload, func(x *colly.XMLElement) {
		novel := getNovel(x.Request)
		subLink := x.Attr("href")
		if subLink == "" {
			slog.Error("获取下载链接失败", "url", x.Request.URL.String())
			return
		}
		targetUrl := x.Request.AbsoluteURL(subLink)
		realDownloadXpath := "//*[@id='mainDownInfo']/table/tbody/tr/td/table/tbody/tr[5]/td[2]/a[2]"

		dCollector := c.Clone()
		dCollector.OnXML(realDownloadXpath, func(subX *colly.XMLElement) {
			novel.DownloadURL = subX.Attr("href")
		})
		dCollector.Visit(targetUrl)
		dCollector.Wait()
	})

	c.OnScraped(func(r *colly.Response) {
		n := getNovel(r.Request)
		task := getTask(r.Request)
		n.SourceURL = r.Request.URL.String()

		if match := reID.FindStringSubmatch(n.SourceURL); len(match) > 1 {
			n.ID = match[1]
		}

		if n.Title != "" {
			result := models.DB.Create(n)
			if result.Error != nil {
				atomic.AddInt64(&count.Failed, 1)
				slog.Error("数据入库失败", "id", n.ID, "title", n.Title, "err", result.Error.Error())
				models.DB.Model(task).Update("status", 0)
			} else {
				atomic.AddInt64(&count.Success, 1)
				task.Status = 2
				models.DB.Save(task)
				slog.Info("采集成功", "id", n.ID, "title", n.Title, "size", n.Size)
			}
		}
	})
}

func CrawlNovelBatch() {
	count := &Count{Success: 0, Failed: 0}
	c := collector.InitCollector()

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 0,
		Parallelism: 5,
	})
	c.Async = true

	// 注册回调函数
	RegisterDetailCallbacks(c, count)

	var remainTaskCount int64
	models.DB.Model(models.Task{}).Where("status = ?", 0).Count(&remainTaskCount)

	for {
		currentSuccess := atomic.LoadInt64(&count.Success)
		currentFailed := atomic.LoadInt64(&count.Failed)

		percent := 0.0
		if remainTaskCount > 0 {
			percent = float64(currentSuccess+currentFailed) / float64(remainTaskCount) * 100
		}

		slog.Info("任务进度",
			"成功", currentSuccess,
			"失败", currentFailed,
			"总待办", remainTaskCount,
			"进度", strconv.FormatFloat(percent, 'f', 2, 64)+"%",
		)

		var tasks []models.Task
		tx := models.DB.Begin()

		// 批量获取任务
		if err := tx.Model(models.Task{}).Limit(10).Where("status = ?", 0).Find(&tasks).Error; err != nil {
			slog.Error("查询任务失败", "err", err)
			tx.Rollback()
			break
		}

		if len(tasks) == 0 {
			slog.Info("没有可以执行的任务，结束")
			tx.Rollback()
			break
		}

		// 批量更新任务状态为进行中(1)
		taskIDs := make([]uint, len(tasks))
		for i, task := range tasks {
			taskIDs[i] = task.ID
		}

		if err := tx.Model(&models.Task{}).Where("id IN ?", taskIDs).Update("status", 1).Error; err != nil {
			slog.Error("更新任务状态失败", "err", err)
			tx.Rollback()
			continue
		}

		tx.Commit()

		// 执行采集
		for i := range tasks {
			task := &tasks[i]
			ctx := colly.NewContext()
			ctx.Put("task", task)
			ctx.Put("novel", &models.Novel{})
			url := "http://www.aqxsw333.com" + task.URL
			slog.Info("开始采集任务", "url", url)
			c.Request("GET", url, nil, ctx, nil)
		}

		c.Wait()
		slog.Info("本批任务执行完毕", "本批总数", len(tasks))
	}
}
