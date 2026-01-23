# 语音克隆Web应用

一个完整的语音克隆Web应用，用户可以上传自己的语音素材，克隆声音后生成个性化语音。

## 功能特性

### 核心功能
- **声音克隆**: 用户上传音频文件，系统克隆声音特征
- **语音生成**: 使用克隆的声音生成自定义文本的语音
- **多格式支持**: 支持MP3、WAV、M4A、OGG等多种音频格式
- **异步处理**: 后台异步处理任务，用户可查询进度

### 用户系统
- **双重认证**: 支持邮箱和手机号注册/登录
- **短信验证**: 阿里云短信验证码服务
- **积分管理**: 基于积分的付费模式
  - 声音克隆: 50积分/次
  - 语音生成: 10积分/次
- **充值系统**: 支持微信/支付宝支付(接口预留)

### 管理功能
- **用户管理**: 管理员可查看和管理所有用户
- **数据统计**: 系统使用数据统计和分析
- **音色管理**: 用户可管理自己的多个音色

## 技术架构

### 前端 (frontend/)
- **框架**: Vue 3 + Vite
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

### 后端 (backend/)
- **语言**: Go 1.21+
- **Web框架**: Gin
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: GORM

### 第三方服务
- **对象存储**: 阿里云OSS
- **短信服务**: 阿里云短信
- **TTS引擎**: Fish Audio API

## 项目结构

```
voice_web_app/
├── backend/              # Go后端服务
│   ├── config/          # 配置管理
│   ├── database/        # 数据库
│   ├── models/          # 数据模型
│   ├── handlers/        # API处理器
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由
│   ├── services/        # 业务服务
│   ├── utils/           # 工具函数
│   ├── main.go          # 入口
│   └── README.md        # 后端文档
├── frontend/             # Vue前端应用
│   └── (待创建)
├── test_scripts/         # 测试脚本
│   ├── backend_test.py  # DashScope测试
│   ├── oss.py           # OSS上传测试
│   └── qwen_test.py     # 实时TTS测试
├── data/                 # 测试数据
└── README.md            # 本文档
```

## 快速开始

### 环境要求

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 后端安装

详见 [backend/README.md](backend/README.md)

```bash
# 1. 安装依赖
cd backend
go mod download

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 运行服务
go run main.go
```

### 前端安装

```bash
# 1. 安装依赖
cd frontend
npm install

# 2. 运行开发服务器
npm run dev
```

## 配置说明

### 数据库配置

创建PostgreSQL数据库：

```sql
CREATE DATABASE voice_clone_db;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE voice_clone_db TO postgres;
```

### 阿里云服务配置

1. **OSS对象存储**
   - 创建Bucket
   - 设置权限为公共读
   - 获取AccessKey

2. **短信服务**
   - 开通短信服务
   - 申请短信签名和模板
   - 获取AccessKey

### Fish Audio API

1. 注册 Fish Audio 账号
2. 获取API Key
3. 配置到 `.env` 文件

## API文档

### 认证相关

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/sms/send` - 发送短信验证码
- `GET /api/v1/profile` - 获取用户信息

### 音色管理 (待实现)

- `POST /api/v1/voices` - 创建音色(上传音频)
- `GET /api/v1/voices` - 获取音色列表
- `GET /api/v1/voices/:id` - 获取音色详情
- `DELETE /api/v1/voices/:id` - 删除音色

### TTS生成 (待实现)

- `POST /api/v1/tts` - 创建TTS任务
- `GET /api/v1/tts` - 获取TTS任务列表
- `GET /api/v1/tts/:id` - 获取任务状态

### 积分管理 (待实现)

- `GET /api/v1/credits/balance` - 查询积分余额
- `GET /api/v1/credits/transactions` - 积分交易记录
- `POST /api/v1/credits/recharge` - 创建充值订单

## 开发状态

### ✅ 已完成

- [x] 后端项目结构搭建
- [x] 数据库模型设计
- [x] 用户认证系统(注册/登录/JWT)
- [x] 阿里云OSS集成
- [x] 阿里云短信集成
- [x] CORS和中间件配置

### 🚧 进行中

- [ ] Fish Audio API集成
- [ ] 异步任务队列
- [ ] 文件上传接口
- [ ] 音色管理接口
- [ ] TTS生成接口

### 📋 待开发

- [ ] 前端Vue项目初始化
- [ ] 用户界面开发
- [ ] 管理后台开发
- [ ] 积分充值系统
- [ ] 支付接口集成
- [ ] 部署文档

## 当前测试状态

**注意**: 当前代码未进行编译测试，需要：

1. **安装Go环境** - 系统当前未安装Go
2. **安装PostgreSQL** - 需要配置数据库
3. **安装Redis** - 需要缓存服务
4. **完善Fish Audio集成** - 核心功能待实现

## 下一步计划

1. 安装Go开发环境
2. 测试后端服务能否启动
3. 实现Fish Audio API集成
4. 实现文件上传和音色管理
5. 开发前端Vue应用

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发者。
