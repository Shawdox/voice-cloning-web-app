package main

import (
	"fmt"
	"log"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to init database: %v", err)
	}

	// 更新用户积分
	email := "xiaowu.417@qq.com"
	credits := 999999

	var user models.User
	result := database.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		log.Fatalf("User not found: %v", result.Error)
	}

	// 更新积分
	result = database.DB.Model(&user).Update("credits", credits)
	if result.Error != nil {
		log.Fatalf("Failed to update credits: %v", result.Error)
	}

	fmt.Printf("✅ Successfully updated credits for %s to %d\n", email, credits)
	fmt.Printf("User ID: %d\n", user.ID)
}
