package handlers

import (
	"net/http"
	"path/filepath"
	"strings"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
	"voice-clone-backend/services"

	"github.com/gin-gonic/gin"
)

// 允许的音频文件格式
var allowedAudioFormats = map[string]bool{
	".mp3":  true,
	".wav":  true,
	".m4a":  true,
	".ogg":  true,
	".flac": true,
	".aac":  true,
}

// 上传音频文件
func UploadAudio(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传音频文件"})
		return
	}

	// 检查文件大小（50MB限制）
	maxSize := int64(50 * 1024 * 1024) // 50MB
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小超过50MB限制"})
		return
	}

	// 检查文件格式
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedAudioFormats[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":           "不支持的文件格式",
			"allowed_formats": []string{".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"},
		})
		return
	}

	// 打开文件
	fileReader, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer fileReader.Close()

	// 上传到OSS
	fileURL, err := services.UploadFile(fileReader, file.Filename, "voices")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件上传失败: " + err.Error()})
		return
	}

	// 保存到数据库
	userID := c.MustGet("user_id").(uint)
	uploadedFile := models.UploadedFile{
		UserID:   userID,
		Filename: file.Filename,
		FileURL:  fileURL,
		Size:     file.Size,
		Type:     "audio",
	}

	if err := database.DB.Create(&uploadedFile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件记录失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"file_url": fileURL,
		"filename": file.Filename,
		"size":     file.Size,
		"id":       uploadedFile.ID,
	})
}

// GetUploadedFiles 获取已上传的文件列表
func GetUploadedFiles(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	fileType := c.DefaultQuery("type", "audio")

	var files []models.UploadedFile
	if err := database.DB.Where("user_id = ? AND type = ?", userID, fileType).Order("created_at DESC").Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件列表失败"})
		return
	}

	c.JSON(http.StatusOK, files)
}

// DeleteUploadedFile 删除已上传的文件
func DeleteUploadedFile(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	fileID := c.Param("id")

	var file models.UploadedFile
	if err := database.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 1. 从OSS删除
	// 解析FileURL获取objectKey
	// URL格式: https://bucket.endpoint/folder/hash.ext
	objectKey := ""
	if parts := strings.Split(file.FileURL, ".com/"); len(parts) > 1 {
		objectKey = parts[1]
	} else if parts := strings.Split(file.FileURL, ".net/"); len(parts) > 1 {
		objectKey = parts[1]
	}
	// 更通用的解析方式（根据项目配置）
	if objectKey == "" {
		u, _ := interface{}(file.FileURL).(string) // dummy
		_ = u
		// 如果无法简单解析，尝试根据 / 拆分，通常是最后一部分或者最后两部分
		// 在本项目中，objectKey 是 "voices/hash.ext"
		if idx := strings.Index(file.FileURL, "voices/"); idx != -1 {
			objectKey = file.FileURL[idx:]
		} else if idx := strings.Index(file.FileURL, "texts/"); idx != -1 {
			objectKey = file.FileURL[idx:]
		}
	}

	if objectKey != "" {
		services.DeleteFile(objectKey)
	}

	// 2. 从数据库删除
	if err := database.DB.Delete(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "文件删除成功"})
}

// 上传文本文件（用于批量TTS）
func UploadText(c *gin.Context) {
	file, err := c.FormFile("text")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文本文件"})
		return
	}

	// 检查文件格式
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".txt" && ext != ".docx" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "仅支持 .txt 和 .docx 格式"})
		return
	}

	// 检查文件大小（5MB限制）
	maxSize := int64(5 * 1024 * 1024)
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小超过5MB限制"})
		return
	}

	// 打开文件
	fileReader, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer fileReader.Close()

	// 上传到OSS
	fileURL, err := services.UploadFile(fileReader, file.Filename, "texts")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件上传失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"file_url": fileURL,
		"filename": file.Filename,
	})
}
