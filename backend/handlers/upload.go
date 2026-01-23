package handlers

import (
	"net/http"
	"path/filepath"
	"strings"
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

	c.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"file_url": fileURL,
		"filename": file.Filename,
		"size":     file.Size,
	})
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
