package handlers

import (
	"log"
	"net/http"
	"regexp"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
	"voice-clone-backend/services"
	"voice-clone-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// 将验证错误转换为用户友好的中文消息
func getValidationErrorMsg(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, fieldError := range validationErrors {
			field := fieldError.Field()
			tag := fieldError.Tag()

			// 根据字段和标签返回友好的错误消息
			switch field {
			case "Email":
				if tag == "required" {
					return "请输入邮箱地址"
				} else if tag == "email" {
					return "邮箱格式不正确"
				}
			case "Password":
				if tag == "required" {
					return "请输入密码"
				} else if tag == "min" {
					return "密码长度不能少于 6 个字符"
				}
			case "LoginID":
				if tag == "required" {
					return "请输入邮箱或手机号"
				}
			case "Phone":
				if tag == "required" {
					return "请输入手机号"
				}
			case "SmsCode":
				if tag == "required" {
					return "请输入短信验证码"
				}
			}
		}
	}

	// 如果无法解析，返回通用错误消息
	return "请求参数错误，请检查输入"
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
	SmsCode  string `json:"sms_code"` // 短信验证码（如果使用手机注册）
}

type LoginRequest struct {
	LoginID  string `json:"login_id" binding:"required"`  // 邮箱或手机号
	Password string `json:"password" binding:"required"`
}

type SendSMSRequest struct {
	Phone string `json:"phone" binding:"required"`
}

// 发送短信验证码
func SendSMS(c *gin.Context) {
	var req SendSMSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("SendSMS binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": getValidationErrorMsg(err)})
		return
	}

	// 验证手机号格式
	phoneRegex := regexp.MustCompile(`^1[3-9]\d{9}$`)
	if !phoneRegex.MatchString(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "手机号格式不正确"})
		return
	}

	// 发送短信验证码
	err := services.SendSMSCode(req.Phone)
	if err != nil {
		log.Printf("SendSMS service error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送验证码失败，请稍后重试"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "验证码已发送"})
}

// 用户注册
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 添加详细日志
		log.Printf("Register binding error: %v", err)
		// 返回用户友好的错误消息
		c.JSON(http.StatusBadRequest, gin.H{"error": getValidationErrorMsg(err)})
		return
	}

	// 打印接收到的请求数据（调试用）
	log.Printf("Register request - Email: %s, Phone: %s, HasPassword: %v, HasSmsCode: %v",
		req.Email, req.Phone, req.Password != "", req.SmsCode != "")

	var phonePtr *string
	if req.Phone != "" {
		phone := req.Phone
		phonePtr = &phone
	}

	// 如果提供了手机号，验证短信验证码
	if req.Phone != "" {
		if req.SmsCode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "请提供短信验证码"})
			return
		}

		valid, err := services.VerifySMSCode(req.Phone, req.SmsCode)
		if err != nil || !valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "验证码错误或已过期"})
			return
		}
	}

	// 检查邮箱是否已存在
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "该邮箱已被注册"})
		return
	}

	// 检查手机号是否已存在
	if req.Phone != "" {
		if err := database.DB.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "该手机号已被注册"})
			return
		}
	}

	// 哈希密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
		return
	}

	// 创建用户
	user := models.User{
		Email:        req.Email,
		Phone:        phonePtr,
		PasswordHash: hashedPassword,
		Nickname:     req.Nickname,
		Credits:      config.AppConfig.Credits.Initial, // 初始积分
		IsAdmin:      false,
		IsActive:     true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建用户失败"})
		return
	}

	// 如果有初始积分，记录交易
	if config.AppConfig.Credits.Initial > 0 {
		transaction := models.CreditTransaction{
			UserID:      user.ID,
			Amount:      config.AppConfig.Credits.Initial,
			Type:        "register_bonus",
			Description: "注册赠送积分",
		}
		database.DB.Create(&transaction)
	}

	// 生成JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败"})
		return
	}

	phoneValue := ""
	if user.Phone != nil {
		phoneValue = *user.Phone
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"token":   token,
		"user": gin.H{
			"id":              user.ID,
			"email":           user.Email,
			"phone":           phoneValue,
			"nickname":        user.Nickname,
			"credits":         user.Credits,
			"is_admin":        user.IsAdmin,
			"vip_level":       user.VIPLevel,
			"vip_expires_at":  user.VIPExpiresAt,
		},
	})
}

// 用户登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 添加详细日志
		log.Printf("Login binding error: %v", err)
		// 返回用户友好的错误消息
		c.JSON(http.StatusBadRequest, gin.H{"error": getValidationErrorMsg(err)})
		return
	}

	// 打印接收到的请求数据（调试用）
	log.Printf("Login request - LoginID: %s, HasPassword: %v", req.LoginID, req.Password != "")

	var user models.User
	// 尝试通过邮箱或手机号查找用户
	if err := database.DB.Where("email = ? OR phone = ?", req.LoginID, req.LoginID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在或密码错误"})
		return
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在或密码错误"})
		return
	}

	// 检查账号是否激活
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "账号已被禁用"})
		return
	}

	// 生成JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败"})
		return
	}

	phoneValue := ""
	if user.Phone != nil {
		phoneValue = *user.Phone
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user": gin.H{
			"id":              user.ID,
			"email":           user.Email,
			"phone":           phoneValue,
			"nickname":        user.Nickname,
			"credits":         user.Credits,
			"is_admin":        user.IsAdmin,
			"vip_level":       user.VIPLevel,
			"vip_expires_at":  user.VIPExpiresAt,
		},
	})
}

// 获取当前用户信息
func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, user.ToUserProfileResponse())
}

// SMS登录请求
type LoginWithSMSRequest struct {
	Phone   string `json:"phone" binding:"required"`
	SmsCode string `json:"sms_code" binding:"required"`
}

// SMS验证码登录
func LoginWithSMS(c *gin.Context) {
	var req LoginWithSMSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("LoginWithSMS binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": getValidationErrorMsg(err)})
		return
	}

	// 验证短信验证码
	valid, err := services.VerifySMSCode(req.Phone, req.SmsCode)
	if err != nil || !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "验证码错误或已过期"})
		return
	}

	// 查找用户
	var user models.User
	if err := database.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "该手机号未注册"})
		return
	}

	// 检查用户是否被禁用
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "账号已被禁用"})
		return
	}

	// 生成JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "生成token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user":    user.ToUserProfileResponse(),
	})
}

// 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"` // camelCase
	NewPassword string `json:"newPassword" binding:"required,min=6"` // camelCase
}

// 修改密码
func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "请求参数错误: " + err.Error()})
		return
	}

	// 获取用户
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "用户不存在"})
		return
	}

	// 验证旧密码
	if !utils.CheckPassword(req.OldPassword, user.PasswordHash) {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "原密码错误"})
		return
	}

	// 哈希新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "密码加密失败"})
		return
	}

	// 更新密码
	user.PasswordHash = hashedPassword
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "密码更新失败"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{Message: "密码修改成功"})
}
