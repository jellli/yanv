package collector

import (
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"
	"yanv/scraper/utils"

	"github.com/gocolly/colly"
)

func InitCollector() *colly.Collector {
	c := colly.NewCollector(
		colly.AllowedDomains("www.aqxsw333.com", "www.aqxsw666.com"),
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 1 * time.Second,
		Parallelism: 3,
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

	return c
}
