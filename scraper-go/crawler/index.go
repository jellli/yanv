package crawler

import (
	"log/slog"
	"scraper/models"
	"scraper/utils"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gocolly/colly"
)

func buildUrl(index int) string {
	var b strings.Builder
	b.WriteString("https://www.aqxsw333.com/txt-xx/new/index_")
	b.WriteString(strconv.Itoa(index))
	b.WriteString(".htm")
	return b.String()
}

func CrawlIndexes() {
	index := 1
	url := buildUrl(index)

	c := colly.NewCollector(
		colly.AllowedDomains("www.aqxsw333.com"),
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 1 * time.Second,
		Parallelism: 1,
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

	c.OnHTML(".book-item", func(h *colly.HTMLElement) {
		name := h.ChildAttr(".book-title>a", "title")
		url := h.ChildAttr(".book-title>a", "href")
		result := models.DB.Create(&models.Task{
			Name: name,
			URL:  url,
		})
		if result.Error != nil {
			slog.Error("新增任务失败", "name", name, "err", result.Error.Error())
		} else {
			slog.Info("新增任务", "name", name)
		}
	})

	c.OnScraped(func(r *colly.Response) {
		index += 1
		url = buildUrl(index)
		r.Request.Visit(url)
	})

	c.Visit(url)
}
