package database

import (
	"fmt"
	"log"
	"voice-clone-backend/config"
	"voice-clone-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// 初始化数据库连接
func InitDB() error {
	cfg := config.AppConfig.Database

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established")
	return nil
}

// 自动迁移数据库表
func AutoMigrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.CreditTransaction{},
		&models.RechargeOrder{},
		&models.Voice{},
		&models.TTSTask{},
		&models.UploadedFile{},
		&models.Admin{},
		&models.TrafficLog{},
	)

	if err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}

	log.Println("Database migration completed")
	return nil
}
