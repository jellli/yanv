/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"yanv/scraper/crawler"

	"github.com/spf13/cobra"
)

// novelCmd represents the novel command
var novelCmd = &cobra.Command{
	Use:   "novel",
	Short: "采集小说详情页",
	Run: func(cmd *cobra.Command, args []string) {
		crawler.CrawlNovelBatch()
	},
}

func init() {
	rootCmd.AddCommand(novelCmd)
}
