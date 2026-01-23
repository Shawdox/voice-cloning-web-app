package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Database      DatabaseConfig
	JWT           JWTConfig
	OSS           OSSConfig
	FishAudio     FishAudioConfig
	SMS           SMSConfig
	Redis         RedisConfig
	Server        ServerConfig
	Credits       CreditsConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

type JWTConfig struct {
	Secret string
}

type OSSConfig struct {
	Endpoint        string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
}

type FishAudioConfig struct {
	APIKey     string
	BaseURL    string
}

type SMSConfig struct {
	AccessKeyID     string
	AccessKeySecret string
	SignName        string
	TemplateCode    string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type ServerConfig struct {
	Port        string
	FrontendURL string
}

type CreditsConfig struct {
	Initial           int
	VoiceCloneCost    int
	TTSGenerationCost int
}

var AppConfig *Config

func LoadConfig() {
	// 加载 .env 文件
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))
	initialCredits, _ := strconv.Atoi(getEnv("INITIAL_CREDITS", "0"))
	voiceCloneCost, _ := strconv.Atoi(getEnv("VOICE_CLONE_COST", "50"))
	ttsGenerationCost, _ := strconv.Atoi(getEnv("TTS_GENERATION_COST", "10"))

	AppConfig = &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "voice_clone_db"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "default_secret_key"),
		},
		OSS: OSSConfig{
			Endpoint:        getEnv("OSS_ENDPOINT", "oss-cn-beijing.aliyuncs.com"),
			AccessKeyID:     getEnv("OSS_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("OSS_ACCESS_KEY_SECRET", ""),
			BucketName:      getEnv("OSS_BUCKET_NAME", ""),
		},
		FishAudio: FishAudioConfig{
			APIKey:  getEnv("FISH_API_KEY", ""),
			BaseURL: getEnv("FISH_API_BASE_URL", "https://api.fish.audio"),
		},
		SMS: SMSConfig{
			AccessKeyID:     getEnv("ALIYUN_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("ALIYUN_ACCESS_KEY_SECRET", ""),
			SignName:        getEnv("ALIYUN_SMS_SIGN_NAME", ""),
			TemplateCode:    getEnv("ALIYUN_SMS_TEMPLATE_CODE", ""),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       redisDB,
		},
		Server: ServerConfig{
			Port:        getEnv("SERVER_PORT", "8080"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		},
		Credits: CreditsConfig{
			Initial:           initialCredits,
			VoiceCloneCost:    voiceCloneCost,
			TTSGenerationCost: ttsGenerationCost,
		},
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
