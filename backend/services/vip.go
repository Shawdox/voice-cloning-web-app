package services

import (
	"time"
	"voice-clone-backend/models"
)

// IsVIPActive checks if user is VIP and not expired
func IsVIPActive(user *models.User) bool {
	if user.VIPLevel <= 0 {
		return false
	}

	// If no expiration date, VIP is permanent
	if user.VIPExpiresAt == nil {
		return true
	}

	// Check if VIP has expired
	return user.VIPExpiresAt.After(time.Now())
}

// GetVIPDiscount returns the discount multiplier based on VIP level
// Returns 1.0 (no discount), 0.8 (20% off), or 0.69 (31% off)
func GetVIPDiscount(vipLevel int) float64 {
	switch vipLevel {
	case 2:
		return 0.69 // 超级VIP: 69折
	case 1:
		return 0.8 // VIP: 8折
	default:
		return 1.0 // 普通用户: 无折扣
	}
}

// CalculateVoiceCloneCost calculates the cost of voice cloning based on VIP level and transcript option
func CalculateVoiceCloneCost(vipLevel int, withTranscript bool) int {
	baseCost := 50 // without_transcript base cost

	if !withTranscript {
		return baseCost
	}

	// with_transcript costs more
	transcriptCost := 100 // base cost for with_transcript

	// Apply VIP discount
	discount := GetVIPDiscount(vipLevel)
	finalCost := float64(transcriptCost) * discount

	return int(finalCost)
}
