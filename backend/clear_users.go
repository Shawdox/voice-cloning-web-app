package main

import (
	"fmt"
	"log"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 连接数据库
	database.InitDB()

	// 清空 users 表
	result := database.DB.Exec("TRUNCATE TABLE users RESTART IDENTITY CASCADE")
	if result.Error != nil {
		log.Fatalf("清空用户表失败: %v", result.Error)
	}

	fmt.Println("✅ 用户表已清空")
	fmt.Printf("影响行数: %d\n", result.RowsAffected)
}
