# 项目文件清单

## 📁 后端代码 (backend/)

### 配置和入口
- `main.go` - 程序入口，初始化所有服务
- `go.mod` - Go模块依赖定义
- `.env` - 环境变量配置（包含密钥）
- `.env.example` - 环境变量模板

### 配置管理 (config/)
- `config.go` - 统一配置加载和管理

### 数据库 (database/)
- `database.go` - PostgreSQL连接和自动迁移

### 数据模型 (models/)
- `user.go` - 用户、积分交易、充值订单模型
- `voice.go` - 音色、TTS任务模型

### API处理器 (handlers/)
- `auth.go` - 用户认证（注册、登录、获取信息）
- `credit.go` - 积分管理（余额、交易记录）
- `tts.go` - TTS生成（创建、查询、列表）
- `upload.go` - 文件上传（音频、文本）
- `voice.go` - 音色管理（创建、查询、删除）

### 中间件 (middleware/)
- `auth.go` - JWT认证和管理员权限中间件
- `cors.go` - CORS跨域配置

### 路由 (routes/)
- `routes.go` - 完整的路由配置

### 业务服务 (services/)
- `credit.go` - 积分服务（扣费、充值、查询）
- `fish_audio.go` - Fish Audio API集成
- `oss.go` - 阿里云OSS文件上传
- `sms.go` - 阿里云短信验证码

### 工具函数 (utils/)
- `jwt.go` - JWT令牌生成和解析
- `password.go` - 密码加密和验证

---

## 📚 文档

### 项目文档
- `README.md` - 项目总览和快速开始
- `SETUP_GUIDE.md` - 详细的安装和测试指南
- `API_DOCUMENTATION.md` - 完整的API接口文档
- `PROJECT_STATUS.md` - 项目完成状态报告
- `DEVELOPMENT_COMPLETE.md` - 开发完成总结
- `FILES_OVERVIEW.md` - 本文档

### 后端文档
- `backend/README.md` - 后端开发文档

---

## 🔧 脚本工具

- `check_env.sh` - 环境依赖检查脚本
- `test_api.sh` - API测试脚本

---

## 📊 统计信息

### 代码文件
- Go源文件: 19个
- 总代码行数: ~3000行
- 文档文件: 7个
- 脚本文件: 2个

### API接口
- 认证相关: 4个
- 文件上传: 2个
- 音色管理: 5个
- TTS生成: 5个
- 积分管理: 2个
- 系统: 1个
- **总计: 19个接口**

### 数据库表
1. users - 用户表
2. voices - 音色表
3. tts_tasks - TTS任务表
4. credit_transactions - 积分交易表
5. recharge_orders - 充值订单表

---

## 🎯 核心功能模块

### 1. 用户系统
- 邮箱/手机号注册登录
- JWT认证
- 短信验证码
- 用户信息管理

### 2. 文件管理
- 音频文件上传（OSS）
- 文本文件上传
- MD5去重

### 3. 音色克隆
- Fish Audio API集成
- 异步任务处理
- 状态查询

### 4. 语音生成
- TTS任务创建
- 异步生成
- 历史记录

### 5. 积分系统
- 积分扣费
- 交易记录
- 自动退款
- 并发安全

---

## 📖 阅读顺序建议

### 新手开发者
1. `README.md` - 了解项目
2. `SETUP_GUIDE.md` - 安装环境
3. `backend/README.md` - 后端架构
4. `backend/main.go` - 程序入口
5. `backend/routes/routes.go` - API路由
6. `API_DOCUMENTATION.md` - API文档

### 测试使用
1. 运行 `./check_env.sh` - 检查环境
2. 启动后端服务
3. 运行 `./test_api.sh` - 测试API
4. 参考 `API_DOCUMENTATION.md`

### 二次开发
1. `PROJECT_STATUS.md` - 了解完成状态
2. `backend/models/` - 数据模型
3. `backend/services/` - 业务逻辑
4. `backend/handlers/` - API实现

---

## 🔍 关键文件说明

### backend/main.go
程序启动入口，负责：
- 加载配置
- 初始化数据库
- 初始化Redis
- 初始化OSS和Fish Audio
- 启动HTTP服务器

### backend/services/fish_audio.go
Fish Audio API集成，提供：
- 创建音色
- 查询音色状态
- 生成语音
- 查询TTS任务状态

### backend/handlers/voice.go
音色管理核心逻辑：
- 创建音色（扣费+异步处理）
- 轮询Fish Audio状态
- 音色列表查询

### backend/handlers/tts.go
TTS生成核心逻辑：
- 创建任务（扣费+异步处理）
- 轮询生成状态
- 任务管理

### backend/services/credit.go
积分系统核心：
- 事务安全的积分操作
- 数据库行锁防并发
- 自动记录交易

---

## 💡 下一步开发

### 后端优化
- [ ] 添加管理后台API
- [ ] 实现支付接口
- [ ] 添加任务队列（RabbitMQ/Redis Queue）
- [ ] 添加日志系统
- [ ] 添加单元测试

### 前端开发
- [ ] 初始化Vue 3项目
- [ ] 实现用户界面
- [ ] 实现管理后台
- [ ] 前后端联调

---

## 📞 技术支持

如有问题：
1. 查看相关文档
2. 检查日志输出
3. 运行环境检查脚本
4. 参考API文档测试

