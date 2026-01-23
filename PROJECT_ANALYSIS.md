# 项目文档整理与后端功能分析

**分析日期**: 2026-01-11
**项目版本**: v1.0

---

## 📚 文档状态分析

### ✅ 保留的文档（最新且有效）

#### 1. README.md
**状态**: 保留
**用途**: 项目主文档
**建议**: 需要更新为最新的项目说明

#### 2. SETUP_GUIDE.md
**状态**: 保留
**用途**: 安装部署指南
**建议**: 核心文档,需保持更新

#### 3. API_DOCUMENTATION.md
**状态**: 保留
**用途**: API接口文档
**建议**: 核心参考文档

#### 4. DESIGN_MINIMAX_STYLE.md
**状态**: ✅ 最新 (2026-01-10)
**用途**: MiniMax风格设计文档
**版本**: v3.0
**建议**: 最新设计规范,保留

#### 5. GUEST_MODE_UPDATE.md
**状态**: ✅ 最新 (2026-01-11)
**用途**: 游客模式功能说明
**版本**: v1.0
**建议**: 最新功能文档,保留

#### 6. HOVER_STYLES_CHECKLIST.md
**状态**: ✅ 最新 (2026-01-11)
**用途**: Hover样式检查清单
**建议**: 测试和QA文档,保留


## 🔧 后端功能完成度分析

### ✅ 已完成的核心功能

#### 1. 用户认证系统
**文件**: `backend/handlers/auth.go`

**实现功能**:
- ✅ 用户注册 (`Register`)
  - 邮箱注册
  - 手机号注册(需短信验证)
  - 自动赠送100积分

- ✅ 用户登录 (`Login`)
  - 邮箱登录
  - 手机号登录
  - JWT Token生成

- ✅ 获取用户信息 (`GetProfile`)
  - 返回用户基本信息
  - 包含积分余额

- ⚠️ 发送短信验证码 (`SendSMS`)
  - Handler已实现
  - 但实际发送功能未集成第三方SMS服务

**路由**:
- `POST /api/auth/register` ✅
- `POST /api/auth/login` ✅
- `GET /api/auth/profile` ✅
- `POST /api/auth/sms` ⚠️

---

#### 2. 音色克隆功能
**文件**:
- `backend/handlers/voice.go`
- `backend/services/fish_audio.go`

**实现功能**:
- ✅ 创建音色 (`CreateVoice`)
  - 上传音频文件
  - 调用Fish Audio API
  - 扣除50积分
  - 后台异步处理

- ✅ 查询音色列表 (`GetVoices`)
  - 分页查询
  - 按用户筛选

- ✅ 获取音色详情 (`GetVoiceByID`)

- ✅ 删除音色 (`DeleteVoice`)

- ✅ 查询音色状态 (`GetVoiceStatus`)
  - 轮询Fish Audio API
  - 自动更新状态

**路由**:
- `POST /api/voices` ✅
- `GET /api/voices` ✅
- `GET /api/voices/:id` ✅
- `DELETE /api/voices/:id` ✅
- `GET /api/voices/:id/status` ✅

---

#### 3. 语音生成功能 (TTS)
**文件**:
- `backend/handlers/tts.go`
- `backend/services/fish_audio.go`

**实现功能**:
- ✅ 创建TTS任务 (`CreateTTS`)
  - 选择音色
  - 输入文本
  - 扣除10积分
  - 调用Fish Audio API
  - 后台异步处理

- ✅ 查询TTS列表 (`GetTTSTasks`)
  - 分页查询
  - 按用户筛选

- ✅ 获取TTS详情 (`GetTTSByID`)

- ✅ 删除TTS任务 (`DeleteTTS`)

- ✅ 查询TTS状态 (`GetTTSStatus`)
  - 轮询Fish Audio API
  - 自动更新状态

**路由**:
- `POST /api/tts` ✅
- `GET /api/tts` ✅
- `GET /api/tts/:id` ✅
- `DELETE /api/tts/:id` ✅
- `GET /api/tts/:id/status` ✅

---

#### 4. 积分系统
**文件**:
- `backend/handlers/credit.go`
- `backend/services/credit.go`

**实现功能**:
- ✅ 查询积分交易记录 (`GetTransactions`)
  - 分页查询
  - 按用户筛选
  - 按时间排序

**Services层**:
- ✅ 扣除积分 (`DeductCredits`)
  - 数据库锁定
  - 余额检查
  - 创建交易记录

- ✅ 增加积分 (`AddCredits`)
  - 数据库锁定
  - 创建交易记录

**路由**:
- `GET /api/credits/transactions` ✅

---

#### 5. 文件上传功能
**文件**: `backend/handlers/upload.go`

**实现功能**:
- ✅ 上传音频文件 (`UploadAudio`)
  - 文件类型验证
  - 文件大小限制(50MB)
  - MinIO对象存储
  - 返回文件URL

**路由**:
- `POST /api/upload/audio` ✅

---

#### 6. AI服务集成 (Fish Audio)
**文件**: `backend/services/fish_audio.go`

**状态**: ✅ 已完全实现

**实现功能**:
1. 音色克隆 (Voice Cloning)
   - `CreateVoice()` - 创建音色
   - `GetVoiceStatus()` - 查询音色状态

2. 语音生成 (Text-to-Speech)
   - `GenerateSpeech()` - 生成语音
   - `GetTTSTaskStatus()` - 查询TTS任务状态

3. 功能特性:
   - ✅ 自动重试机制 (网络抖动、429限流、5xx错误)
   - ✅ 指数退避算法
   - ✅ Retry-After响应头支持
   - ✅ 完整的错误处理
   - ✅ 文件上传和下载
   - ✅ 60秒超时保护

**配置项**:
```go
config.AppConfig.FishAudio.APIKey
config.AppConfig.FishAudio.BaseURL
```

**重试策略**:
- 最大重试次数: 5次
- 基础延迟: 500ms
- 最大延迟: 5秒
- 可重试状态码: 429, 5xx
- 可重试错误: 网络超时、EOF、连接错误

---

### ❌ 未完成的功能

#### 1. 用户资料更新功能

**位置**:
- Handler: 缺失 `UpdateProfile` handler
- 前端: `ProfileView.vue:177-178`

**当前状态**: ❌ 未实现

**需要实现**:
```go
// backend/handlers/auth.go
type UpdateProfileRequest struct {
    Nickname string `json:"nickname"`
    Avatar   string `json:"avatar"`
}

func UpdateProfile(c *gin.Context) {
    userID := c.GetUint("user_id")

    var req UpdateProfileRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
        return
    }

    // 更新用户信息
    updates := map[string]interface{}{}
    if req.Nickname != "" {
        updates["nickname"] = req.Nickname
    }
    if req.Avatar != "" {
        updates["avatar"] = req.Avatar
    }

    if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}
```

**需要添加路由**:
```go
// backend/routes/routes.go
authRoutes.PUT("/profile", handlers.UpdateProfile)
```

---

#### 2. 修改密码功能

**位置**:
- Handler: 缺失 `ChangePassword` handler
- 前端: `ProfileView.vue:198-199`

**当前状态**: ❌ 未实现

**需要实现**:
```go
// backend/handlers/auth.go
type ChangePasswordRequest struct {
    OldPassword string `json:"old_password" binding:"required"`
    NewPassword string `json:"new_password" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
    userID := c.GetUint("user_id")

    var req ChangePasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
        return
    }

    // 查询用户
    var user models.User
    if err := database.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
        return
    }

    // 验证旧密码
    if !utils.CheckPassword(req.OldPassword, user.Password) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "旧密码错误"})
        return
    }

    // 加密新密码
    hashedPassword, err := utils.HashPassword(req.NewPassword)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
        return
    }

    // 更新密码
    if err := database.DB.Model(&user).Update("password", hashedPassword).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "密码修改成功"})
}
```

**需要添加路由**:
```go
// backend/routes/routes.go
authRoutes.POST("/change-password", handlers.ChangePassword)
```

---

#### 3. 积分充值功能

**位置**:
- Handler: 缺失充值相关handler
- 前端: `CreditsView.vue:169-171`

**当前状态**: ❌ 未实现

**需要实现**:
```go
// backend/handlers/credit.go
type RechargeRequest struct {
    Amount    int    `json:"amount" binding:"required,min=1"`
    PayMethod string `json:"pay_method" binding:"required"` // alipay, wechat
}

type RechargeResponse struct {
    OrderNo   string `json:"order_no"`
    PayURL    string `json:"pay_url"`
    QRCode    string `json:"qr_code,omitempty"`
}

func CreateRechargeOrder(c *gin.Context) {
    userID := c.GetUint("user_id")

    var req RechargeRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
        return
    }

    // 创建订单
    orderNo := fmt.Sprintf("R%d%d", time.Now().Unix(), userID)

    // 调用支付接口(支付宝/微信)
    // payURL, err := payment.CreateOrder(orderNo, req.Amount, req.PayMethod)

    // 保存订单记录到数据库
    // ...

    c.JSON(http.StatusOK, gin.H{
        "order_no": orderNo,
        "pay_url": "支付链接",
    })
}

func RechargeCallback(c *gin.Context) {
    // 接收支付回调
    // 1. 验证签名
    // 2. 检查订单状态
    // 3. 增加用户积分
    // 4. 更新订单状态

    services.AddCredits(userID, amount, "recharge", "积分充值", orderNo)

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}
```

**需要添加路由**:
```go
// backend/routes/routes.go
creditRoutes := api.Group("/credits")
{
    creditRoutes.Use(middleware.Auth())
    creditRoutes.GET("/transactions", handlers.GetTransactions)
    creditRoutes.POST("/recharge", handlers.CreateRechargeOrder)  // 新增
}

// 支付回调路由(不需要认证)
api.POST("/credits/callback/:method", handlers.RechargeCallback)  // 新增
```

**依赖**: 需要集成支付接口
- 支付宝SDK: `github.com/smartwalle/alipay/v3`
- 微信支付SDK: `github.com/wechatpay-apiv3/wechatpay-go`

---

#### 4. 短信验证码发送功能

**位置**: `backend/handlers/auth.go:33-56`

**当前状态**: ⚠️ Handler存在,但功能未完整实现

**当前实现**:
```go
func SendSMS(c *gin.Context) {
    var req SendSMSRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "手机号格式错误"})
        return
    }

    // 生成验证码
    code := generateSMSCode()

    // TODO: 调用短信服务发送验证码
    // 当前只是模拟，需要集成阿里云短信、腾讯云短信等

    // 存储验证码到Redis（设置5分钟过期）
    // redis.Set(fmt.Sprintf("sms:%s", req.Phone), code, 5*time.Minute)

    c.JSON(http.StatusOK, gin.H{
        "message": "验证码已发送",
        "code": code, // 仅开发环境返回，生产环境不应返回
    })
}
```

**需要完善**:
1. 集成短信服务商SDK
   - 阿里云短信: `github.com/aliyun/alibaba-cloud-sdk-go`
   - 腾讯云短信: `github.com/tencentcloud/tencentcloud-sdk-go`

2. 添加Redis缓存
   - 存储验证码
   - 设置过期时间
   - 防重复发送

3. 添加发送频率限制
   - 同一手机号1分钟内只能发送1次
   - 同一手机号1天内最多发送5次

**示例实现**:
```go
// 集成阿里云短信
import (
    "github.com/aliyun/alibaba-cloud-sdk-go/services/dysmsapi"
)

func sendAliSMS(phone, code string) error {
    client, err := dysmsapi.NewClientWithAccessKey(
        "cn-hangzhou",
        config.AppConfig.SMS.AccessKeyID,
        config.AppConfig.SMS.AccessKeySecret,
    )
    if err != nil {
        return err
    }

    request := dysmsapi.CreateSendSmsRequest()
    request.PhoneNumbers = phone
    request.SignName = "您的签名"
    request.TemplateCode = "SMS_123456789"
    request.TemplateParam = fmt.Sprintf(`{"code":"%s"}`, code)

    response, err := client.SendSms(request)
    if err != nil {
        return err
    }

    if response.Code != "OK" {
        return fmt.Errorf("发送失败: %s", response.Message)
    }

    return nil
}
```

---

#### 5. 管理员功能

**位置**: `backend/routes/routes.go:69-71`

**当前状态**: ❌ 完全未实现

**需要实现的功能**:

##### 5.1 用户管理
```go
// backend/handlers/admin.go (新文件)
package handlers

// 获取用户列表
func GetUsers(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

    var users []models.User
    var total int64

    database.DB.Model(&models.User{}).Count(&total)
    database.DB.Offset((page - 1) * pageSize).Limit(pageSize).Find(&users)

    c.JSON(http.StatusOK, gin.H{
        "users": users,
        "total": total,
    })
}

// 更新用户状态
func UpdateUserStatus(c *gin.Context) {
    userID, _ := strconv.Atoi(c.Param("id"))

    var req struct {
        Status string `json:"status"` // active, disabled
    }
    c.ShouldBindJSON(&req)

    database.DB.Model(&models.User{}).Where("id = ?", userID).Update("status", req.Status)

    c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// 调整用户积分
func AdjustUserCredits(c *gin.Context) {
    userID, _ := strconv.Atoi(c.Param("id"))

    var req struct {
        Amount      int    `json:"amount"`
        Description string `json:"description"`
    }
    c.ShouldBindJSON(&req)

    if req.Amount > 0 {
        services.AddCredits(uint(userID), req.Amount, "admin_adjust", req.Description, "")
    } else {
        services.DeductCredits(uint(userID), -req.Amount, "admin_adjust", req.Description)
    }

    c.JSON(http.StatusOK, gin.H{"message": "调整成功"})
}
```

##### 5.2 数据统计
```go
// 获取统计数据
func GetStatistics(c *gin.Context) {
    var stats struct {
        TotalUsers      int64 `json:"total_users"`
        TotalVoices     int64 `json:"total_voices"`
        TotalTTS        int64 `json:"total_tts"`
        TotalCredits    int64 `json:"total_credits"`
        TodayUsers      int64 `json:"today_users"`
        TodayVoices     int64 `json:"today_voices"`
        TodayTTS        int64 `json:"today_tts"`
    }

    today := time.Now().Format("2006-01-02")

    database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
    database.DB.Model(&models.Voice{}).Count(&stats.TotalVoices)
    database.DB.Model(&models.TTSTask{}).Count(&stats.TotalTTS)

    database.DB.Model(&models.User{}).Where("DATE(created_at) = ?", today).Count(&stats.TodayUsers)
    database.DB.Model(&models.Voice{}).Where("DATE(created_at) = ?", today).Count(&stats.TodayVoices)
    database.DB.Model(&models.TTSTask{}).Where("DATE(created_at) = ?", today).Count(&stats.TodayTTS)

    c.JSON(http.StatusOK, stats)
}
```

##### 5.3 系统配置
```go
// 更新系统配置
func UpdateSystemConfig(c *gin.Context) {
    var req struct {
        VoiceClonePrice int  `json:"voice_clone_price"`
        TTSPrice        int  `json:"tts_price"`
        RegisterBonus   int  `json:"register_bonus"`
    }
    c.ShouldBindJSON(&req)

    // 保存配置到数据库或配置文件
    // ...

    c.JSON(http.StatusOK, gin.H{"message": "配置已更新"})
}
```

**需要添加路由**:
```go
// backend/routes/routes.go
adminRoutes := api.Group("/admin")
{
    adminRoutes.Use(middleware.Auth())
    adminRoutes.Use(middleware.AdminOnly())  // 管理员权限检查

    // 用户管理
    adminRoutes.GET("/users", handlers.GetUsers)
    adminRoutes.PUT("/users/:id/status", handlers.UpdateUserStatus)
    adminRoutes.POST("/users/:id/credits", handlers.AdjustUserCredits)

    // 数据统计
    adminRoutes.GET("/statistics", handlers.GetStatistics)

    // 系统配置
    adminRoutes.PUT("/config", handlers.UpdateSystemConfig)
}
```

**需要添加中间件**:
```go
// backend/middleware/admin.go (新文件)
package middleware

func AdminOnly() gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetUint("user_id")

        var user models.User
        database.DB.First(&user, userID)

        if user.Role != "admin" {
            c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

---

## 📊 功能完成度总结

### 核心功能 (必需)
| 功能模块 | 完成度 | 状态 |
|---------|--------|------|
| 用户注册登录 | 100% | ✅ |
| 音色克隆 | 100% | ✅ |
| 语音生成(TTS) | 100% | ✅ |
| 积分查询 | 100% | ✅ |
| 文件上传 | 100% | ✅ |
| Fish Audio集成 | 100% | ✅ |

### 增强功能 (推荐)
| 功能模块 | 完成度 | 状态 | 优先级 |
|---------|--------|------|--------|
| 修改资料 | 0% | ❌ | 中 |
| 修改密码 | 0% | ❌ | 中 |
| 积分充值 | 0% | ❌ | 高 |
| 短信服务 | 30% | ⚠️ | 低 |

### 管理功能 (可选)
| 功能模块 | 完成度 | 状态 | 优先级 |
|---------|--------|------|--------|
| 用户管理 | 0% | ❌ | 低 |
| 数据统计 | 0% | ❌ | 低 |
| 系统配置 | 0% | ❌ | 低 |

---

## 🎯 推荐实施计划

### 阶段1: 高优先级功能 (1-2天)
1. ✅ 修改用户资料功能
2. ✅ 修改密码功能

### 阶段2: 支付集成 (3-5天)
1. ✅ 集成支付宝SDK
2. ✅ 实现充值功能
3. ✅ 实现支付回调
4. ✅ 测试支付流程

### 阶段3: 管理后台 (可选,5-7天)
1. ⚠️ 实现用户管理
2. ⚠️ 实现数据统计
3. ⚠️ 实现系统配置

### 阶段4: 短信服务 (可选,1-2天)
1. ⚠️ 集成阿里云/腾讯云短信
2. ⚠️ 实现Redis缓存
3. ⚠️ 添加频率限制

---

## 📝 建议的清理操作

```bash
# 删除过时文档
rm DESIGN_UPDATES.md
rm PROJECT_COMPLETE.md
rm FRONTEND_STATUS.md

# 可选：归档而非删除
mkdir -p archive
mv PROJECT_STATUS.md archive/
mv DEVELOPMENT_COMPLETE.md archive/
mv FILES_OVERVIEW.md archive/
```

---

**分析完成日期**: 2026-01-11
**下次审查**: 建议每月更新一次
