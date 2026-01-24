# 实时音色状态更新测试文档
# Real-time Voice Cloning Status Update Test Documentation

## 📋 测试概述 (Test Overview)

这个测试验证前端能够实时获取音色创建的最新状态，并正确更新UI界面。

This test verifies that the frontend can fetch the latest voice creation status in real-time and correctly update the UI.

## 🎯 测试目标 (Test Objectives)

1. ✅ **上传音频文件** - 测试上传指定的音频文件 (`1229.MP3`)
2. ✅ **创建克隆任务** - 验证音色克隆任务成功创建
3. ✅ **状态轮询** - 验证前端每10秒轮询一次音色状态
4. ✅ **UI实时更新** - 验证音色块的进度指示器和状态正确更新
5. ✅ **状态转换** - 验证状态按预期顺序转换 (pending → processing → completed)
6. ✅ **网络监控** - 记录所有API请求和响应，验证数据正确性

## 🔧 测试环境要求 (Requirements)

### 前置条件 (Prerequisites)

1. **前端服务运行中** - Frontend running on `http://localhost:3000`
2. **后端服务运行中** - Backend running on `http://localhost:8080`
3. **音频文件存在** - Audio file at `/home/xiaowu/voice_web_app/data/audio/1229.MP3`
4. **Python 依赖已安装** - Python dependencies installed

### 安装依赖 (Install Dependencies)

```bash
cd /home/xiaowu/voice_web_app/tests
pip install -r requirements.txt
playwright install chromium
```

## 🚀 运行测试 (Run Tests)

### 方法1: 直接运行 Python 脚本

```bash
cd /home/xiaowu/voice_web_app/tests
python test_voice_clone_status_realtime.py
```

### 方法2: 使用 pytest 运行

```bash
cd /home/xiaowu/voice_web_app/tests
pytest test_voice_clone_status_realtime.py -v -s
```

### 方法3: 使用 pytest 生成 HTML 报告

```bash
cd /home/xiaowu/voice_web_app/tests
pytest test_voice_clone_status_realtime.py -v -s --html=reports/realtime_status_report.html --self-contained-html
```

## 📊 测试步骤详解 (Test Steps)

### 步骤 1: 注册并登录
- 生成唯一的测试邮箱和密码
- 自动注册新用户
- 验证登录成功

### 步骤 2: 导航到工作台
- 进入智能工作台页面
- 验证音色库区域加载

### 步骤 3: 上传音频文件
- 选择指定的音频文件 (`1229.MP3`)
- 填写音色名称
- 提交克隆任务
- 验证上传成功

### 步骤 4: 验证初始状态
- 检查音色块是否显示
- 验证训练状态指示器（旋转动画、进度条）
- 截图记录初始状态

### 步骤 5: 监控状态轮询
- 观察3个轮询周期（每周期12秒）
- 记录所有API请求
- 验证轮询间隔约为10秒
- 检测状态变化

### 步骤 6: 验证UI更新
- 刷新页面获取最新状态
- 验证进度百分比显示
- 检查动画元素（旋转、脉冲）
- 截图记录UI状态

### 步骤 7: 验证状态转换
- 分析记录的状态变化
- 验证状态转换顺序
- 计算状态转换耗时

### 步骤 8: 生成测试报告
- 统计API请求数量
- 统计状态变化次数
- 检查控制台错误和警告
- 输出详细报告

## 📸 截图输出 (Screenshots)

测试过程中会自动保存截图到：`/tmp/voice_status_realtime_screenshots/`

截图包括：
- `01_homepage.png` - 首页
- `01b_register_form.png` - 注册表单
- `01c_after_register.png` - 注册后
- `02_workspace.png` - 工作台
- `03a_file_selected.png` - 文件选择
- `03b_naming_modal.png` - 命名模态框
- `03c_upload_progress.png` - 上传进度
- `04_initial_status.png` - 初始状态
- `05_polling_cycle_1.png` - 轮询周期1
- `05_polling_cycle_2.png` - 轮询周期2
- `05_polling_cycle_3.png` - 轮询周期3
- `06_ui_elements.png` - UI元素

## 📈 测试输出示例 (Sample Output)

```
======================================================================
🚀 初始化实时状态测试环境
======================================================================
📧 测试邮箱: test_realtime_a1b2c3d4@example.com
🎤 音色名称: 实时测试音色_e5f6g7
🎵 音频文件: /home/xiaowu/voice_web_app/data/audio/1229.MP3

----------------------------------------------------------------------
📍 步骤 1: 注册并登录测试账号
----------------------------------------------------------------------
✅ 打开登录模态框
✅ 切换到注册模式
✅ 提交注册
✅ 注册和登录完成

----------------------------------------------------------------------
📍 步骤 5: 监控实时状态轮询
----------------------------------------------------------------------
📊 初始API请求数: 3

⏳ 轮询周期 1/3 - 等待 12 秒...
   📈 新增API请求: 1
   📊 当前状态: pending

⏳ 轮询周期 2/3 - 等待 12 秒...
   📈 新增API请求: 1
   📊 当前状态: processing

⏳ 轮询周期 3/3 - 等待 12 秒...
   📈 新增API请求: 1
   📊 当前状态: processing

======================================================================
  📋 测试结果总结
======================================================================
✅ PASS - 注册并登录
✅ PASS - 导航到工作台
✅ PASS - 上传音频文件
✅ PASS - 验证初始状态
✅ PASS - 监控状态轮询
✅ PASS - 验证UI更新
✅ PASS - 验证状态转换
✅ PASS - 生成测试报告

总计: 8/8 步骤通过

🎉 所有测试步骤通过！
📸 截图保存在: /tmp/voice_status_realtime_screenshots
```

## 🔍 验证要点 (Verification Points)

### API层面验证
- ✅ POST `/api/v1/upload/audio` - 上传音频文件
- ✅ POST `/api/v1/voices` - 创建音色克隆任务
- ✅ GET `/api/v1/voices` - 获取音色列表（轮询）
- ✅ 响应包含正确的字段：`id`, `name`, `status`, `createdAt`
- ✅ 状态值正确：`pending`, `processing`, `completed`

### UI层面验证
- ✅ 音色块正确显示音色名称
- ✅ 训练状态显示进度指示器（旋转图标）
- ✅ 进度百分比正确显示（10%, 50%, 100%）
- ✅ 进度条动画正常工作
- ✅ 状态文本正确显示（"正在克隆"、"训练中"）

### 轮询机制验证
- ✅ 只有训练中的音色才触发轮询
- ✅ 轮询间隔约为10秒
- ✅ 轮询在音色完成后停止

## ⚙️ 配置选项 (Configuration)

可以通过环境变量自定义配置：

```bash
export FRONTEND_URL="http://localhost:3000"
export API_BASE_URL="http://localhost:8080/api/v1"
python test_voice_clone_status_realtime.py
```

## 🐛 故障排查 (Troubleshooting)

### 问题1: 音频文件不存在
```
❌ 错误: 音频文件不存在: /home/xiaowu/voice_web_app/data/audio/1229.MP3
```
**解决方案**: 确保音频文件存在于指定路径

### 问题2: 前端或后端未运行
```
❌ 页面加载失败
```
**解决方案**:
```bash
# 启动前端和后端
cd /home/xiaowu/voice_web_app
./run_frontend_and_backend.sh
```

### 问题3: Playwright 浏览器未安装
```
❌ Executable doesn't exist at /path/to/chromium
```
**解决方案**:
```bash
playwright install chromium
```

### 问题4: 未检测到状态轮询
```
⚠️ 没有检测到轮询（可能没有训练中的音色）
```
**说明**: 这是正常的，如果音色训练很快完成，可能不会观察到多次轮询

## 📝 注意事项 (Notes)

1. **测试时长**: 完整测试大约需要 1-2 分钟
2. **网络监控**: 测试会记录所有API请求和响应
3. **截图**: 每个关键步骤都会自动截图
4. **清理**: 测试会创建新用户，不会自动清理（可手动清理数据库）
5. **并发**: 可以同时运行多个测试实例（使用不同的邮箱）

## 🔗 相关测试 (Related Tests)

- `test_e2e_voice_clone.py` - 完整的端到端语音克隆测试
- `test_voice_status_polling.py` - 音色状态轮询机制测试
- `test_frontend.py` - 前端功能测试
- `test_frontend_standalone.py` - 独立前端测试

## 📞 支持 (Support)

如有问题，请查看：
- 测试截图: `/tmp/voice_status_realtime_screenshots/`
- 控制台输出: 包含详细的步骤信息和错误消息
- 后端日志: 检查后端服务的日志输出
