package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
	"voice-clone-backend/config"
)

// 获取Fish Audio余额
func GetFishAudioBalance() (map[string]interface{}, error) {
	if fishClient == nil {
		return nil, fmt.Errorf("Fish Audio service not initialized")
	}

	url := fmt.Sprintf("%s/wallet/self/api-credit", fishClient.BaseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+config.AppConfig.FishAudio.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Fish Audio API error: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}
