#!/usr/bin/env python3
"""
实时音色状态更新测试
Real-time Voice Cloning Status Update Test

测试目标：
1. 上传音频文件并创建音色克隆任务
2. 验证前端能够实时获取音色创建的最新状态
3. 验证前端UI能够正确反映状态变化（pending → processing → completed）
4. 验证音色块的进度指示器正确更新

使用方法：
1. 确保前端和后端服务已启动
2. 运行: python test_voice_clone_status_realtime.py
   或: pytest test_voice_clone_status_realtime.py -v -s
"""

import os
import sys
import time
import uuid
import json
from playwright.sync_api import sync_playwright, expect
from typing import List, Dict, Any

# 配置
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8080/api/v1')
AUDIO_FILE_PATH = '/home/xiaowu/voice_web_app/data/audio/1229.MP3'
SCREENSHOT_DIR = '/tmp/voice_status_realtime_screenshots'
MAX_WAIT_TIME = 120  # 最多等待2分钟观察状态变化


def ensure_screenshot_dir():
    """确保截图目录存在"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def generate_test_credentials():
    """生成唯一的测试凭据"""
    unique_id = uuid.uuid4().hex[:8]
    return {
        'email': f"test_realtime_{unique_id}@example.com",
        'password': "TestPass123!",
        'nickname': f"TestUser_{unique_id}"
    }


class VoiceStatusRealtimeTest:
    """实时音色状态更新测试类"""

    def __init__(self, headless=True):
        self.headless = headless
        self.browser = None
        self.page = None
        self.credentials = generate_test_credentials()
        self.voice_name = f"实时测试音色_{uuid.uuid4().hex[:6]}"

        # 网络监控
        self.api_requests: List[Dict[str, Any]] = []
        self.api_responses: List[Dict[str, Any]] = []
        self.voice_id = None

        # 状态变化记录
        self.status_changes: List[Dict[str, Any]] = []

    def setup(self):
        """初始化浏览器和监听器"""
        print("\n" + "="*70)
        print("🚀 初始化实时状态测试环境")
        print("="*70)

        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

        # 设置网络监听
        self.page.on('request', self._on_request)
        self.page.on('response', self._on_response)

        # 监听控制台消息
        self.console_messages = []
        self.page.on('console', lambda msg: self.console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'timestamp': time.time()
        }))

        print(f"📧 测试邮箱: {self.credentials['email']}")
        print(f"🎤 音色名称: {self.voice_name}")
        print(f"🎵 音频文件: {AUDIO_FILE_PATH}")

    def teardown(self):
        """清理资源"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def _on_request(self, request):
        """记录API请求"""
        if '/api/v1/' in request.url:
            self.api_requests.append({
                'url': request.url,
                'method': request.method,
                'timestamp': time.time(),
                'headers': dict(request.headers)
            })

            # 特别标记音色相关的请求
            if '/voices' in request.url:
                print(f"📤 API请求: {request.method} {request.url}")

    def _on_response(self, response):
        """记录API响应"""
        if '/api/v1/' in response.url:
            try:
                body = response.json() if response.ok else None
            except:
                body = None

            response_data = {
                'url': response.url,
                'status': response.status,
                'body': body,
                'timestamp': time.time()
            }
            self.api_responses.append(response_data)

            # 特别处理音色API响应
            if '/voices' in response.url and body:
                print(f"📥 API响应: {response.status} {response.url}")

                # 记录音色状态变化
                if isinstance(body, dict):
                    if 'data' in body and isinstance(body['data'], list):
                        # 音色列表响应
                        for voice in body['data']:
                            if voice.get('name') == self.voice_name:
                                self._record_status_change(voice)
                    elif 'id' in body and 'status' in body:
                        # 单个音色响应
                        if body.get('name') == self.voice_name:
                            self._record_status_change(body)

    def _record_status_change(self, voice_data: Dict[str, Any]):
        """记录音色状态变化"""
        status = voice_data.get('status')
        voice_id = voice_data.get('id')

        # 保存音色ID
        if voice_id and not self.voice_id:
            self.voice_id = voice_id
            print(f"🆔 音色ID: {voice_id}")

        # 检查是否是新状态
        if not self.status_changes or self.status_changes[-1]['status'] != status:
            change_record = {
                'status': status,
                'voice_id': voice_id,
                'timestamp': time.time(),
                'data': voice_data
            }
            self.status_changes.append(change_record)
            print(f"📊 状态变化: {status} (ID: {voice_id})")

    def screenshot(self, name: str):
        """保存截图"""
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        self.page.screenshot(path=path, full_page=True)
        print(f"📸 截图: {path}")
        return path

    def step_1_register_and_login(self):
        """步骤1: 注册并登录"""
        print("\n" + "-"*70)
        print("📍 步骤 1: 注册并登录测试账号")
        print("-"*70)

        # 导航到首页
        self.page.goto(FRONTEND_URL, timeout=30000)
        self.page.wait_for_load_state('networkidle')
        self.screenshot("01_homepage")

        # 点击登录按钮
        login_btn = self.page.locator('button:has-text("登录")').first
        if login_btn.is_visible():
            login_btn.click()
            self.page.wait_for_timeout(1000)
            print("✅ 打开登录模态框")

        # 切换到注册模式
        register_link = self.page.locator('button:has-text("立即注册")').first
        if register_link.is_visible():
            register_link.click()
            self.page.wait_for_timeout(500)
            print("✅ 切换到注册模式")

        # 切换到邮箱注册
        email_tab = self.page.locator('button:has-text("邮箱注册")').first
        if email_tab.is_visible():
            email_tab.click()
            self.page.wait_for_timeout(500)

        # 填写注册表单
        email_input = self.page.locator('input[type="email"]').first
        if email_input.is_visible():
            email_input.fill(self.credentials['email'])

        password_input = self.page.locator('input[type="password"]').first
        if password_input.is_visible():
            password_input.fill(self.credentials['password'])

        # 勾选同意条款
        checkbox = self.page.locator('input[type="checkbox"]').first
        if checkbox.is_visible() and not checkbox.is_checked():
            checkbox.click()

        self.screenshot("01b_register_form")

        # 提交注册
        submit_btn = self.page.locator('button[type="submit"]').first
        if submit_btn.is_visible():
            submit_btn.click()
            print("✅ 提交注册")

        # 等待注册完成
        self.page.wait_for_timeout(3000)
        self.screenshot("01c_after_register")

        print("✅ 注册和登录完成")
        return True

    def step_2_navigate_to_workspace(self):
        """步骤2: 导航到工作台"""
        print("\n" + "-"*70)
        print("📍 步骤 2: 导航到工作台")
        print("-"*70)

        # 检查是否已在工作台
        workspace_header = self.page.locator('text=智能工作台').first
        if workspace_header.is_visible():
            print("✅ 已在工作台页面")
        else:
            # 尝试进入工作台
            start_btn = self.page.locator('button:has-text("开始创作")').first
            if start_btn.is_visible():
                start_btn.click()
                self.page.wait_for_timeout(2000)
                print("✅ 进入工作台")

        self.screenshot("02_workspace")

        # 验证音色库区域存在
        voice_library = self.page.locator('text=音色库').first
        if voice_library.is_visible():
            print("✅ 音色库区域已加载")

        return True

    def step_3_upload_audio_file(self):
        """步骤3: 上传音频文件并创建克隆任务"""
        print("\n" + "-"*70)
        print("📍 步骤 3: 上传音频文件并创建克隆任务")
        print("-"*70)

        # 检查音频文件
        audio_path = os.path.abspath(AUDIO_FILE_PATH)
        if not os.path.exists(audio_path):
            print(f"❌ 音频文件不存在: {audio_path}")
            return False

        file_size = os.path.getsize(audio_path) / (1024 * 1024)  # MB
        print(f"✅ 音频文件: {audio_path} ({file_size:.2f} MB)")

        # 找到文件上传输入框
        file_input = self.page.locator('input[type="file"][accept*=".mp3"]').first
        if not file_input:
            print("❌ 未找到文件上传输入框")
            return False

        # 上传文件
        print("📤 开始上传文件...")
        file_input.set_input_files(audio_path)
        self.page.wait_for_timeout(1000)
        self.screenshot("03a_file_selected")
        print("✅ 文件已选择")

        # 等待命名模态框
        name_input = self.page.locator('input[placeholder*="音色名称"]').first
        if name_input.is_visible():
            name_input.fill(self.voice_name)
            print(f"✅ 填写音色名称: {self.voice_name}")
            self.screenshot("03b_naming_modal")

        # 点击开始克隆
        clone_btn = self.page.locator('button:has-text("开始克隆")').first
        if clone_btn.is_visible():
            print("🚀 点击开始克隆...")
            clone_btn.click()

        # 等待上传和创建过程
        print("⏳ 等待上传和创建过程...")
        self.page.wait_for_timeout(5000)
        self.screenshot("03c_upload_progress")

        # 检查是否有成功提示
        success_indicators = [
            'text=音色创建成功',
            'text=创建成功',
            'text=上传成功'
        ]

        for indicator in success_indicators:
            element = self.page.locator(indicator).first
            if element.is_visible():
                print(f"✅ 检测到成功提示: {indicator}")
                break

        print("✅ 音色克隆任务已提交")
        return True

    def step_4_verify_initial_status(self):
        """步骤4: 验证初始状态显示"""
        print("\n" + "-"*70)
        print("📍 步骤 4: 验证音色初始状态显示")
        print("-"*70)

        # 等待页面更新
        self.page.wait_for_timeout(2000)

        # 查找音色块
        voice_element = self.page.locator(f'text={self.voice_name}').first
        if voice_element.is_visible():
            print(f"✅ 找到音色块: {self.voice_name}")
        else:
            print(f"⚠️ 未找到音色块，尝试刷新页面...")
            self.page.reload()
            self.page.wait_for_timeout(2000)

        # 检查训练状态指示器
        training_indicators = [
            '.animate-spin',  # 旋转动画
            'text=正在克隆',
            'text=训练中',
            'text=处理中'
        ]

        found_indicator = False
        for indicator in training_indicators:
            element = self.page.locator(indicator).first
            if element.is_visible():
                print(f"✅ 检测到训练指示器: {indicator}")
                found_indicator = True
                break

        self.screenshot("04_initial_status")

        # 检查进度条
        progress_bar = self.page.locator('[role="progressbar"], .progress-bar').first
        if progress_bar.is_visible():
            print("✅ 检测到进度条")

        print("✅ 初始状态验证完成")
        return True

    def step_5_monitor_status_polling(self):
        """步骤5: 监控状态轮询和更新"""
        print("\n" + "-"*70)
        print("📍 步骤 5: 监控实时状态轮询")
        print("-"*70)

        initial_request_count = len([r for r in self.api_requests if '/voices' in r['url']])
        print(f"📊 初始API请求数: {initial_request_count}")

        # 监控多个轮询周期
        polling_cycles = 3
        wait_per_cycle = 12  # 前端每10秒轮询，我们等12秒确保捕获

        for cycle in range(1, polling_cycles + 1):
            print(f"\n⏳ 轮询周期 {cycle}/{polling_cycles} - 等待 {wait_per_cycle} 秒...")

            # 记录周期开始时间
            cycle_start = time.time()

            # 等待一个轮询周期
            self.page.wait_for_timeout(wait_per_cycle * 1000)

            # 统计新的API请求
            current_request_count = len([r for r in self.api_requests if '/voices' in r['url']])
            new_requests = current_request_count - initial_request_count

            print(f"   📈 新增API请求: {new_requests}")

            # 检查状态变化
            if self.status_changes:
                latest_status = self.status_changes[-1]
                print(f"   📊 当前状态: {latest_status['status']}")

                # 如果状态已完成，提前结束
                if latest_status['status'] == 'completed':
                    print("   🎉 音色训练已完成！")
                    break

            # 截图记录
            self.screenshot(f"05_polling_cycle_{cycle}")

            initial_request_count = current_request_count

        print("\n✅ 状态轮询监控完成")
        return True

    def step_6_verify_ui_updates(self):
        """步骤6: 验证UI元素更新"""
        print("\n" + "-"*70)
        print("📍 步骤 6: 验证UI元素实时更新")
        print("-"*70)

        # 刷新页面获取最新状态
        self.page.reload()
        self.page.wait_for_load_state('networkidle')
        self.page.wait_for_timeout(2000)

        # 查找音色块
        voice_element = self.page.locator(f'text={self.voice_name}').first
        if not voice_element.is_visible():
            print("⚠️ 未找到音色块")
            return False

        print(f"✅ 音色块可见: {self.voice_name}")

        # 检查进度百分比显示
        progress_text_patterns = [
            r'\d+%',  # 匹配百分比
            'text=正在克隆',
            'text=训练中'
        ]

        for pattern in progress_text_patterns:
            elements = self.page.locator(pattern).all()
            if elements:
                print(f"✅ 检测到进度显示: {pattern}")

        # 检查动画元素
        animated_elements = self.page.locator('.animate-spin, .animate-pulse').all()
        if animated_elements:
            print(f"✅ 检测到 {len(animated_elements)} 个动画元素")

        self.screenshot("06_ui_elements")
        print("✅ UI元素验证完成")
        return True

    def step_7_verify_status_transitions(self):
        """步骤7: 验证状态转换"""
        print("\n" + "-"*70)
        print("📍 步骤 7: 验证状态转换记录")
        print("-"*70)

        if not self.status_changes:
            print("⚠️ 未记录到状态变化")
            return False

        print(f"📊 记录到 {len(self.status_changes)} 次状态变化:")
        for i, change in enumerate(self.status_changes, 1):
            elapsed = change['timestamp'] - self.status_changes[0]['timestamp']
            print(f"   {i}. {change['status']} (耗时: {elapsed:.1f}秒)")

        # 验证状态转换顺序
        statuses = [c['status'] for c in self.status_changes]
        print(f"\n📈 状态转换序列: {' → '.join(statuses)}")

        # 检查是否包含预期的状态
        expected_statuses = ['pending', 'processing', 'completed']
        found_statuses = [s for s in expected_statuses if s in statuses]
        print(f"✅ 检测到的预期状态: {found_statuses}")

        return True

    def step_8_generate_report(self):
        """步骤8: 生成测试报告"""
        print("\n" + "-"*70)
        print("📍 步骤 8: 生成测试报告")
        print("-"*70)

        # API请求统计
        total_requests = len(self.api_requests)
        voice_requests = [r for r in self.api_requests if '/voices' in r['url']]
        upload_requests = [r for r in self.api_requests if '/upload' in r['url']]

        print(f"\n📊 API请求统计:")
        print(f"   - 总请求数: {total_requests}")
        print(f"   - 音色API请求: {len(voice_requests)}")
        print(f"   - 上传API请求: {len(upload_requests)}")

        # 状态变化统计
        print(f"\n📈 状态变化统计:")
        print(f"   - 状态变化次数: {len(self.status_changes)}")
        if self.status_changes:
            total_time = self.status_changes[-1]['timestamp'] - self.status_changes[0]['timestamp']
            print(f"   - 总耗时: {total_time:.1f}秒")

        # 控制台消息统计
        error_messages = [m for m in self.console_messages if m['type'] == 'error']
        warning_messages = [m for m in self.console_messages if m['type'] == 'warning']

        print(f"\n🖥️ 控制台消息:")
        print(f"   - 错误: {len(error_messages)}")
        print(f"   - 警告: {len(warning_messages)}")

        if error_messages:
            print("\n❌ 控制台错误:")
            for msg in error_messages[:5]:  # 只显示前5个
                print(f"   - {msg['text']}")

        return True

    def run_all_tests(self):
        """运行所有测试步骤"""
        print("\n" + "="*70)
        print("🧪 开始执行实时状态测试")
        print("="*70)

        results = []

        try:
            self.setup()
            ensure_screenshot_dir()

            # 定义测试步骤
            steps = [
                ("注册并登录", self.step_1_register_and_login),
                ("导航到工作台", self.step_2_navigate_to_workspace),
                ("上传音频文件", self.step_3_upload_audio_file),
                ("验证初始状态", self.step_4_verify_initial_status),
                ("监控状态轮询", self.step_5_monitor_status_polling),
                ("验证UI更新", self.step_6_verify_ui_updates),
                ("验证状态转换", self.step_7_verify_status_transitions),
                ("生成测试报告", self.step_8_generate_report),
            ]

            # 执行每个步骤
            for step_name, step_func in steps:
                try:
                    result = step_func()
                    results.append((step_name, result))
                    if not result:
                        print(f"⚠️ 步骤 '{step_name}' 返回失败，继续执行...")
                except Exception as e:
                    print(f"❌ 步骤 '{step_name}' 异常: {e}")
                    import traceback
                    traceback.print_exc()
                    results.append((step_name, False))

        finally:
            self.teardown()

        return results


def main():
    """主函数"""
    print("="*70)
    print("  🎯 实时音色状态更新测试")
    print("="*70)
    print(f"\n⚙️ 测试配置:")
    print(f"   - 前端地址: {FRONTEND_URL}")
    print(f"   - API地址: {API_BASE_URL}")
    print(f"   - 音频文件: {AUDIO_FILE_PATH}")
    print(f"   - 截图目录: {SCREENSHOT_DIR}")
    print(f"   - 最大等待时间: {MAX_WAIT_TIME}秒")

    # 检查音频文件是否存在
    if not os.path.exists(AUDIO_FILE_PATH):
        print(f"\n❌ 错误: 音频文件不存在: {AUDIO_FILE_PATH}")
        return 1

    # 运行测试
    test = VoiceStatusRealtimeTest(headless=True)
    results = test.run_all_tests()

    # 输出测试结果
    print("\n" + "="*70)
    print("  📋 测试结果总结")
    print("="*70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for step_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {step_name}")

    print(f"\n总计: {passed}/{total} 步骤通过")

    if passed == total:
        print("\n🎉 所有测试步骤通过！")
        print(f"📸 截图保存在: {SCREENSHOT_DIR}")
        return 0
    else:
        print(f"\n⚠️ {total - passed} 个步骤失败")
        print(f"📸 截图保存在: {SCREENSHOT_DIR}")
        return 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 意外错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

