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
		copyPresetDB(dbPath)

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
func copyPresetDB(dst string) {
	srcFile, err := presetDB.Open("database/novels.db")
	if err != nil {
		fmt.Println("Error opening embedded db:", err)
		return
	}
	defer srcFile.Close()

	if info, err := srcFile.Stat(); err == nil {
		fmt.Printf("Embedded DB size: %d bytes\n", info.Size())
	}
	dstFile, err := os.Create(dst)
	if err != nil {
		return
	}
	defer dstFile.Close()

	io.Copy(dstFile, srcFile)
}
