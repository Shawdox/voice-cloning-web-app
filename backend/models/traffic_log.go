package models

import "time"

type TrafficLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	EventType  string    `gorm:"index;not null" json:"event_type"`
	Endpoint   string    `json:"endpoint"`
	UserID     *uint     `gorm:"index" json:"user_id"`
	RequestID  string    `json:"request_id"`
	StatusCode int       `json:"status_code"`
	LatencyMs  int       `json:"latency_ms"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}
