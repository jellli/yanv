package main

import (
	"log/slog"
	"os"
	"strconv"
	"time"
	"yanv/scraper/crawler"
	"yanv/scraper/models"

	"github.com/gocolly/colly"
)

func main() {
	models.InitDB()

	setupLogger()

	if false {
		crawler.CrawlIndexes()
	}

	count := crawler.Count{
		Success: 0,
		Failed:  0,
	}

	c := colly.NewCollector(
		colly.AllowedDomains("www.aqxsw333.com"),
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		RandomDelay: 1 * time.Second,
		Parallelism: 1,
	})
	crawler.RegisterDetailCallbacks(c, &count)

	var remainTaskCount int64
	models.DB.Model(models.Task{}).Where("status = ?", 0).Count(&remainTaskCount)
	for {
		percent := float64(count.Success+count.Failed) / float64(remainTaskCount) * 100
		slog.Info("任务数量",
			"成功", count.Success,
			"失败", count.Failed,
			"总数", remainTaskCount,
			"进度", strconv.FormatFloat(percent, 'f', 2, 64)+"%",
		)
		var tasks []models.Task
		tx := models.DB.Begin()

		result := tx.Model(models.Task{}).Limit(10).Where("status = ?", 0).Find(&tasks)
		if result.Error != nil {
			slog.Error("查询任务失败", "err", result.Error)
			tx.Rollback()
			break
		}

		if len(tasks) == 0 {
			slog.Info("没有可以执行的任务，结束")
			tx.Rollback()
			break
		}

		taskIDs := make([]uint, len(tasks))
		for i, task := range tasks {
			taskIDs[i] = task.ID
		}

		updateResult := tx.Model(&models.Task{}).Where("id IN ?", taskIDs).Update("status", 1)
		if updateResult.Error != nil {
			slog.Error("更新任务状态失败", "err", updateResult.Error)
			tx.Rollback()
			continue
		}

		tx.Commit()

		for i := range tasks {
			task := &tasks[i]
			ctx := colly.NewContext()
			ctx.Put("task", task)
			url := "http://www.aqxsw333.com" + task.URL
			slog.Info("开始采集任务", "url", url)
			c.Request("GET", url, nil, ctx, nil)
		}

		c.Wait()
		slog.Info("本批任务执行完毕", "总任务", count.Success+count.Failed, "成功", count.Success, "失败", count.Failed)
	}
}

func setupLogger() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
}
