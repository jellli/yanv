package models

import (
	"embed"
	"fmt"
	"io"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

//go:embed database/novels.db
var presetDB embed.FS

var DB *gorm.DB

func InitDB() {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "." // 回退到当前目录
	}

	dbDir := configDir + "/pig_novel/database"
	os.MkdirAll(dbDir, os.ModePerm)
	dbPath := dbDir + "/novels.db"
	fmt.Println(dbDir)

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		err := copyPresetDB(dbPath)
		if err != nil {
			fmt.Println("Failed to copy preset DB:", err)
		} else {
			fmt.Println("Successfully initialized DB at:", dbPath)
		}
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
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
func copyPresetDB(dst string) error {
	srcFile, err := presetDB.Open("database/novels.db")
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}
