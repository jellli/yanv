package main

import (
	// "log/slog"
	// "os"
	// "strconv"
	// "time"
	"log/slog"
	"os"
	"yanv/cmd"
	"yanv/models"
	// "yanv/scraper/crawler"
	//
	// "github.com/gocolly/colly"
)

func setupLogger() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
}

func main() {
	models.InitDB()
	setupLogger()
	cmd.Execute()
}
