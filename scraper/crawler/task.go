package crawler

import (
	"fmt"
	"log/slog"
	"regexp"
	"yanv/models"
	"yanv/scraper/collector"

	"github.com/gocolly/colly"
)

const (
	targetURLFormat = "https://www.aqxsw333.com/txt-xx/new/index_%d.htm"
	parallelism     = 5
)

var bookNameRe = regexp.MustCompile(`《(.*?)》`)

func buildUrl(index int) string {
	return fmt.Sprintf(targetURLFormat, index)
}
func saveTask(name, url string) {
	result := models.DB.Create(&models.Task{
		Name: name,
		URL:  url,
	})
	if result.Error != nil {
		slog.Error("新增任务失败", "name", name, "err", result.Error.Error())
	} else {
		slog.Info("新增任务成功", "name", name)
	}
}

func CrawlTasks(from int, to int) {
	c := collector.InitCollector()
	c.Async = true
	c.Limit(&colly.LimitRule{
		Parallelism: parallelism,
		RandomDelay: 0,
	})

	c.OnRequest(func(r *colly.Request) {
		slog.Info("正在抓取", "url", r.URL.String())
	})
	c.OnError(func(r *colly.Response, err error) {
		slog.Error("抓取失败", "url", r.Request.URL.String(), "err", err)
	})
	c.OnHTML(".book-item", func(h *colly.HTMLElement) {
		rawName := h.ChildAttr(".book-title>a", "title")
		url := h.ChildAttr(".book-title>a", "href")
		name := rawName
		if matches := bookNameRe.FindStringSubmatch(rawName); len(matches) > 1 {
			name = matches[1]
		}

		if name != "" && url != "" {
			saveTask(name, url)
		}
	})

	for i := from; i <= to; i++ {
		url := buildUrl(i)
		slog.Info("提交任务到队列", "url", url)
		if err := c.Visit(url); err != nil {
			slog.Error("提交访问请求失败", "url", url, "err", err)
		}
	}

	c.Wait()
}
