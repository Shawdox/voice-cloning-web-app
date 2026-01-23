package main

import (
	"encoding/json"
	"fmt"
	"log"
	"voice-clone-backend/config"
	"voice-clone-backend/services"
)

func main() {
	// 1. 加载配置 (会读取当前目录下的 .env)
	config.LoadConfig()

	// 2. 检查配置是否加载成功
	if config.AppConfig.OSS.BucketName == "" {
		log.Fatal("OSS Config is missing. Make sure .env file exists in current directory.")
	}

	fmt.Printf("Connecting to OSS Bucket: %s (Endpoint: %s)...\n", 
		config.AppConfig.OSS.BucketName, 
		config.AppConfig.OSS.Endpoint)

	// 3. 初始化OSS服务
	if err := services.InitOSS(); err != nil {
		log.Fatalf("Failed to init OSS: %v", err)
	}

	// 4. 调用获取详情函数
	details, err := services.GetBucketDetails()
	if err != nil {
		log.Fatalf("Error querying bucket details: %v", err)
	}

	// 5. 格式化输出
	output, _ := json.MarshalIndent(details, "", "  ")
	fmt.Println("\n=== OSS Bucket Status ===")
	fmt.Println(string(output))
	fmt.Println("=========================")
}
