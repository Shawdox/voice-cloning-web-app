package models

import "math/rand"

// ToVoiceResponse 将Voice模型转换为VoiceResponse DTO
func (v *Voice) ToVoiceResponse() VoiceResponse {
	resp := VoiceResponse{
		ID:            v.ID,
		Name:          v.Name,
		Type:          "user", // 默认为用户音色
		Status:        v.Status,
		CreatedAt:     v.CreatedAt,
		IsPinned:      v.IsPinned,
		AudioFileURL:  v.AudioFileURL,
		AudioDuration: v.AudioDuration,
		FishVoiceID:   v.FishVoiceID,
		CompletedAt:   v.CompletedAt,
	}

	// 如果状态是processing，添加模拟进度
	if v.Status == "processing" {
		progress := rand.Intn(90) + 10 // 10-99%
		resp.Progress = &progress
	} else if v.Status == "completed" {
		progress := 100
		resp.Progress = &progress
	}

	// 将status映射为前端期望的值
	switch v.Status {
	case "pending", "processing":
		resp.Status = "training"
	case "completed":
		resp.Status = "ready"
	case "failed":
		resp.Status = "failed"
	}

	return resp
}

// ToTTSTaskResponse 将TTSTask模型转换为TTSTaskResponse DTO
func (t *TTSTask) ToTTSTaskResponse(voiceName string) TTSTaskResponse {
	return TTSTaskResponse{
		ID:            t.ID,
		VoiceID:       t.VoiceID,
		VoiceName:     voiceName,
		Text:          t.Text,
		Emotion:       t.Emotion,
		AudioURL:      t.AudioURL,
		AudioDuration: t.AudioDuration,
		Status:        t.Status,
		Date:          t.CreatedAt,
		CompletedAt:   t.CompletedAt,
	}
}

// ToUserProfileResponse 将User模型转换为UserProfileResponse DTO
func (u *User) ToUserProfileResponse() UserProfileResponse {
	phone := ""
	if u.Phone != nil {
		phone = *u.Phone
	}

	return UserProfileResponse{
		ID:           u.ID,
		Email:        u.Email,
		Phone:        phone,
		Nickname:     u.Nickname,
		Avatar:       u.Avatar,
		Points:       u.Credits, // 重命名为points
		VIPLevel:     u.VIPLevel,
		VIPExpiresAt: u.VIPExpiresAt,
		CreatedAt:    u.CreatedAt,
	}
}

// ToTransactionResponse 将CreditTransaction转换为TransactionResponse DTO
func (ct *CreditTransaction) ToTransactionResponse() TransactionResponse {
	return TransactionResponse{
		ID:          ct.ID,
		Amount:      ct.Amount,
		Type:        ct.Type,
		Description: ct.Description,
		OrderNo:     ct.OrderNo,
		CreatedAt:   ct.CreatedAt,
	}
}

// ToRechargeOrderResponse 将RechargeOrder转换为RechargeOrderResponse DTO
func (ro *RechargeOrder) ToRechargeOrderResponse() RechargeOrderResponse {
	return RechargeOrderResponse{
		OrderNo:     ro.OrderNo,
		Amount:      ro.Amount,
		Points:      ro.Credits, // 重命名为points
		PaymentType: ro.PaymentType,
		Status:      ro.Status,
		CreatedAt:   ro.CreatedAt,
		PaidAt:      ro.PaidAt,
	}
}
