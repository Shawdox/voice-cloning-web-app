# 语音克隆系统 - 后端服务

基于Go + Gin框架的语音克隆系统后端API服务。

## 技术栈

- **语言**: Go 1.21+
- **Web框架**: Gin
- **数据库**: PostgreSQL
- **缓存**: Redis
- **对象存储**: 阿里云OSS
- **短信服务**: 阿里云短信
- **TTS服务**: Fish Audio API

## 项目结构

```
backend/
├── config/          # 配置管理
│   └── config.go
├── database/        # 数据库连接和迁移
│   └── database.go
├── models/          # 数据模型
│   ├── user.go     # 用户、积分、订单模型
│   └── voice.go    # 音色、TTS任务模型
├── handlers/        # HTTP处理器
│   └── auth.go     # 认证相关接口
├── middleware/      # 中间件
│   ├── auth.go     # JWT认证
│   └── cors.go     # CORS配置
├── routes/          # 路由配置
│   └── routes.go
├── services/        # 业务服务
│   ├── sms.go      # 短信服务
│   ├── oss.go      # 文件上传服务
│   └── fish.go     # Fish Audio API集成(待实现)
├── utils/           # 工具函数
│   ├── password.go # 密码加密
│   └── jwt.go      # JWT令牌
├── main.go          # 程序入口
├── go.mod           # Go模块依赖
├── .env             # 环境变量配置
└── README.md        # 本文档
```

## 环境要求

### 1. 安装Go

```bash
# 下载并安装Go 1.21+
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
source ~/.bashrc

# 验证安装
go version
```

### 2. 安装PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库
sudo -u postgres psql
CREATE DATABASE voice_clone_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE voice_clone_db TO postgres;
\q
```

### 3. 安装Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# 启动服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli ping
# 应返回 PONG
```

## 安装和运行

### 1. 安装依赖

```bash
cd backend
go mod download
go mod tidy
```

### 2. 配置环境变量

编辑 `.env` 文件，配置以下信息：

- 数据库连接信息
- JWT密钥
- 阿里云OSS配置
- Fish Audio API密钥
- 阿里云短信配置
- Redis连接信息

### 3. 运行服务

```bash
# 开发模式
go run main.go

# 编译后运行
go build -o voice-clone-server
./voice-clone-server
```

服务将在 `http://localhost:8080` 启动。

## API接口文档

### 认证相关

#### 发送短信验证码
```
POST /api/v1/auth/sms/send
Content-Type: application/json

{
  "phone": "13800138000"
}
```

#### 用户注册
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "13800138000",
  "password": "password123",
  "nickname": "昵称",
  "sms_code": "123456"
}
```

#### 用户登录
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "login_id": "user@example.com",  // 邮箱或手机号
  "password": "password123"
}
```

#### 获取个人信息
```
GET /api/v1/profile
Authorization: Bearer <token>
```

### 健康检查

```
GET /health
```

## 数据库模型

### User (用户表)
- ID, Email, Phone, PasswordHash
- Nickname, Avatar
- Credits (积分)
- IsAdmin, IsActive

### Voice (音色表)
- ID, UserID, Name
- FishVoiceID, AudioFileURL
- Status (pending/processing/completed/failed)

### TTSTask (TTS任务表)
- ID, UserID, VoiceID
- Text, AudioURL
- Status (pending/processing/completed/failed)

### CreditTransaction (积分交易记录)
- ID, UserID, Amount
- Type (recharge/voice_clone/tts_generation)

### RechargeOrder (充值订单)
- ID, UserID, OrderNo
- Amount, Credits, PaymentType
- Status (pending/paid/cancelled)

## 开发说明

### 待实现功能

1. Fish Audio API集成 (services/fish.go)
2. 文件上传接口 (handlers/upload.go)
3. 音色管理接口 (handlers/voice.go)
4. TTS生成接口 (handlers/tts.go)
5. 积分管理接口 (handlers/credit.go)
6. 管理后台接口 (handlers/admin.go)
7. 异步任务队列

### 注意事项

- 密码使用bcrypt加密存储
- JWT Token有效期为7天
- 短信验证码有效期为5分钟
- 文件上传使用MD5去重
- 所有敏感配置通过环境变量管理

## 故障排查

### 数据库连接失败
- 检查PostgreSQL是否运行: `sudo systemctl status postgresql`
- 检查.env中的数据库配置是否正确
- 确认数据库已创建且用户有权限

### Redis连接失败
- 检查Redis是否运行: `sudo systemctl status redis-server`
- 使用 `redis-cli ping` 测试连接

### OSS上传失败
- 检查阿里云OSS配置是否正确
- 确认Bucket权限设置为公共读

## License

MIT
