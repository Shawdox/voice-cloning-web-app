package main

import (
	"log"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/middleware"
	"voice-clone-backend/routes"
	"voice-clone-backend/services"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.LoadConfig()
	log.Println("Configuration loaded")

	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// 自动迁移数据库表
	if err := database.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// 初始化Redis
	if err := services.InitRedis(); err != nil {
		log.Fatal("Failed to initialize Redis:", err)
	}
	log.Println("Redis connection established")

	// 初始化OSS服务
	if err := services.InitOSS(); err != nil {
		log.Fatal("Failed to initialize OSS:", err)
	}
	log.Println("OSS service initialized")

	// 初始化Fish Audio服务
	services.InitFishAudio()
	log.Println("Fish Audio service initialized")

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建路由
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.RequestLoggerMiddleware())

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	port := config.AppConfig.Server.Port
	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
