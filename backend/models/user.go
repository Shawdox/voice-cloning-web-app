package models

import (
	"time"

	"gorm.io/gorm"
)

// 用户表
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Email        string `gorm:"uniqueIndex;size:100" json:"email"`
	Phone        *string `gorm:"uniqueIndex;size:20" json:"phone"`
	PasswordHash string `gorm:"size:255;not null" json:"-"`

	Nickname string `gorm:"size:50" json:"nickname"`
	Avatar   string `gorm:"size:255" json:"avatar"`

	Credits  int  `gorm:"default:0;not null" json:"credits"` // 用户积分
	IsAdmin  bool `gorm:"default:false" json:"is_admin"`     // 是否为管理员
	IsActive bool `gorm:"default:true" json:"is_active"`     // 账号是否激活

	// VIP相关
	VIPLevel     int        `gorm:"default:0;not null" json:"vip_level"`      // 0=普通, 1=VIP, 2=超级VIP
	VIPExpiresAt *time.Time `json:"vip_expires_at,omitempty"`                 // VIP过期时间

	// 关联
	Voices             []Voice              `gorm:"foreignKey:UserID" json:"voices,omitempty"`
	TTSTasks           []TTSTask            `gorm:"foreignKey:UserID" json:"tts_tasks,omitempty"`
	CreditTransactions []CreditTransaction  `gorm:"foreignKey:UserID" json:"credit_transactions,omitempty"`
}

// 积分交易记录
type CreditTransaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	UserID      uint   `gorm:"index;not null" json:"user_id"`
	Amount      int    `gorm:"not null" json:"amount"`        // 正数为充值，负数为消费
	Type        string `gorm:"size:20;not null" json:"type"`  // recharge, voice_clone, tts_generation
	Description string `gorm:"size:255" json:"description"`
	OrderNo     string `gorm:"size:100;index" json:"order_no"` // 订单号（充值时使用）

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// 充值订单
type RechargeOrder struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      uint    `gorm:"index;not null" json:"user_id"`
	OrderNo     string  `gorm:"uniqueIndex;size:100;not null" json:"order_no"`
	Amount      float64 `gorm:"not null" json:"amount"`               // 支付金额（元）
	Credits     int     `gorm:"not null" json:"credits"`              // 获得积分
	PaymentType string  `gorm:"size:20;not null" json:"payment_type"` // wechat, alipay
	Status      string  `gorm:"size:20;not null;default:'pending'" json:"status"` // pending, paid, cancelled
	PaidAt      *time.Time `json:"paid_at,omitempty"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
