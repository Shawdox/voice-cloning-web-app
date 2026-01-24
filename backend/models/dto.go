package models

import "time"

// VoiceResponse 音色响应DTO (camelCase for frontend)
type VoiceResponse struct {
	ID            uint       `json:"id"`
	Name          string     `json:"name"`
	Type          string     `json:"type"` // "user" or "system"
	Status        string     `json:"status"`
	Progress      *int       `json:"progress,omitempty"` // 0-100
	CreatedAt     time.Time  `json:"createdAt"`
	Tag           string     `json:"tag,omitempty"`
	IsPinned      bool       `json:"isPinned"`
	AudioFileURL  string     `json:"audioFileUrl,omitempty"`
	AudioDuration float64    `json:"audioDuration,omitempty"`
	FishVoiceID   *string    `json:"fishVoiceId,omitempty"`
	CompletedAt   *time.Time `json:"completedAt,omitempty"`
}

// TTSTaskResponse TTS任务响应DTO (camelCase for frontend)
type TTSTaskResponse struct {
	ID            uint       `json:"id"`
	VoiceID       uint       `json:"voiceId"`
	VoiceName     string     `json:"voiceName"`
	Text          string     `json:"text"`
	Emotion       string     `json:"emotion,omitempty"`
	AudioURL      string     `json:"audioUrl,omitempty"`
	AudioDuration float64    `json:"audioDuration,omitempty"`
	Status        string     `json:"status"`
	Date          time.Time  `json:"date"` // CreatedAt
	CompletedAt   *time.Time `json:"completedAt,omitempty"`
}

// UserProfileResponse 用户信息响应DTO
type UserProfileResponse struct {
	ID           uint       `json:"id"`
	Email        string     `json:"email"`
	Phone        string     `json:"phone,omitempty"`
	Nickname     string     `json:"nickname,omitempty"`
	Avatar       string     `json:"avatar,omitempty"`
	Points       int        `json:"points"` // renamed from Credits
	VIPLevel     int        `json:"vipLevel"`
	VIPExpiresAt *time.Time `json:"vipExpiresAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// PointsBalanceResponse 积分余额响应
type PointsBalanceResponse struct {
	Points int `json:"points"`
}

// TransactionResponse 交易记录响应DTO
type TransactionResponse struct {
	ID          uint      `json:"id"`
	Amount      int       `json:"amount"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	OrderNo     string    `json:"orderNo,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// VIPStatusResponse VIP状态响应
type VIPStatusResponse struct {
	IsVIP        bool       `json:"isVip"`
	VIPLevel     int        `json:"vipLevel"`
	VIPExpiresAt *time.Time `json:"vipExpiresAt,omitempty"`
	Benefits     []string   `json:"benefits"`
}

// RechargeOrderResponse 充值订单响应
type RechargeOrderResponse struct {
	OrderNo     string    `json:"orderNo"`
	Amount      float64   `json:"amount"`
	Points      int       `json:"points"`
	PaymentType string    `json:"paymentType"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	PaidAt      *time.Time `json:"paidAt,omitempty"`
}

// PaginatedResponse 分页响应通用结构
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Message string `json:"message"`
}

// SuccessResponse 成功响应
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
