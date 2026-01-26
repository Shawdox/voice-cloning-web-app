package handlers

import (
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

// 创建TTS任务请求
type CreateTTSRequest struct {
	VoiceID uint    `json:"voiceId" binding:"required"` // camelCase
	Text    string  `json:"text" binding:"required"`
	Emotion string  `json:"emotion"` // 情感标签
	Speed   float64 `json:"speed"`
	Format  string  `json:"format"` // 音频格式: mp3, wav, pcm, opus
}

// 创建TTS任务
func CreateTTS(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestID := middleware.GetRequestID(c)

	var req CreateTTSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "请求参数错误: " + err.Error()})
		return
	}

	// 验证文本长度
	if len(req.Text) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "文本内容不能为空"})
		return
	}
	if len(req.Text) > 10000 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "文本长度不能超过10000字符"})
		return
	}

	// 验证速度参数
	if req.Speed == 0 {
		req.Speed = 1.0
	}
	if req.Speed < 0.5 || req.Speed > 2.0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "速度必须在0.5-2.0之间"})
		return
	}

	// 验证格式参数
	if req.Format == "" {
		req.Format = "mp3" // 默认MP3
	}
	allowedFormats := map[string]bool{"mp3": true, "wav": true, "pcm": true, "opus": true}
	if !allowedFormats[req.Format] {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "格式必须是mp3, wav, pcm或opus之一"})
		return
	}

	// 验证音色是否存在且属于当前用户
	var voice models.Voice
	err := database.DB.Where("id = ? AND user_id = ?", req.VoiceID, userID).First(&voice).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "音色不存在"})
		return
	}

	// 检查音色是否已完成
	if voice.Status != "completed" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "音色尚未完成克隆，请稍后再试"})
		return
	}

	if voice.FishVoiceID == nil || *voice.FishVoiceID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Message: "音色信息不完整，请稍后重试"})
		return
	}

	// 检查并扣除积分
	if err := services.ChargeForTTSGeneration(userID); err != nil {
		c.JSON(http.StatusPaymentRequired, models.ErrorResponse{Message: err.Error()})
		return
	}

	// 创建TTS任务记录
	task := models.TTSTask{
		UserID:     userID,
		VoiceID:    req.VoiceID,
		Text:       req.Text,
		Emotion:    req.Emotion,
		Format:     req.Format,
		TextLength: len(req.Text),
		Status:     "pending",
	}

	if err := database.DB.Create(&task).Error; err != nil {
		// 如果创建失败，退回积分
		services.AddCredits(userID, 10, "refund", "TTS任务创建失败，退回积分", "")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "创建任务失败"})
		return
	}

	// 启动异步任务处理TTS生成
	go processTTSGeneration(requestID, userID, task.ID, req.VoiceID, *voice.FishVoiceID, req.Text, req.Speed, req.Format)

	c.JSON(http.StatusCreated, models.SuccessResponse{
		Message: "TTS任务已提交",
		Data:    task.ToTTSTaskResponse(voice.Name),
	})
}

// 异步处理TTS生成
func processTTSGeneration(requestID string, userID uint, taskID uint, voiceID uint, fishVoiceID, text string, speed float64, format string) {
	log.Printf("tts_start request_id=%s user_id=%d task_id=%d voice_id=%d fish_voice_id=%s speed=%.2f format=%s", requestID, userID, taskID, voiceID, fishVoiceID, speed, format)
	// 更新状态为processing
	database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Update("status", "processing")

	// 调用Fish Audio API生成语音
	fishResp, err := services.GenerateSpeech(text, fishVoiceID, speed, format)
	if err != nil {
		// 生成失败
		log.Printf("tts_failed request_id=%s user_id=%d task_id=%d voice_id=%d fish_voice_id=%s err=%v", requestID, userID, taskID, voiceID, fishVoiceID, err)
		database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
			"status":    "failed",
			"error_msg": err.Error(),
		})
		return
	}

	// 如果Fish Audio立即返回音频URL（同步模式）
	if fishResp.AudioURL != "" {
		now := time.Now()
		database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
			"status":         "completed",
			"audio_url":      fishResp.AudioURL,
			"audio_duration": fishResp.Duration,
			"completed_at":   &now,
		})
		log.Printf("tts_completed request_id=%s user_id=%d task_id=%d voice_id=%d audio_url=%s", requestID, userID, taskID, voiceID, fishResp.AudioURL)
		return
	}

	// 如果是异步模式，保存task_id并轮询
	database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Update("fish_task_id", fishResp.TaskID)
	log.Printf("tts_polling request_id=%s user_id=%d task_id=%d voice_id=%d fish_task_id=%s", requestID, userID, taskID, voiceID, fishResp.TaskID)

	// 轮询Fish Audio API检查状态
	maxAttempts := 30
	for i := 0; i < maxAttempts; i++ {
		time.Sleep(5 * time.Second)

		status, err := services.GetTTSTaskStatus(fishResp.TaskID)
		if err != nil {
			continue
		}

		if status.Status == "completed" || status.AudioURL != "" {
			// 成功
			now := time.Now()
			database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
				"status":         "completed",
				"audio_url":      status.AudioURL,
				"audio_duration": status.Duration,
				"completed_at":   &now,
			})
			log.Printf("tts_completed request_id=%s user_id=%d task_id=%d voice_id=%d audio_url=%s", requestID, userID, taskID, voiceID, status.AudioURL)
			return
		} else if status.Status == "failed" {
			// 失败
			database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
				"status":    "failed",
				"error_msg": "Fish Audio处理失败",
			})
			log.Printf("tts_failed request_id=%s user_id=%d task_id=%d voice_id=%d fish_task_id=%s err=%s", requestID, userID, taskID, voiceID, fishResp.TaskID, "Fish Audio处理失败")
			return
		}
	}

	// 超时
	database.DB.Model(&models.TTSTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":    "failed",
		"error_msg": "处理超时",
	})
	log.Printf("tts_failed request_id=%s user_id=%d task_id=%d voice_id=%d fish_task_id=%s err=%s", requestID, userID, taskID, voiceID, fishResp.TaskID, "处理超时")
}

// 获取TTS任务列表
func GetTTSTasks(c *gin.Context) {
	userID := c.GetUint("user_id")

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20")) // camelCase

	var tasks []models.TTSTask
	var total int64

	// 获取总数
	database.DB.Model(&models.TTSTask{}).Where("user_id = ?", userID).Count(&total)

	query := database.DB.Where("user_id = ?", userID).Preload("Voice").Order("created_at DESC")

	// 如果page为0或未提供，返回所有数据
	if page > 0 && pageSize > 0 {
		if pageSize > 100 {
			pageSize = 100
		}
		offset := (page - 1) * pageSize
		query = query.Limit(pageSize).Offset(offset)
	}

	err := query.Find(&tasks).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "查询失败"})
		return
	}

	// 转换为DTO
	taskResponses := make([]models.TTSTaskResponse, len(tasks))
	for i, task := range tasks {
		voiceName := ""
		if task.Voice.ID != 0 {
			voiceName = task.Voice.Name
		}
		taskResponses[i] = task.ToTTSTaskResponse(voiceName)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  taskResponses,
		"total": total,
	})
}

// 获取单个TTS任务详情
func GetTTSTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskID := c.Param("id")

	var task models.TTSTask
	err := database.DB.Where("id = ? AND user_id = ?", taskID, userID).
		Preload("Voice").
		First(&task).Error

	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "任务不存在"})
		return
	}

	voiceName := ""
	if task.Voice.ID != 0 {
		voiceName = task.Voice.Name
	}

	c.JSON(http.StatusOK, task.ToTTSTaskResponse(voiceName))
}

// 查询TTS任务状态
func GetTTSTaskStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskID := c.Param("id")

	var task models.TTSTask
	err := database.DB.Where("id = ? AND user_id = ?", taskID, userID).Preload("Voice").First(&task).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "任务不存在"})
		return
	}

	voiceName := ""
	if task.Voice.ID != 0 {
		voiceName = task.Voice.Name
	}

	c.JSON(http.StatusOK, task.ToTTSTaskResponse(voiceName))
}

// 删除TTS任务
func DeleteTTSTask(c *gin.Context) {
	userID := c.GetUint("user_id")
	taskID := c.Param("id")

	var task models.TTSTask
	err := database.DB.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Message: "任务不存在"})
		return
	}

	// 软删除
	if err := database.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Message: "删除失败"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{Message: "任务已删除"})
}
