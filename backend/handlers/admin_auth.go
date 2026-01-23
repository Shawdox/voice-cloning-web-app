package handlers

import (
	"net/http"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
	"voice-clone-backend/utils"

	"github.com/gin-gonic/gin"
)

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func AdminLogin(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var admin models.Admin
	if err := database.DB.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if !utils.CheckPassword(req.Password, admin.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if !admin.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "账号已被禁用"})
		return
	}

	token, err := utils.GenerateAdminToken(admin.ID, admin.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"admin": gin.H{
			"id":       admin.ID,
			"username": admin.Username,
			"email":    admin.Email,
		},
	})
}
