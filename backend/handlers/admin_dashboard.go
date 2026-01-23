package handlers

import (
	"net/http"
	"strconv"
	"time"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
	"voice-clone-backend/services"

	"github.com/gin-gonic/gin"
)

// 获取流量统计
func GetTrafficStats(c *gin.Context) {
	period := c.DefaultQuery("period", "day")

	var stats []map[string]interface{}
	var groupBy string
	var timeRange time.Time

	switch period {
	case "hour":
		groupBy = "DATE_TRUNC('hour', created_at)"
		timeRange = time.Now().Add(-24 * time.Hour)
	case "day":
		groupBy = "DATE_TRUNC('day', created_at)"
		timeRange = time.Now().Add(-30 * 24 * time.Hour)
	case "week":
		groupBy = "DATE_TRUNC('week', created_at)"
		timeRange = time.Now().Add(-12 * 7 * 24 * time.Hour)
	case "month":
		groupBy = "DATE_TRUNC('month', created_at)"
		timeRange = time.Now().Add(-12 * 30 * 24 * time.Hour)
	default:
		groupBy = "DATE_TRUNC('day', created_at)"
		timeRange = time.Now().Add(-30 * 24 * time.Hour)
	}

	database.DB.Raw(`
		SELECT
			`+groupBy+` as time_bucket,
			event_type,
			COUNT(*) as count
		FROM traffic_logs
		WHERE created_at >= ? AND event_type = 'fish_audio_api'
		GROUP BY time_bucket, event_type
		ORDER BY time_bucket DESC
	`, timeRange).Scan(&stats)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// 获取用户列表
func GetUsersList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	var users []models.User
	var total int64

	query := database.DB.Model(&models.User{})

	if search != "" {
		query = query.Where("email LIKE ? OR nickname LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

// 切换用户状态
func ToggleUserStatus(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	user.IsActive = !user.IsActive
	database.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message":   "操作成功",
		"is_active": user.IsActive,
	})
}

// 获取OSS信息
func GetOSSInfo(c *gin.Context) {
	capacity, err := services.GetOSSCapacity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取OSS信息失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bucket_name":    config.AppConfig.OSS.BucketName,
		"capacity_bytes": capacity,
		"capacity_mb":    capacity / 1024 / 1024,
		"capacity_gb":    float64(capacity) / 1024 / 1024 / 1024,
	})
}

// 获取Fish Audio信息
func GetFishAudioInfo(c *gin.Context) {
	balance, err := services.GetFishAudioBalance()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Fish Audio信息失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, balance)
}
