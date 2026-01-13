package models

import (
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	cwd, err := os.Getwd()
	if err != nil {
		panic("failed to get cwd")
	}
	db, err := gorm.Open(sqlite.Open(cwd+"/database/novels.db"), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		panic("failed to connect database")
	}
	db.Exec("PRAGMA journal_mode=WAL;")
	db.AutoMigrate(&Task{})
	db.AutoMigrate(&Novel{})
	DB = db

}
