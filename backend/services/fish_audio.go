package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
)

// Fish Audio API 客户端
type FishAudioClient struct {
	APIKey  string
	BaseURL string
	client  *http.Client
}

var fishClient *FishAudioClient

type fishRetryOptions struct {
	MaxAttempts int
	BaseDelay   time.Duration
	MaxDelay    time.Duration
}

var defaultFishRetry = fishRetryOptions{
	MaxAttempts: 5,
	BaseDelay:   500 * time.Millisecond,
	MaxDelay:    5 * time.Second,
}

func (c *FishAudioClient) doRequestWithRetry(op string, makeReq func() (*http.Request, error)) (int, http.Header, []byte, error) {
	var lastErr error
	var lastStatus int
	var lastBody []byte
	var lastHeader http.Header

	for attempt := 1; attempt <= defaultFishRetry.MaxAttempts; attempt++ {
		req, err := makeReq()
		if err != nil {
			return 0, nil, nil, err
		}

		resp, err := c.client.Do(req)
		if err == nil && resp != nil {
			lastHeader = resp.Header.Clone()
			body, readErr := io.ReadAll(resp.Body)
			_ = resp.Body.Close()
			if readErr != nil {
				lastErr = readErr
			} else {
				lastErr = nil
				lastStatus = resp.StatusCode
				lastBody = body
			}
		}

		if err != nil {
			lastErr = err
			if attempt < defaultFishRetry.MaxAttempts && isRetryableError(err) {
				d := retryDelay(attempt, 0, nil)
				log.Printf("fish_api_retry op=%s attempt=%d/%d delay_ms=%d err=%v", op, attempt, defaultFishRetry.MaxAttempts, d.Milliseconds(), err)
				time.Sleep(d)
				continue
			}
			return 0, nil, nil, err
		}

		if lastErr != nil {
			if attempt < defaultFishRetry.MaxAttempts {
				d := retryDelay(attempt, 0, nil)
				log.Printf("fish_api_retry op=%s attempt=%d/%d delay_ms=%d err=%v", op, attempt, defaultFishRetry.MaxAttempts, d.Milliseconds(), lastErr)
				time.Sleep(d)
				continue
			}
			return 0, nil, nil, lastErr
		}

		if isRetryableStatus(lastStatus) && attempt < defaultFishRetry.MaxAttempts {
			d := retryDelay(attempt, lastStatus, lastHeader)
			log.Printf("fish_api_retry op=%s attempt=%d/%d status=%d delay_ms=%d", op, attempt, defaultFishRetry.MaxAttempts, lastStatus, d.Milliseconds())
			time.Sleep(d)
			continue
		}

		return lastStatus, lastHeader, lastBody, nil
	}

	if lastErr != nil {
		return 0, lastHeader, lastBody, lastErr
	}
	return lastStatus, lastHeader, lastBody, fmt.Errorf("Fish API error: %s (status: %d)", string(lastBody), lastStatus)
}

func isRetryableStatus(code int) bool {
	return code == http.StatusTooManyRequests || code >= 500
}

func isRetryableError(err error) bool {
	var netErr net.Error
	if errors.As(err, &netErr) {
		return true
	}
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		if urlErr.Timeout() {
			return true
		}
		var innerNetErr net.Error
		if errors.As(urlErr.Err, &innerNetErr) {
			return true
		}
	}
	return false
}

func retryDelay(attempt int, status int, header http.Header) time.Duration {
	if status == http.StatusTooManyRequests && header != nil {
		ra := header.Get("Retry-After")
		if ra != "" {
			if secs, err := strconv.Atoi(strings.TrimSpace(ra)); err == nil && secs > 0 {
				d := time.Duration(secs) * time.Second
				if d > defaultFishRetry.MaxDelay {
					return defaultFishRetry.MaxDelay
				}
				return d
			}
		}
	}

	d := defaultFishRetry.BaseDelay * time.Duration(1<<(attempt-1))
	if d > defaultFishRetry.MaxDelay {
		d = defaultFishRetry.MaxDelay
	}
	return d
}

// 初始化Fish Audio客户端
func InitFishAudio() {
	fishClient = &FishAudioClient{
		APIKey:  config.AppConfig.FishAudio.APIKey,
		BaseURL: config.AppConfig.FishAudio.BaseURL,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// 记录Fish Audio API调用
func logFishAudioAPICall(endpoint string, statusCode int) {
	go func() {
		trafficLog := models.TrafficLog{
			EventType:  "fish_audio_api",
			Endpoint:   endpoint,
			StatusCode: statusCode,
		}
		database.DB.Create(&trafficLog)
	}()
}

// 创建音色请求
type CreateVoiceRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	AudioURL    string `json:"audio_url"` // 音频文件URL
}

// 创建音色响应
type CreateVoiceResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"` // pending, processing, ready, failed
	CreatedAt   string `json:"created_at"`
}

type CreateModelResponse struct {
	ID        string `json:"id"`
	AltID     string `json:"_id"`
	Title     string `json:"title"`
	State     string `json:"state"` // created, training, trained, failed
	CreatedAt string `json:"created_at"`
}

// ASR响应
type ASRResponse struct {
	Text string `json:"text"`
}

// TranscribeAudio transcribes audio using Fish Audio ASR API
func TranscribeAudio(audioData []byte, language string) (string, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add audio file
	part, err := writer.CreateFormFile("audio", "audio.mp3")
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, bytes.NewReader(audioData)); err != nil {
		return "", err
	}

	// Add language field
	_ = writer.WriteField("language", language)

	writer.Close()

	apiURL := fmt.Sprintf("%s/asr/transcribe", fishClient.BaseURL)
	statusCode, _, body, err := fishClient.doRequestWithRetry("asr_transcribe", func() (*http.Request, error) {
		req, err := http.NewRequest("POST", apiURL, bytes.NewReader(buf.Bytes()))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		return req, nil
	})
	if err != nil {
		return "", err
	}
	if statusCode != http.StatusOK && statusCode != http.StatusCreated {
		return "", fmt.Errorf("Fish ASR API error: %s (status: %d)", string(body), statusCode)
	}

	var result ASRResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	return result.Text, nil
}

// TTS请求
type TTSRequest struct {
	Text        string `json:"text"`
	VoiceID     string `json:"voice_id,omitempty"`
	ReferenceID string `json:"reference_id,omitempty"`
	Format      string `json:"format,omitempty"` // mp3, wav, ogg
}

// TTS响应
type TTSResponse struct {
	TaskID    string  `json:"task_id"`
	Status    string  `json:"status"`
	AudioURL  string  `json:"audio_url,omitempty"`
	Duration  float64 `json:"duration,omitempty"`
	CreatedAt string  `json:"created_at"`
}

// 创建音色
func CreateVoice(name, audioURL string, withTranscript bool, transcript string) (*CreateVoiceResponse, error) {
	// 下载音频（来自OSS/外部URL），加入重试以避免偶发网络抖动
	dlStatus, _, dlBody, err := fishClient.doRequestWithRetry("download_audio", func() (*http.Request, error) {
		fileReq, err := http.NewRequest("GET", audioURL, nil)
		if err != nil {
			return nil, err
		}
		return fileReq, nil
	})
	if err != nil {
		return nil, err
	}
	if dlStatus != http.StatusOK {
		return nil, fmt.Errorf("download audio error: %s (status: %d)", string(dlBody), dlStatus)
	}

	filename := "voice_sample"
	if u, err := url.Parse(audioURL); err == nil {
		base := path.Base(u.Path)
		if base != "." && base != "/" && base != "" {
			filename = base
		}
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	_ = writer.WriteField("type", "tts")
	_ = writer.WriteField("title", name)
	_ = writer.WriteField("train_mode", "fast")
	_ = writer.WriteField("visibility", "private")
	_ = writer.WriteField("enhance_audio_quality", "true")

	// Add transcript if provided
	if withTranscript && transcript != "" {
		_ = writer.WriteField("texts", fmt.Sprintf("[\"%s\"]", transcript))
	}

	part, err := writer.CreateFormFile("voices", filename)
	if err != nil {
		writer.Close()
		return nil, err
	}
	if _, err := io.Copy(part, bytes.NewReader(dlBody)); err != nil {
		writer.Close()
		return nil, err
	}
	writer.Close()

	apiURL := fmt.Sprintf("%s/model", fishClient.BaseURL)
	statusCode, _, body, err := fishClient.doRequestWithRetry("create_model", func() (*http.Request, error) {
		createReq, err := http.NewRequest("POST", apiURL, bytes.NewReader(buf.Bytes()))
		if err != nil {
			return nil, err
		}
		createReq.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		createReq.Header.Set("Content-Type", writer.FormDataContentType())
		return createReq, nil
	})
	if err != nil {
		return nil, err
	}
	if statusCode != http.StatusOK && statusCode != http.StatusCreated {
		return nil, fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}

	var model CreateModelResponse
	if err := json.Unmarshal(body, &model); err != nil {
		return nil, err
	}
	if model.ID == "" {
		model.ID = model.AltID
	}
	if model.ID == "" {
		return nil, fmt.Errorf("Fish API error: missing model id")
	}

	status := "pending"
	switch model.State {
	case "created", "training":
		status = "processing"
	case "trained":
		status = "ready"
	case "failed":
		status = "failed"
	}

	result := CreateVoiceResponse{
		ID:        model.ID,
		Name:      model.Title,
		Status:    status,
		CreatedAt: model.CreatedAt,
	}

	return &result, nil
}

// 查询音色状态
func GetVoiceStatus(voiceID string) (*CreateVoiceResponse, error) {
	apiURL := fmt.Sprintf("%s/model/%s", fishClient.BaseURL, voiceID)
	statusCode, _, body, err := fishClient.doRequestWithRetry("get_model", func() (*http.Request, error) {
		req, err := http.NewRequest("GET", apiURL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		return req, nil
	})
	if err != nil {
		return nil, err
	}
	if statusCode != http.StatusOK {
		return nil, fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}

	var model CreateModelResponse
	if err := json.Unmarshal(body, &model); err != nil {
		return nil, err
	}

	status := "pending"
	switch model.State {
	case "created", "training":
		status = "processing"
	case "trained":
		status = "ready"
	case "failed":
		status = "failed"
	}

	result := CreateVoiceResponse{
		ID:        model.ID,
		Name:      model.Title,
		Status:    status,
		CreatedAt: model.CreatedAt,
	}

	return &result, nil
}

// 删除音色
func DeleteVoice(voiceID string) error {
	apiURL := fmt.Sprintf("%s/model/%s", fishClient.BaseURL, voiceID)
	statusCode, _, body, err := fishClient.doRequestWithRetry("delete_model", func() (*http.Request, error) {
		req, err := http.NewRequest("DELETE", apiURL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		return req, nil
	})
	if err != nil {
		return err
	}
	if statusCode != http.StatusOK && statusCode != http.StatusNoContent && statusCode != http.StatusAccepted {
		return fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}
	return nil
}

// 生成语音（TTS）
func GenerateSpeech(text, voiceID string, speed float64, format string) (*TTSResponse, error) {
	// 默认MP3格式
	if format == "" {
		format = "mp3"
	}

	reqBody := TTSRequest{
		Text:        text,
		ReferenceID: voiceID,
		Format:      format,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf("%s/v1/tts", fishClient.BaseURL)
	statusCode, header, body, err := fishClient.doRequestWithRetry("tts", func() (*http.Request, error) {
		req, err := http.NewRequest("POST", apiURL, bytes.NewReader(jsonData))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("model", "s1")
		// Add speed parameter
		if speed > 0 {
			req.Header.Set("speed", fmt.Sprintf("%.2f", speed))
		}
		return req, nil
	})

	// 记录API调用
	logFishAudioAPICall("/v1/tts", statusCode)

	if err != nil {
		return nil, err
	}
	if statusCode != http.StatusOK && statusCode != http.StatusCreated {
		return nil, fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}

	var result TTSResponse
	if err := json.Unmarshal(body, &result); err == nil {
		return &result, nil
	}

	contentType := ""
	if header != nil {
		contentType = header.Get("Content-Type")
	}
	if strings.Contains(contentType, "application/json") || strings.Contains(contentType, "application/msgpack") {
		return nil, fmt.Errorf("Fish API error: unexpected response (content-type: %s)", contentType)
	}

	// 使用正确的文件扩展名
	fileExt := format
	if format == "pcm" {
		fileExt = "wav" // PCM通常以WAV容器封装
	}
	filename := fmt.Sprintf("tts_%d.%s", time.Now().UnixNano(), fileExt)
	audioURL, err := UploadFile(bytes.NewReader(body), filename, "tts")
	if err != nil {
		return nil, err
	}

	result = TTSResponse{
		Status:   "completed",
		AudioURL: audioURL,
	}
	return &result, nil
}

// 查询TTS任务状态
func GetTTSTaskStatus(taskID string) (*TTSResponse, error) {
	apiURL := fmt.Sprintf("%s/v1/tts/tasks/%s", fishClient.BaseURL, taskID)
	statusCode, _, body, err := fishClient.doRequestWithRetry("tts_task_status", func() (*http.Request, error) {
		req, err := http.NewRequest("GET", apiURL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		return req, nil
	})
	if err != nil {
		return nil, err
	}
	if statusCode != http.StatusOK {
		return nil, fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}

	var result TTSResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// 上传音频文件到Fish Audio（如果API支持直接上传）
func UploadAudioToFish(fileReader io.Reader, filename string) (string, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("audio", filename)
	if err != nil {
		return "", err
	}

	_, err = io.Copy(part, fileReader)
	if err != nil {
		return "", err
	}

	writer.Close()

	apiURL := fmt.Sprintf("%s/v1/upload", fishClient.BaseURL)
	statusCode, _, body, err := fishClient.doRequestWithRetry("upload", func() (*http.Request, error) {
		req, err := http.NewRequest("POST", apiURL, bytes.NewReader(buf.Bytes()))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+fishClient.APIKey)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		return req, nil
	})
	if err != nil {
		return "", err
	}
	if statusCode != http.StatusOK && statusCode != http.StatusCreated {
		return "", fmt.Errorf("Fish API error: %s (status: %d)", string(body), statusCode)
	}

	var result struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	return result.URL, nil
}

// Fish Model Entity
type FishModelEntity struct {
	ID          string       `json:"_id"`
	Type        string       `json:"type"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	CoverImage  string       `json:"cover_image"`
	Languages   []string     `json:"languages"`
	Tags        []string     `json:"tags"`
	Samples     []FishSample `json:"samples"`
	CreatedAt   string       `json:"created_at"`
}

// Fish Sample
type FishSample struct {
	Title string `json:"title"`
	Text  string `json:"text"`
	Audio string `json:"audio"`
}

// List Models Response
type FishListModelsResponse struct {
	Total int               `json:"total"`
	Items []FishModelEntity `json:"items"`
}

// PredefinedVoice for API response
type PredefinedVoice struct {
	FishVoiceID string   `json:"fish_voice_id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Language    string   `json:"language"`
	Gender      string   `json:"gender"`
	CoverImage  string   `json:"cover_image"`
	SampleURL   string   `json:"sample_url"`
	SampleText  string   `json:"sample_text"`
	Tags        []string `json:"tags"`
}

// ListPredefinedVoices returns 8 predefined voices: male/female in Chinese, English, Japanese, Korean
// Hardcoded for performance - no need to fetch from Fish Audio API every time
func ListPredefinedVoices() ([]PredefinedVoice, error) {
	// Hardcoded predefined voices with all necessary data
	voices := []PredefinedVoice{
		{
			FishVoiceID: "ca8fb681ce2040958c15ede5eef86177",
			Name:        "郑翔洲",
			Description: "专业男声，适合商务和教育内容",
			Language:    "zh",
			Gender:      "male",
			CoverImage:  "coverimage/ca8fb681ce2040958c15ede5eef86177",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/dfb8a41d5bcc419881fed861a121e648.mp3",
			SampleText:  "在当今快速变化的商业环境中，企业要始终保持创新思维。",
			Tags:        []string{"男声", "中文", "专业"},
		},
		{
			FishVoiceID: "7f92f8afb8ec43bf81429cc1c9199cb1",
			Name:        "AD学姐",
			Description: "温柔女声，适合情感和叙事内容",
			Language:    "zh",
			Gender:      "female",
			CoverImage:  "coverimage/7f92f8afb8ec43bf81429cc1c9199cb1",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/d21a6aa4d72348efa0d17bfd1df81f62.wav",
			SampleText:  "刀不锋利马太瘦，你拿什么跟我斗",
			Tags:        []string{"女声", "中文", "温柔", "御姐"},
		},
		{
			FishVoiceID: "802e3bc2b27e49c2995d23ef70e6ac89",
			Name:        "Energetic Male",
			Description: "充满活力的英文男声",
			Language:    "en",
			Gender:      "male",
			CoverImage:  "coverimage/802e3bc2b27e49c2995d23ef70e6ac89",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/04c54aec083e49feb366d3ec0578a8f6.mp3",
			SampleText:  "Hey there! After months of intensive development, Fish Audio 1.5 has just launched.",
			Tags:        []string{"male", "english", "energetic"},
		},
		{
			FishVoiceID: "b545c585f631496c914815291da4e893",
			Name:        "Friendly Women",
			Description: "友好的英文女声",
			Language:    "en",
			Gender:      "female",
			CoverImage:  "coverimage/b545c585f631496c914815291da4e893",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/fb8a6491fb0e44d78fca36b0d357050c.mp3",
			SampleText:  "Hey there, fabulous AI enthusiasts! I'm thrilled to sparkle through your speakers.",
			Tags:        []string{"female", "english", "friendly"},
		},
		{
			FishVoiceID: "8f99ad75c8184f1db0c21d3a906445a4",
			Name:        "士道",
			Description: "温和的日文男声",
			Language:    "ja",
			Gender:      "male",
			CoverImage:  "coverimage/8f99ad75c8184f1db0c21d3a906445a4",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/f93d9dbd7c644d1aa5316ed97e248098.mp3",
			SampleText:  "あの、今日は少し忙しいかもしれないけど、できる限り皆の力になりたいと思います。",
			Tags:        []string{"男声", "日语", "温和"},
		},
		{
			FishVoiceID: "5161d41404314212af1254556477c17d",
			Name:        "元気な女性",
			Description: "活泼的日文女声",
			Language:    "ja",
			Gender:      "female",
			CoverImage:  "coverimage/5161d41404314212af1254556477c17d",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/425d7fcc3d524da493fbabd9504ea87d.mp3",
			SampleText:  "みなさん、こんにちは！最近、新しいドラマの撮影が始まったんですけど、とても楽しく頑張っています。",
			Tags:        []string{"女声", "日语", "活泼"},
		},
		{
			FishVoiceID: "078c1b6c34714bba92371c3386716823",
			Name:        "韩男",
			Description: "温暖的韩文男声",
			Language:    "ko",
			Gender:      "male",
			CoverImage:  "coverimage/078c1b6c34714bba92371c3386716823",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/5edd92ca81684219a7a6482f4c8a253c.mp3",
			SampleText:  "봄날 아침, 그녀는 창가에 앉아 꽃잎을 바라봤어요.",
			Tags:        []string{"男声", "韩语", "温暖"},
		},
		{
			FishVoiceID: "9aae54921dd944948ee08d35f6b5f984",
			Name:        "유라-기쁨-",
			Description: "愉悦的韩文女声",
			Language:    "ko",
			Gender:      "female",
			CoverImage:  "coverimage/9aae54921dd944948ee08d35f6b5f984",
			SampleURL:   "https://c97f3361a1c971323738e24f451a0225.r2.cloudflarestorage.com/fish-platform-data/task/e5596d8e455f4278a2e0e8dbc79ff29e.mp3",
			SampleText:  "젊은 부부의 저녁 식사 시간이었다. 아내는 매일 정성스럽게 요리를 했지만 남편은 휴대폰만 보며 밥을 먹었다.",
			Tags:        []string{"女声", "韩语", "愉悦"},
		},
	}

	return voices, nil
}
