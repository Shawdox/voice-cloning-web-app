# 语音克隆系统 - API文档

Base URL: `http://localhost:8080/api/v1`

## 认证

大多数API需要JWT认证。在请求头中包含：

```
Authorization: Bearer <your_token>
```

---

## 认证相关 API

### 1. 发送短信验证码

```http
POST /auth/sms/send
Content-Type: application/json

{
  "phone": "13800138000"
}
```

**响应**:
```json
{
  "message": "验证码已发送"
}
```

---

### 2. 用户注册

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "13800138000",
  "password": "password123",
  "nickname": "用户昵称",
  "sms_code": "123456"
}
```

**字段说明**:
- `email`: 必填，邮箱地址
- `phone`: 选填，手机号（如提供则需要sms_code）
- `password`: 必填，至少6位
- `nickname`: 选填，用户昵称
- `sms_code`: 选填，手机号验证码

**响应**:
```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "13800138000",
    "nickname": "用户昵称",
    "credits": 100,
    "is_admin": false
  }
}
```

---

### 3. 用户登录

```http
POST /auth/login
Content-Type: application/json

{
  "login_id": "user@example.com",
  "password": "password123"
}
```

**字段说明**:
- `login_id`: 邮箱或手机号
- `password`: 密码

**响应**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "13800138000",
    "nickname": "用户昵称",
    "credits": 540,
    "is_admin": false
  }
}
```

---

### 4. 获取个人信息

```http
GET /profile
Authorization: Bearer <token>
```

**响应**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "13800138000",
    "nickname": "用户昵称",
    "avatar": "",
    "credits": 540,
    "is_admin": false,
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

---

## 文件上传 API

### 5. 上传音频文件

```http
POST /upload/audio
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <file>
```

**支持格式**: .mp3, .wav, .m4a, .ogg, .flac, .aac
**文件大小**: 最大50MB

**响应**:
```json
{
  "message": "文件上传成功",
  "file_url": "https://voice-test-xiao.oss-cn-beijing.aliyuncs.com/voices/abc123.mp3",
  "filename": "my_voice.mp3",
  "size": 5242880
}
```

---

### 6. 上传文本文件

```http
POST /upload/text
Authorization: Bearer <token>
Content-Type: multipart/form-data

text: <file>
```

**支持格式**: .txt, .docx
**文件大小**: 最大5MB

**响应**:
```json
{
  "message": "文件上传成功",
  "file_url": "https://voice-test-xiao.oss-cn-beijing.aliyuncs.com/texts/def456.txt",
  "filename": "script.txt"
}
```

---

## 音色管理 API

### 7. 创建音色（声音克隆）

```http
POST /voices
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的声音",
  "audio_file_url": "https://voice-test-xiao.oss-cn-beijing.aliyuncs.com/voices/abc123.mp3",
  "audio_file_name": "my_voice.mp3"
}
```

**费用**: 50积分

**响应**:
```json
{
  "message": "音色创建任务已提交",
  "voice": {
    "id": 1,
    "user_id": 1,
    "name": "我的声音",
    "fish_voice_id": "",
    "audio_file_url": "https://...",
    "audio_file_name": "my_voice.mp3",
    "status": "pending",
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

**状态说明**:
- `pending`: 等待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

---

### 8. 获取音色列表

```http
GET /voices?page=1&page_size=20
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认20，最大100）

**响应**:
```json
{
  "voices": [
    {
      "id": 1,
      "name": "我的声音",
      "fish_voice_id": "fish_abc123",
      "audio_file_url": "https://...",
      "status": "completed",
      "completed_at": "2026-01-10T10:05:00Z",
      "created_at": "2026-01-10T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

---

### 9. 获取音色详情

```http
GET /voices/:id
Authorization: Bearer <token>
```

**响应**:
```json
{
  "voice": {
    "id": 1,
    "user_id": 1,
    "name": "我的声音",
    "fish_voice_id": "fish_abc123",
    "audio_file_url": "https://...",
    "audio_file_name": "my_voice.mp3",
    "audio_duration": 15.5,
    "status": "completed",
    "error_msg": "",
    "completed_at": "2026-01-10T10:05:00Z",
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

---

### 10. 查询音色状态

```http
GET /voices/:id/status
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": 1,
  "name": "我的声音",
  "status": "completed",
  "error_msg": "",
  "completed_at": "2026-01-10T10:05:00Z"
}
```

---

### 11. 删除音色

```http
DELETE /voices/:id
Authorization: Bearer <token>
```

**响应**:
```json
{
  "message": "音色已删除"
}
```

---

## TTS生成 API

### 12. 创建TTS任务

```http
POST /tts
Authorization: Bearer <token>
Content-Type: application/json

{
  "voice_id": 1,
  "text": "你好，欢迎使用语音克隆系统！"
}
```

**字段说明**:
- `voice_id`: 音色ID（必须是已完成的音色）
- `text`: 要合成的文本（1-10000字符）

**费用**: 10积分

**响应**:
```json
{
  "message": "TTS任务已提交",
  "task": {
    "id": 1,
    "user_id": 1,
    "voice_id": 1,
    "text": "你好，欢迎使用语音克隆系统！",
    "text_length": 15,
    "audio_url": "",
    "status": "pending",
    "created_at": "2026-01-10T10:10:00Z"
  }
}
```

**状态说明**:
- `pending`: 等待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

---

### 13. 获取TTS任务列表

```http
GET /tts?page=1&page_size=20
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认20，最大100）

**响应**:
```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "voice_id": 1,
      "text": "你好，欢迎使用语音克隆系统！",
      "text_length": 15,
      "audio_url": "https://...",
      "audio_duration": 3.5,
      "status": "completed",
      "completed_at": "2026-01-10T10:10:30Z",
      "created_at": "2026-01-10T10:10:00Z",
      "voice": {
        "id": 1,
        "name": "我的声音"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

### 14. 获取TTS任务详情

```http
GET /tts/:id
Authorization: Bearer <token>
```

**响应**:
```json
{
  "task": {
    "id": 1,
    "user_id": 1,
    "voice_id": 1,
    "text": "你好，欢迎使用语音克隆系统！",
    "text_length": 15,
    "audio_url": "https://...",
    "audio_duration": 3.5,
    "fish_task_id": "fish_task_123",
    "status": "completed",
    "error_msg": "",
    "completed_at": "2026-01-10T10:10:30Z",
    "created_at": "2026-01-10T10:10:00Z",
    "voice": {
      "id": 1,
      "name": "我的声音",
      "status": "completed"
    }
  }
}
```

---

### 15. 查询TTS任务状态

```http
GET /tts/:id/status
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": 1,
  "status": "completed",
  "audio_url": "https://...",
  "audio_duration": 3.5,
  "error_msg": "",
  "completed_at": "2026-01-10T10:10:30Z"
}
```

---

### 16. 删除TTS任务

```http
DELETE /tts/:id
Authorization: Bearer <token>
```

**响应**:
```json
{
  "message": "任务已删除"
}
```

---

## 积分管理 API

### 17. 查询积分余额

```http
GET /credits/balance
Authorization: Bearer <token>
```

**响应**:
```json
{
  "credits": 540
}
```

---

### 18. 获取积分交易记录

```http
GET /credits/transactions?page=1&page_size=20
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认20，最大100）

**响应**:
```json
{
  "transactions": [
    {
      "id": 5,
      "user_id": 1,
      "amount": -10,
      "type": "tts_generation",
      "description": "生成语音，扣除 10 积分",
      "order_no": "",
      "created_at": "2026-01-10T10:10:00Z"
    },
    {
      "id": 4,
      "user_id": 1,
      "amount": -50,
      "type": "voice_clone",
      "description": "创建音色，扣除 50 积分",
      "order_no": "",
      "created_at": "2026-01-10T10:00:00Z"
    },
    {
      "id": 3,
      "user_id": 1,
      "amount": 500,
      "type": "recharge",
      "description": "充值",
      "order_no": "ORDER20260110001",
      "created_at": "2026-01-09T15:00:00Z"
    },
    {
      "id": 1,
      "user_id": 1,
      "amount": 100,
      "type": "register_bonus",
      "description": "注册赠送积分",
      "order_no": "",
      "created_at": "2026-01-08T10:00:00Z"
    }
  ],
  "total": 4,
  "page": 1,
  "page_size": 20
}
```

**交易类型**:
- `register_bonus`: 注册赠送
- `recharge`: 充值
- `voice_clone`: 声音克隆消费
- `tts_generation`: TTS生成消费
- `refund`: 退款

---

## 系统 API

### 19. 健康检查

```http
GET /health
```

**响应**:
```json
{
  "status": "ok"
}
```

---

## 错误响应格式

所有错误响应都使用以下格式：

```json
{
  "error": "错误描述信息"
}
```

**常见HTTP状态码**:
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证或Token无效
- `402`: 积分不足（Payment Required）
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 冲突（如邮箱已存在）
- `500`: 服务器内部错误

---

## 使用流程示例

### 完整的语音克隆和生成流程

```bash
# 1. 用户注册
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "nickname": "测试用户"
  }'

# 保存返回的token

# 2. 上传音频文件
curl -X POST http://localhost:8080/api/v1/upload/audio \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@my_voice.mp3"

# 保存返回的file_url

# 3. 创建音色
curl -X POST http://localhost:8080/api/v1/voices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的声音",
    "audio_file_url": "https://voice-test-xiao.oss-cn-beijing.aliyuncs.com/voices/abc123.mp3",
    "audio_file_name": "my_voice.mp3"
  }'

# 保存返回的voice_id

# 4. 轮询查询音色状态
curl -X GET http://localhost:8080/api/v1/voices/1/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 等待status变为completed

# 5. 生成语音
curl -X POST http://localhost:8080/api/v1/tts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voice_id": 1,
    "text": "你好，这是使用我的声音生成的语音！"
  }'

# 保存返回的task_id

# 6. 查询TTS任务状态
curl -X GET http://localhost:8080/api/v1/tts/1/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. 下载生成的音频
# 从返回的audio_url下载文件
```

---

## 费率说明

- **注册赠送**: 100积分（可在.env配置）
- **声音克隆**: 50积分/次
- **语音生成**: 10积分/次

---

## 注意事项

1. **JWT Token** 有效期为7天
2. **短信验证码** 有效期为5分钟，60秒内只能发送一次
3. **文件上传** 音频最大50MB，文本最大5MB
4. **异步任务** 音色克隆和TTS生成都是异步的，需要轮询状态
5. **积分扣除** 在任务提交时立即扣除，任务失败会自动退款
6. **分页查询** 默认每页20条，最大100条

---

## 开发测试

推荐使用Postman或类似工具测试API。

Postman Collection已导出到: `postman_collection.json`（待创建）
