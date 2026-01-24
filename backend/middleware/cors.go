package middleware

import (
	"strings"
	"voice-clone-backend/config"

	"github.com/gin-gonic/gin"
)

// CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 允许的源列表（支持 localhost 和 127.0.0.1）
		allowedOrigins := []string{
			config.AppConfig.Server.FrontendURL,
			strings.Replace(config.AppConfig.Server.FrontendURL, "localhost", "127.0.0.1", 1),
			strings.Replace(config.AppConfig.Server.FrontendURL, "127.0.0.1", "localhost", 1),
		}

		// 检查请求的 Origin 是否在允许列表中
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
