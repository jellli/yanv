package models

import "gorm.io/gorm"

type Task struct {
	gorm.Model
	Name   string `gorm:"not null"`
	URL    string `gorm:"uniqueIndex;not null"`
	Status int    `gorm:"default:0;index"`
	Error  string
}
