package main

import (
	"context"
	"fmt"
	"yanv/models"
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
	models.InitDB()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type NovelQuery struct {
	Title      *string       `json:"title"`
	Author     *string       `json:"author"`
	Category   *[]string     `json:"category"`
	UpdateTime *string       `json:"update_time"`
	StarRating *([]*float64) `json:"star_rating"`
}

func (a *App) QueryNovels(n *NovelQuery, page int, pageSize int) []models.Novel {
	var novels []models.Novel
	query := models.DB.Model(models.Novel{})
	if n.Title != nil && *n.Title != "" {
		query = query.Where("title LIKE ?", "%"+*n.Title+"%")
	}

	if n.Author != nil {
		query = query.Where("author = ?", *n.Author)
	}
	if n.Category != nil && len(*n.Category) != 0 {
		query = query.Where("category IN ?", *n.Category)
	}
	if n.UpdateTime != nil {
		query = query.Where("update_time = ?", *n.UpdateTime)
	}
	if n.StarRating != nil {
		minV, maxV := 1.0, 5.0
		if len(*n.StarRating) >= 1 && (*n.StarRating)[0] != nil {
			minV = *(*n.StarRating)[0]
		}
		if len(*n.StarRating) >= 2 && (*n.StarRating)[1] != nil {
			maxV = *(*n.StarRating)[1]
		}
		query = query.Where("star_rating BETWEEN ? AND ?", minV, maxV)
	}

	query = query.Offset((page - 1) * pageSize).Limit(pageSize).Find(&novels)

	return novels
}

func (a *App) QueryNovelsCount() int64 {
	var count int64
	models.DB.Model(models.Novel{}).Count(&count)
	return count
}

func (a *App) QueryCategories() []string {
	var categories []string
	models.DB.Model(models.Novel{}).Distinct("category").Pluck("category", &categories)
	return categories

}
