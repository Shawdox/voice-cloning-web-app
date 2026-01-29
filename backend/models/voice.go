package models

import (
	"time"

	"gorm.io/gorm"
)

// 音色模型
type Voice struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint   `gorm:"index;not null" json:"user_id"`
	Name   string `gorm:"size:100;not null" json:"name"` // 用户自定义音色名称

	// Fish Audio 相关
	FishVoiceID   *string `gorm:"size:255;uniqueIndex" json:"fish_voice_id,omitempty"` // Fish Audio返回的voice_id
	AudioFileURL  string  `gorm:"size:500" json:"audio_file_url"`                      // OSS上的音频文件URL
	AudioFileName string  `gorm:"size:255" json:"audio_file_name"`                     // 原始文件名
	AudioDuration float64 `json:"audio_duration"`                                      // 音频时长（秒）

	// 任务状态
	Status      string     `gorm:"size:20;not null;default:'pending'" json:"status"` // pending, processing, completed, failed
	ErrorMsg    string     `gorm:"type:text" json:"error_msg,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`

	// 转录相关
	WithTranscript bool   `gorm:"default:false;not null" json:"with_transcript"` // 是否使用转录
	Transcript     string `gorm:"type:text" json:"transcript,omitempty"`         // 音频转录文本

	// 用户偏好
	IsPinned bool `gorm:"default:false;not null" json:"is_pinned"` // 是否置顶

	// 关联
	User     User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TTSTasks []TTSTask `gorm:"foreignKey:VoiceID" json:"tts_tasks,omitempty"`
}

// TTS生成任务
type TTSTask struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID  uint `gorm:"index;not null" json:"user_id"`
	VoiceID uint `gorm:"index;not null" json:"voice_id"`

	Text          string  `gorm:"type:text;not null" json:"text"`      // 要合成的文本
	TextLength    int     `json:"text_length"`                         // 文本长度
	Emotion       string  `gorm:"size:50" json:"emotion,omitempty"`    // 情感标签
	Format        string  `gorm:"size:10;default:'mp3'" json:"format"` // 音频格式: mp3, wav, pcm, opus
	AudioURL      string  `gorm:"size:500" json:"audio_url,omitempty"` // 生成的音频文件URL
	AudioDuration float64 `json:"audio_duration"`                      // 音频时长（秒）

	// Fish Audio 任务ID（如果API返回）
	FishTaskID string `gorm:"size:255" json:"fish_task_id,omitempty"`

	// 任务状态
	Status      string     `gorm:"size:20;not null;default:'pending'" json:"status"` // pending, processing, completed, failed
	ErrorMsg    string     `gorm:"type:text" json:"error_msg,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`

	// 关联
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Voice Voice `gorm:"foreignKey:VoiceID" json:"voice,omitempty"`
}

// 已上传的音频文件模型
type UploadedFile struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID   uint   `gorm:"index;not null" json:"user_id"`
	Filename string `gorm:"size:255;not null" json:"filename"`
	FileURL  string `gorm:"size:500;not null" json:"file_url"`
	Size     int64  `json:"size"`
	Type     string `gorm:"size:20;default:'audio'" json:"type"` // audio, text
}
