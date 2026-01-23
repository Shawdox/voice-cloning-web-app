package middleware

import (
	"net/http"
	"strings"
	"voice-clone-backend/utils"

	"github.com/gin-gonic/gin"
)

func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" || !strings.HasPrefix(tokenString, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		claims, err := utils.ParseAdminToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "令牌无效"})
			c.Abort()
			return
		}

		c.Set("admin_id", claims.AdminID)
		c.Set("admin_username", claims.Username)
		c.Next()
	}
}
