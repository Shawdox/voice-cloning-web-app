package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
	"voice-clone-backend/services"

	"github.com/gin-gonic/gin"
)

// 查询积分余额
func GetCreditsBalance(c *gin.Context) {
	userID := c.GetUint("user_id")

	credits, err := services.GetUserCredits(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "查询失败"})
		return
	}

	c.JSON(http.StatusOK, models.PointsBalanceResponse{
		Points: credits,
	})
}

// 获取积分交易记录
func GetCreditTransactions(c *gin.Context) {
	userID := c.GetUint("user_id")

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20")) // camelCase

	var offset int
	// 如果page为0或未提供，返回所有数据
	if page > 0 && pageSize > 0 {
		if pageSize > 100 {
			pageSize = 100
		}
		offset = (page - 1) * pageSize
	} else {
		pageSize = 0 // 返回所有
		offset = 0
	}

	transactions, total, err := services.GetCreditTransactions(userID, pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "查询失败"})
		return
	}

	// 转换为DTO
	transactionResponses := make([]models.TransactionResponse, len(transactions))
	for i, tx := range transactions {
		transactionResponses[i] = tx.ToTransactionResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  transactionResponses,
		"total": total,
	})
}

// 创建充值订单 (Mock实现)
func CreateRechargeOrder(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Points      int    `json:"points" binding:"required"` // camelCase, renamed from credits
		PaymentType string `json:"paymentType" binding:"required,oneof=alipay wechat"` // camelCase
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "参数错误"})
		return
	}

	// 计算金额 (¥1 = 10积分)
	var amount float64
	switch req.Points {
	case 100:
		amount = 10.0
	case 500:
		amount = 45.0 // 9折
	case 1000:
		amount = 80.0 // 8折
	case 2000:
		amount = 150.0 // 7.5折
	default:
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "无效的积分套餐"})
		return
	}

	// 生成订单号
	orderNo := fmt.Sprintf("ORDER_%d_%d", time.Now().Unix(), userID)

	// 创建订单记录
	order := models.RechargeOrder{
		UserID:      userID,
		OrderNo:     orderNo,
		Amount:      amount,
		Credits:     req.Points,
		PaymentType: req.PaymentType,
		Status:      "pending",
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "创建订单失败"})
		return
	}

	// Mock: 生成二维码URL
	qrCodeURL := fmt.Sprintf("https://via.placeholder.com/200x200?text=%s+QR+Code", req.PaymentType)

	// 订单15分钟后过期
	expiresAt := time.Now().Add(15 * time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"orderNo":     orderNo,
		"amount":      amount,
		"points":      req.Points, // renamed from credits
		"qrCodeUrl":   qrCodeURL,  // camelCase
		"expiresAt":   expiresAt,  // camelCase
		"paymentType": req.PaymentType, // camelCase
	})
}

// 查询订单状态 (Mock实现)
func CheckOrderStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderNo := c.Param("order_no")

	var order models.RechargeOrder
	if err := database.DB.Where("order_no = ? AND user_id = ?", orderNo, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "订单不存在"})
		return
	}

	// Mock: 订单创建5秒后自动完成支付
	if order.Status == "pending" && time.Since(order.CreatedAt) > 5*time.Second {
		// 更新订单状态
		now := time.Now()
		order.Status = "paid"
		order.PaidAt = &now
		database.DB.Save(&order)

		// 添加积分
		if err := services.AddCredits(userID, order.Credits, "recharge", fmt.Sprintf("充值 %d 积分", order.Credits), orderNo); err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "添加积分失败"})
			return
		}
	}

	c.JSON(http.StatusOK, order.ToRechargeOrderResponse())
}
