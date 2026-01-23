package services

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"
	"voice-clone-backend/config"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

type OSSService struct {
	client *oss.Client
	bucket *oss.Bucket
}

var ossService *OSSService

// 初始化OSS服务
func InitOSS() error {
	cfg := config.AppConfig.OSS

	// Create HTTP client with proxy support
	httpClient := &http.Client{
		Timeout: 60 * time.Second,
	}

	// Configure proxy if environment variable is set
	if proxyURL := os.Getenv("https_proxy"); proxyURL != "" {
		if proxy, err := url.Parse(proxyURL); err == nil {
			httpClient.Transport = &http.Transport{
				Proxy: http.ProxyURL(proxy),
			}
		}
	}

	client, err := oss.New(
		fmt.Sprintf("https://%s", cfg.Endpoint),
		cfg.AccessKeyID,
		cfg.AccessKeySecret,
		oss.HTTPClient(httpClient),
		oss.Timeout(30, 60), // 30s connect, 60s read/write
	)
	if err != nil {
		return err
	}

	bucket, err := client.Bucket(cfg.BucketName)
	if err != nil {
		return err
	}

	ossService = &OSSService{
		client: client,
		bucket: bucket,
	}

	return nil
}

// 上传文件到OSS
// 返回值：文件URL, 错误
func UploadFile(fileReader io.Reader, originalFilename string, folder string) (string, error) {
	// 读取文件内容计算MD5
	fileBytes, err := io.ReadAll(fileReader)
	if err != nil {
		return "", err
	}

	// 计算MD5作为文件名
	hash := md5.Sum(fileBytes)
	hashStr := fmt.Sprintf("%x", hash)

	// 保留原始文件扩展名
	ext := filepath.Ext(originalFilename)
	objectKey := fmt.Sprintf("%s/%s%s", folder, hashStr, ext)

	cfg := config.AppConfig.OSS

	// 检查文件是否已存在
	exists, err := ossService.bucket.IsObjectExist(objectKey)
	if err != nil {
		return "", err
	}

	// 如果文件不存在，则上传
	if !exists {
		reader := bytes.NewReader(fileBytes)
		err = ossService.bucket.PutObject(objectKey, reader, oss.ObjectACL(oss.ACLPublicRead))
		if err != nil {
			return "", err
		}
	}

	// 构建公网访问URL
	fileURL := fmt.Sprintf("https://%s.%s/%s", cfg.BucketName, cfg.Endpoint, objectKey)
	return fileURL, nil
}

// 删除OSS文件
func DeleteFile(objectKey string) error {
	return ossService.bucket.DeleteObject(objectKey)
}

// 获取Bucket详细信息（位置、存储量等）
func GetBucketDetails() (map[string]interface{}, error) {
	if ossService == nil {
		if err := InitOSS(); err != nil {
			return nil, err
		}
	}

	cfg := config.AppConfig.OSS
	bucketName := cfg.BucketName

	// 1. 获取Bucket基本信息 (Region, Owner, ACL, etc)
	info, err := ossService.client.GetBucketInfo(bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to get bucket info: %v", err)
	}

	// 2. 获取Bucket统计信息 (Storage Size, Object Count)
	stat, err := ossService.client.GetBucketStat(bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to get bucket stat: %v", err)
	}

	return map[string]interface{}{
		"Name":             info.BucketInfo.Name,
		"Location":         info.BucketInfo.Location,
		"CreationDate":     info.BucketInfo.CreationDate,
		"StorageSizeBytes": stat.Storage,
		"StorageSizeGB":    fmt.Sprintf("%.4f GB", float64(stat.Storage)/1024/1024/1024),
		"ObjectCount":      stat.ObjectCount,
		"ExtranetEndpoint": info.BucketInfo.ExtranetEndpoint,
		"IntranetEndpoint": info.BucketInfo.IntranetEndpoint,
		"ACL":              info.BucketInfo.ACL,
	}, nil
}

// 获取OSS容量
func GetOSSCapacity() (int64, error) {
	if ossService == nil || ossService.client == nil {
		return 0, fmt.Errorf("OSS service not initialized")
	}

	stat, err := ossService.client.GetBucketStat(config.AppConfig.OSS.BucketName)
	if err != nil {
		return 0, err
	}

	return stat.Storage, nil
}
