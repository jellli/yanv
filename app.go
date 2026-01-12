package main

import (
	"context"
	"fmt"
	"yanv/scraper/models"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	models.InitDB("./database/novels.db")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type NovelQuery struct {
	Title      *string
	Author     *string
	Category   *string
	UpdateTime *string `json:"update_time"`
	StarRating *float64
}

func (a *App) QueryNovels(n *NovelQuery, page int, pageSize int) []models.Novel {
	var novels []models.Novel
	models.DB.Model(models.Novel{}).Where(n).Offset((page - 1) * pageSize).Limit(pageSize).Find(&novels)
	return novels
}
