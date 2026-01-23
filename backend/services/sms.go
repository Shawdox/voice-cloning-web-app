package services

import (
	"context"
	"fmt"
	"math/rand"
	"time"
	"voice-clone-backend/config"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/dysmsapi"
	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()
var rdb *redis.Client

// 初始化Redis连接
func InitRedis() error {
	cfg := config.AppConfig.Redis
	rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	_, err := rdb.Ping(ctx).Result()
	return err
}

// 生成6位随机验证码
func generateCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

// 发送短信验证码
func SendSMSCode(phone string) error {
	// 检查是否在60秒内已发送
	key := fmt.Sprintf("sms:%s", phone)
	exists, err := rdb.Exists(ctx, key).Result()
	if err != nil {
		return err
	}
	if exists > 0 {
		return fmt.Errorf("请等待60秒后再发送")
	}

	// 生成验证码
	code := generateCode()

	// 调用阿里云短信API
	client, err := dysmsapi.NewClientWithAccessKey(
		"cn-hangzhou",
		config.AppConfig.SMS.AccessKeyID,
		config.AppConfig.SMS.AccessKeySecret,
	)
	if err != nil {
		return err
	}

	request := dysmsapi.CreateSendSmsRequest()
	request.Scheme = "https"
	request.PhoneNumbers = phone
	request.SignName = config.AppConfig.SMS.SignName
	request.TemplateCode = config.AppConfig.SMS.TemplateCode
	request.TemplateParam = fmt.Sprintf(`{"code":"%s"}`, code)

	response, err := client.SendSms(request)
	if err != nil {
		return err
	}

	if response.Code != "OK" {
		return fmt.Errorf("短信发送失败: %s", response.Message)
	}

	// 将验证码存储到Redis，有效期5分钟
	err = rdb.Set(ctx, key, code, 5*time.Minute).Err()
	if err != nil {
		return err
	}

	return nil
}

// 验证短信验证码
func VerifySMSCode(phone, code string) (bool, error) {
	key := fmt.Sprintf("sms:%s", phone)
	storedCode, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil // 验证码不存在或已过期
	}
	if err != nil {
		return false, err
	}

	// 验证成功后删除验证码
	if storedCode == code {
		rdb.Del(ctx, key)
		return true, nil
	}

	return false, nil
}
