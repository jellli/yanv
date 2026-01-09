package main

import (
	"log/slog"
	"os"
	"scraper/crawler"
	"scraper/models"
)

func main() {
	models.InitDB()

	setupLogger()

	// crawler.CrawlDetial(models.DB, )
	crawler.CrawlIndexes()
}

func setupLogger() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
}
