package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"
	"voice-clone-backend/database"
	"voice-clone-backend/models"

	"github.com/gin-gonic/gin"
)

func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := c.GetHeader("X-Request-Id")
		if rid == "" {
			rid = newRequestID()
		}
		c.Set("request_id", rid)
		c.Writer.Header().Set("X-Request-Id", rid)
		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if c == nil {
		return ""
	}
	if v, ok := c.Get("request_id"); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func RequestLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		ip := c.ClientIP()
		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)

		userID := uint(0)
		if v, ok := c.Get("user_id"); ok {
			if id, ok := v.(uint); ok {
				userID = id
			}
		}

		rid := GetRequestID(c)
		log.Printf("request_id=%s method=%s path=%s status=%d latency_ms=%d ip=%s user_id=%d", rid, method, path, status, latency.Milliseconds(), ip, userID)
	}
}

func newRequestID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return hex.EncodeToString([]byte(time.Now().Format("20060102150405.000000000")))
	}
	return hex.EncodeToString(b)
}

func TrafficLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		latency := time.Since(start)

		// Get user ID if authenticated
		var userID *uint
		if id, exists := c.Get("user_id"); exists {
			if uid, ok := id.(uint); ok {
				userID = &uid
			}
		}

		// Log to database asynchronously
		go func() {
			trafficLog := models.TrafficLog{
				EventType:  "api_call",
				Endpoint:   c.Request.URL.Path,
				UserID:     userID,
				RequestID:  GetRequestID(c),
				StatusCode: c.Writer.Status(),
				LatencyMs:  int(latency.Milliseconds()),
			}
			database.DB.Create(&trafficLog)
		}()
	}
}
