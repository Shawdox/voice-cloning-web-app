# AI语音克隆网站项目计划

## 1. 项目概述

### 1.1 项目简介
本项目是一个完整的AI语音克隆Web应用，允许用户上传自己的语音素材，通过AI技术克隆声音特征，然后使用克隆的声音生成个性化语音内容。

### 1.2 技术架构

| 层级 | 技术栈 |
|------|--------|
| **前端** | React + TypeScript + Vite |
| **后端** | Go 1.21+ + Gin框架 |
| **数据库** | PostgreSQL 14+ |
| **缓存** | Redis 6+ |
| **对象存储** | 阿里云OSS |
| **短信服务** | 阿里云短信 |
| **TTS引擎** | Fish Audio API |

### 1.3 项目结构
```
voice_web_app/
├── backend/                    # Go后端服务
│   ├── config/                # 配置管理
│   ├── database/              # 数据库连接和迁移
│   ├── handlers/              # API处理器
│   ├── middleware/            # 中间件（认证、CORS等）
│   ├── models/                # 数据模型和DTO
│   ├── routes/                # 路由配置
│   ├── services/              # 业务服务层
│   └── utils/                 # 工具函数
│
├── voiceclone-pro-console/    # React前端应用
│   ├── components/            # UI组件
│   ├── contexts/              # React Context（状态管理）
│   ├── services/              # API服务层
│   └── types/                 # TypeScript类型定义
│
└── test_scripts/              # 测试脚本
```

---

## 2. 主要功能模块

### 2.1 用户认证模块
**位置**: `backend/handlers/auth.go`, `voiceclone-pro-console/contexts/AuthContext.tsx`

| 功能 | API端点 | 说明 |
|------|---------|------|
| 用户注册 | `POST /api/v1/auth/register` | 支持邮箱+手机号注册 |
| 用户登录 | `POST /api/v1/auth/login` | 邮箱或手机号登录 |
| 发送验证码 | `POST /api/v1/auth/sms/send` | 阿里云短信验证码 |
| 获取用户信息 | `GET /api/v1/profile` | JWT认证获取个人资料 |

**前端组件**:
- `LoginModal.tsx` - 登录/注册弹窗
- `AuthContext.tsx` - 认证状态管理

### 2.2 文件上传模块
**位置**: `backend/handlers/upload.go`, `backend/services/oss.go`

| 功能 | API端点 | 说明 |
|------|---------|------|
| 上传音频 | `POST /api/v1/upload/audio` | 支持MP3/WAV/M4A等，最大50MB |
| 上传文本 | `POST /api/v1/upload/text` | 支持TXT/DOCX，最大5MB |

**特性**:
- 阿里云OSS存储
- MD5去重机制
- 文件格式验证

### 2.3 音色克隆模块
**位置**: `backend/handlers/voice.go`, `backend/services/fish_audio.go`

| 功能 | API端点 | 说明 |
|------|---------|------|
| 创建音色 | `POST /api/v1/voices` | 提交克隆任务，扣除50积分 |
| 音色列表 | `GET /api/v1/voices` | 分页查询用户音色 |
| 音色详情 | `GET /api/v1/voices/:id` | 获取单个音色信息 |
| 音色状态 | `GET /api/v1/voices/:id/status` | 轮询克隆进度 |
| 删除音色 | `DELETE /api/v1/voices/:id` | 删除用户音色 |

**前端组件**:
- `VoiceCloningSection.tsx` - 音色克隆界面
- `VoiceLibrary.tsx` - 音色库组件
- `VoiceLibraryView.tsx` - 音色库视图

**状态流转**: `pending` → `processing` → `completed/failed`

### 2.4 语音合成(TTS)模块
**位置**: `backend/handlers/tts.go`, `backend/services/fish_audio.go`

| 功能 | API端点 | 说明 |
|------|---------|------|
| 创建TTS任务 | `POST /api/v1/tts` | 提交合成任务，扣除10积分 |
| TTS任务列表 | `GET /api/v1/tts` | 分页查询历史任务 |
| TTS任务详情 | `GET /api/v1/tts/:id` | 获取任务信息和音频URL |
| TTS任务状态 | `GET /api/v1/tts/:id/status` | 轮询合成进度 |
| 删除TTS任务 | `DELETE /api/v1/tts/:id` | 删除历史任务 |

**前端组件**:
- `SpeechSynthesisSection.tsx` - 语音合成界面
- `HistoryList.tsx` - 历史记录列表

### 2.5 积分管理模块
**位置**: `backend/handlers/credit.go`, `backend/services/credit.go`

| 功能 | API端点 | 说明 |
|------|---------|------|
| 查询余额 | `GET /api/v1/credits/balance` | 获取当前积分 |
| 交易记录 | `GET /api/v1/credits/transactions` | 分页查询积分流水 |

**积分规则**:
- 注册赠送: 100积分
- 声音克隆: 50积分/次
- 语音生成: 10积分/次
- 任务失败自动退款

**前端组件**:
- `AccountView.tsx` - 账户信息视图

### 2.6 VIP会员模块
**位置**: `backend/handlers/vip.go`, `backend/services/vip.go`

**前端组件**:
- `VipView.tsx` - VIP会员视图

### 2.7 管理后台模块
**位置**: `backend/handlers/admin_*.go`

| 功能 | 说明 |
|------|------|
| 管理员认证 | 独立的管理员登录系统 |
| 数据统计 | 用户、任务、收入统计 |
| 用户管理 | 查看和管理所有用户 |

---

## 3. 当前需要测试的功能

### 3.1 高优先级测试项

#### 🔴 用户认证流程
- [ ] 邮箱注册功能
- [ ] 手机号+验证码注册
- [ ] 邮箱/手机号登录
- [ ] JWT Token有效性验证
- [ ] Token过期处理（7天有效期）
- [ ] 登出功能

#### 🔴 音色克隆核心流程
- [ ] 音频文件上传到OSS
- [ ] 创建音色任务（积分扣除）
- [ ] Fish Audio API调用
- [ ] 异步任务状态轮询
- [ ] 克隆成功后音色可用性
- [ ] 克隆失败自动退款

#### 🔴 TTS语音合成流程
- [ ] 选择已完成的音色
- [ ] 输入文本创建TTS任务
- [ ] 异步生成状态轮询
- [ ] 生成音频播放和下载
- [ ] 生成失败自动退款

### 3.2 中优先级测试项

#### 🟡 积分系统
- [ ] 注册赠送积分
- [ ] 积分扣除正确性
- [ ] 积分余额查询
- [ ] 交易记录完整性
- [ ] 并发扣费安全性

#### 🟡 文件管理
- [ ] 音频格式验证（MP3/WAV/M4A/OGG/FLAC/AAC）
- [ ] 文件大小限制（音频50MB，文本5MB）
- [ ] OSS上传成功率
- [ ] 文件URL可访问性

#### 🟡 前后端集成
- [ ] API响应格式（camelCase）
- [ ] 错误处理和提示
- [ ] 加载状态显示
- [ ] 分页功能

### 3.3 低优先级测试项

#### 🟢 用户体验
- [ ] 页面响应速度
- [ ] 移动端适配
- [ ] 错误提示友好性

#### 🟢 边界情况
- [ ] 空文本TTS处理
- [ ] 超长文本处理（10000字符限制）
- [ ] 无效音色ID处理
- [ ] 网络异常处理

---

## 4. 测试环境准备

### 4.1 启动服务
```bash
# 启动前后端服务
./run_frontend_and_backend.sh

# 或分别启动
cd backend && go run main.go
cd voiceclone-pro-console && npm run dev
```

### 4.2 测试账号
建议创建测试账号进行功能验证：
- 邮箱: test@example.com
- 密码: test123456

### 4.3 API测试
```bash
# 运行API测试脚本
./test_api.sh

# 或使用curl手动测试
curl http://localhost:8080/api/v1/health
```

---

## 5. 已知问题和待办事项

### 5.1 待完善功能
- [ ] 支付接口集成（微信/支付宝）
- [ ] 任务队列优化（RabbitMQ/Redis Queue）
- [ ] 日志系统完善
- [ ] 单元测试覆盖

### 5.2 前端优化
- [ ] 状态管理优化
- [ ] 组件性能优化
- [ ] 错误边界处理

---

*文档生成时间: 2026-01-23*
