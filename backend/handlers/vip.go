package handlers

import (
	"net/http"
	"time"
	"voice-clone-backend/database"
	"voice-clone-backend/models"

	"github.com/gin-gonic/gin"
)

// 获取VIP状态
func GetVIPStatus(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "用户不存在"})
		return
	}

	isVIP := user.VIPLevel > 0 && (user.VIPExpiresAt == nil || user.VIPExpiresAt.After(time.Now()))

	benefits := []string{}
	if user.VIPLevel >= 1 {
		benefits = append(benefits, "优先处理队列", "更快的语音生成速度", "更多的并发任务")
	}
	if user.VIPLevel >= 2 {
		benefits = append(benefits, "专属客服支持", "高级语音模型", "无限制语音克隆")
	}

	response := models.VIPStatusResponse{
		IsVIP:        isVIP,
		VIPLevel:     user.VIPLevel,
		VIPExpiresAt: user.VIPExpiresAt,
		Benefits:     benefits,
	}

	c.JSON(http.StatusOK, response)
}

// 升级VIP请求
type UpgradeVIPRequest struct {
	Level   int    `json:"level" binding:"required,min=1,max=2"` // 1=VIP, 2=Super VIP
	Months  int    `json:"months" binding:"required,min=1,max=12"` // 购买月数
	PaymentType string `json:"paymentType" binding:"required"` // wechat/alipay
}

// 升级VIP
func UpgradeVIP(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req UpgradeVIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "请求参数错误: " + err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "用户不存在"})
		return
	}

	// 计算价格（示例价格）
	var pricePerMonth float64
	if req.Level == 1 {
		pricePerMonth = 30.0 // VIP: 30元/月
	} else {
		pricePerMonth = 50.0 // Super VIP: 50元/月
	}
	totalPrice := pricePerMonth * float64(req.Months)

	// 计算到期时间
	var expiresAt time.Time
	if user.VIPExpiresAt != nil && user.VIPExpiresAt.After(time.Now()) {
		// 如果当前VIP未过期，在现有基础上延长
		expiresAt = user.VIPExpiresAt.AddDate(0, req.Months, 0)
	} else {
		// 否则从现在开始计算
		expiresAt = time.Now().AddDate(0, req.Months, 0)
	}

	// 更新用户VIP信息（模拟支付成功）
	user.VIPLevel = req.Level
	user.VIPExpiresAt = &expiresAt

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "升级失败"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "VIP升级成功",
		Data: gin.H{
			"vipLevel":     user.VIPLevel,
			"vipExpiresAt": user.VIPExpiresAt,
			"amount":       totalPrice,
		},
	})
}

// 获取历史记录（别名到TTS任务列表）
func GetHistory(c *gin.Context) {
	// 直接调用GetTTSTasks
	GetTTSTasks(c)
}
