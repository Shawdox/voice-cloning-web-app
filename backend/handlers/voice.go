package handlers

import (
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
	"voice-clone-backend/database"
	"voice-clone-backend/middleware"
	"voice-clone-backend/models"
	"voice-clone-backend/services"

	"github.com/gin-gonic/gin"
)

// 创建音色请求
type CreateVoiceRequest struct {
	Name           string `json:"name" binding:"required"`
	AudioFileURL   string `json:"audioFileUrl" binding:"required"` // camelCase
	AudioFileName  string `json:"audioFileName"`                   // camelCase
	WithTranscript bool   `json:"withTranscript"`                  // camelCase
}

// 更新音色请求
type UpdateVoiceRequest struct {
	IsPinned *bool `json:"isPinned"` // camelCase
}

// 创建音色
func CreateVoice(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestID := middleware.GetRequestID(c)

	var req CreateVoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "请求参数错误: " + err.Error()})
		return
	}

	// 检查并扣除积分
	chargedAmount, err := services.ChargeForVoiceClone(userID, req.WithTranscript)
	if err != nil {
		c.JSON(http.StatusPaymentRequired, models.ErrorResponse{Message: err.Error()})
		return
	}

	// 创建音色记录（状态为pending）
	voice := models.Voice{
		UserID:         userID,
		Name:           req.Name,
		AudioFileURL:   req.AudioFileURL,
		AudioFileName:  req.AudioFileName,
		WithTranscript: req.WithTranscript,
		Status:         "pending",
	}

	if err := database.DB.Create(&voice).Error; err != nil {
		// 如果创建失败，退回积分
		services.AddCredits(userID, chargedAmount, "refund", "音色创建失败，退回积分", "")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "创建音色失败"})
		return
	}

	// 启动异步任务处理音色克隆
	go processVoiceClone(requestID, userID, voice.ID, req.AudioFileURL, req.Name, req.WithTranscript)

	c.JSON(http.StatusCreated, models.SuccessResponse{
		Message: "音色创建任务已提交",
		Data:    voice.ToVoiceResponse(),
	})
}

// 异步处理音色克隆
func processVoiceClone(requestID string, userID uint, voiceID uint, audioURL, name string, withTranscript bool) {
	log.Printf("voice_clone_start request_id=%s user_id=%d voice_id=%d with_transcript=%v", requestID, userID, voiceID, withTranscript)
	// 更新状态为processing
	database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Update("status", "processing")

	var transcript string

	// If with_transcript is enabled, transcribe the audio first
	if withTranscript {
		// Download audio from OSS
		resp, err := http.Get(audioURL)
		if err != nil {
			log.Printf("voice_clone_download_failed request_id=%s voice_id=%d err=%v", requestID, voiceID, err)
		} else {
			defer resp.Body.Close()
			audioData, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("voice_clone_read_audio_failed request_id=%s voice_id=%d err=%v", requestID, voiceID, err)
			} else {
				// Transcribe audio
				transcript, err = services.TranscribeAudio(audioData, "zh")
				if err != nil {
					log.Printf("voice_clone_transcribe_failed request_id=%s voice_id=%d err=%v", requestID, voiceID, err)
					// Continue without transcript - don't fail the entire process
				} else {
					log.Printf("voice_clone_transcribed request_id=%s voice_id=%d transcript_length=%d", requestID, voiceID, len(transcript))
					// Save transcript to database
					database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Update("transcript", transcript)
				}
			}
		}
	}

	// 调用Fish Audio API创建音色
	fishResp, err := services.CreateVoice(name, audioURL, withTranscript, transcript)
	if err != nil {
		// 创建失败
		log.Printf("voice_clone_failed request_id=%s user_id=%d voice_id=%d err=%v", requestID, userID, voiceID, err)
		database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Updates(map[string]interface{}{
			"status":    "failed",
			"error_msg": err.Error(),
		})
		return
	}
	log.Printf("voice_clone_fish_created request_id=%s user_id=%d voice_id=%d fish_voice_id=%s", requestID, userID, voiceID, fishResp.ID)

	// 更新Fish Voice ID
	database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Update("fish_voice_id", fishResp.ID)

	// 轮询Fish Audio API检查状态
	maxAttempts := 30
	for i := 0; i < maxAttempts; i++ {
		time.Sleep(10 * time.Second)

		status, err := services.GetVoiceStatus(fishResp.ID)
		if err != nil {
			continue
		}

		if status.Status == "ready" {
			// 成功
			now := time.Now()
			database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Updates(map[string]interface{}{
				"status":       "completed",
				"completed_at": &now,
			})
			log.Printf("voice_clone_completed request_id=%s user_id=%d voice_id=%d fish_voice_id=%s", requestID, userID, voiceID, fishResp.ID)
			return
		} else if status.Status == "failed" {
			// 失败
			database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Updates(map[string]interface{}{
				"status":    "failed",
				"error_msg": "Fish Audio处理失败",
			})
			log.Printf("voice_clone_failed request_id=%s user_id=%d voice_id=%d fish_voice_id=%s err=%s", requestID, userID, voiceID, fishResp.ID, "Fish Audio处理失败")
			return
		}
	}

	// 超时
	database.DB.Model(&models.Voice{}).Where("id = ?", voiceID).Updates(map[string]interface{}{
		"status":    "failed",
		"error_msg": "处理超时",
	})
	log.Printf("voice_clone_failed request_id=%s user_id=%d voice_id=%d fish_voice_id=%s err=%s", requestID, userID, voiceID, fishResp.ID, "处理超时")
}

// 获取音色列表
func GetVoices(c *gin.Context) {
	userID := c.GetUint("user_id")

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20")) // camelCase

	var voices []models.Voice
	var total int64

	// 获取总数
	database.DB.Model(&models.Voice{}).Where("user_id = ?", userID).Count(&total)

	query := database.DB.Where("user_id = ?", userID).Order("is_pinned DESC, created_at DESC")

	// 如果page为0或未提供，返回所有数据
	if page > 0 && pageSize > 0 {
		if pageSize > 100 {
			pageSize = 100
		}
		offset := (page - 1) * pageSize
		query = query.Limit(pageSize).Offset(offset)
	}

	err := query.Find(&voices).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "查询失败"})
		return
	}

	// 转换为DTO
	voiceResponses := make([]models.VoiceResponse, len(voices))
	for i, voice := range voices {
		voiceResponses[i] = voice.ToVoiceResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  voiceResponses,
		"total": total,
	})
}

// 获取单个音色详情
func GetVoice(c *gin.Context) {
	userID := c.GetUint("user_id")
	voiceID := c.Param("id")

	var voice models.Voice
	err := database.DB.Where("id = ? AND user_id = ?", voiceID, userID).First(&voice).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "音色不存在"})
		return
	}

	c.JSON(http.StatusOK, voice.ToVoiceResponse())
}

// 更新音色（置顶/取消置顶）
func UpdateVoice(c *gin.Context) {
	userID := c.GetUint("user_id")
	voiceID := c.Param("id")

	var req UpdateVoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "请求参数错误: " + err.Error()})
		return
	}

	var voice models.Voice
	err := database.DB.Where("id = ? AND user_id = ?", voiceID, userID).First(&voice).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "音色不存在"})
		return
	}

	// 更新isPinned字段
	if req.IsPinned != nil {
		voice.IsPinned = *req.IsPinned
		if err := database.DB.Save(&voice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "更新失败"})
			return
		}
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "更新成功",
		Data:    voice.ToVoiceResponse(),
	})
}

// 删除音色
func DeleteVoice(c *gin.Context) {
	userID := c.GetUint("user_id")
	voiceID := c.Param("id")

	var voice models.Voice
	err := database.DB.Where("id = ? AND user_id = ?", voiceID, userID).First(&voice).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "音色不存在"})
		return
	}

	// 软删除
	if err := database.DB.Delete(&voice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "删除失败"})
		return
	}

	// 同时从Fish Audio删除
	if voice.FishVoiceID != nil && *voice.FishVoiceID != "" {
		go func(fishID string) {
			if err := services.DeleteVoice(fishID); err != nil {
				log.Printf("failed to delete voice from fish audio: %v", err)
			}
		}(*voice.FishVoiceID)
	}

	c.JSON(http.StatusOK, models.SuccessResponse{Message: "音色已删除"})
}

// 查询音色状态
func GetVoiceStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	voiceID := c.Param("id")

	var voice models.Voice
	err := database.DB.Where("id = ? AND user_id = ?", voiceID, userID).First(&voice).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "音色不存在"})
		return
	}

	c.JSON(http.StatusOK, voice.ToVoiceResponse())
}

// 获取系统预定义音色列表
func GetPredefinedVoices(c *gin.Context) {
	voices, err := services.ListPredefinedVoices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "获取预定义音色失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "获取成功",
		Data:    voices,
	})
}
