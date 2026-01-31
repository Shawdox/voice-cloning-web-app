package services

import (
	"fmt"
	"voice-clone-backend/database"
	"voice-clone-backend/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// 扣除积分
// 返回：是否成功，错误信息
func DeductCredits(userID uint, amount int, transactionType, description string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 锁定用户记录，防止并发问题
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return err
		}

		// 2. 检查积分是否足够
		if user.Credits < amount {
			return fmt.Errorf("积分不足，当前积分: %d, 需要: %d", user.Credits, amount)
		}

		// 3. 扣除积分
		if err := tx.Model(&user).Update("credits", user.Credits-amount).Error; err != nil {
			return err
		}

		// 4. 记录交易
		transaction := models.CreditTransaction{
			UserID:      userID,
			Amount:      -amount,
			Type:        transactionType,
			Description: description,
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})
}

// 增加积分
func AddCredits(userID uint, amount int, transactionType, description, orderNo string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 锁定用户记录
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return err
		}

		// 2. 增加积分
		if err := tx.Model(&user).Update("credits", user.Credits+amount).Error; err != nil {
			return err
		}

		// 3. 记录交易
		transaction := models.CreditTransaction{
			UserID:      userID,
			Amount:      amount,
			Type:        transactionType,
			Description: description,
			OrderNo:     orderNo,
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})
}

// 获取用户积分余额
func GetUserCredits(userID uint) (int, error) {
	var user models.User
	if err := database.DB.Select("credits").First(&user, userID).Error; err != nil {
		return 0, err
	}
	return user.Credits, nil
}

// 检查并扣除音色克隆费用
func ChargeForVoiceClone(userID uint, withTranscript bool) (int, error) {
	return 0, nil
}

// 检查并扣除TTS生成费用
func ChargeForTTSGeneration(userID uint, text string) error {
	// 计算UTF-8字节数
	byteCount := len([]byte(text))

	// 检查是否超过5000字节限制
	if byteCount > 5000 {
		return fmt.Errorf("该输入过长，无法生成语音")
	}

	// 计算积分：(字节数 / 114000) * 10000
	cost := int(float64(byteCount) / 114000 * 10000)

	// 四舍五入取整
	if cost > 0 {
		cost = int(float64(cost) + 0.5)
	}

	fmt.Printf("DEBUG: ChargeForTTSGeneration - byteCount: %d, cost: %d\n", byteCount, cost)

	// 检查用户是否是无限积分账户
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return err
	}

	// 无限积分账户不扣除
	if user.Credits >= 999999 {
		return nil
	}

	return DeductCredits(userID, cost, "tts_generation", fmt.Sprintf("生成语音，扣除 %d 积分", cost))
}

// 获取交易记录
func GetCreditTransactions(userID uint, limit, offset int) ([]models.CreditTransaction, int64, error) {
	var transactions []models.CreditTransaction
	var total int64

	// 获取总数
	database.DB.Model(&models.CreditTransaction{}).Where("user_id = ?", userID).Count(&total)

	// 获取分页数据
	err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}
