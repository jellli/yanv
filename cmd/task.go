package cmd

import (
	"fmt"
	"yanv/scraper/crawler"

	"github.com/spf13/cobra"
)

// taskCmd represents the task command
var taskCmd = &cobra.Command{
	Use:   "task",
	Short: "采取任务",
	Run: func(cmd *cobra.Command, args []string) {
		from, _ := cmd.Flags().GetInt("from")
		to, _ := cmd.Flags().GetInt("to")
		fmt.Println("task called", from, to)
		crawler.CrawlTasks(from, to)
	},
}

func init() {
	rootCmd.AddCommand(taskCmd)
	taskCmd.Flags().IntP("from", "f", 1, "起始页")
	taskCmd.Flags().IntP("to", "t", 1, "结束页")
}
