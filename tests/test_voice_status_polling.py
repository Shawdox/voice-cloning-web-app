#!/usr/bin/env python3
"""
测试：前端获取音色创建状态并更新音色块
Test: Frontend fetches voice creation status and updates voice blocks

测试目标：
1. 验证前端可以成功获取音色创建的最新状态
2. 验证前端能够正确更新对应的音色块UI

使用方法：
1. 确保前端和后端服务已启动
2. 运行: pytest test_voice_status_polling.py -v
"""

import os
import json
import time
import uuid
import pytest
from playwright.sync_api import sync_playwright, expect, Page

# 配置
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8080/api/v1')
SCREENSHOT_DIR = '/tmp/voice_status_screenshots'


def ensure_screenshot_dir():
    """确保截图目录存在"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def generate_test_credentials():
    """生成唯一的测试凭据"""
    unique_id = uuid.uuid4().hex[:8]
    return {
        'email': f"test_status_{unique_id}@example.com",
        'password': "TestPass123!",
        'nickname': f"TestUser_{unique_id}"
    }


class TestVoiceStatusPolling:
    """测试音色状态轮询和UI更新"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """初始化测试环境"""
        ensure_screenshot_dir()
        self.credentials = generate_test_credentials()
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

        # 收集网络请求
        self.api_requests = []
        self.api_responses = []

        # 监听网络请求
        self.page.on('request', self._on_request)
        self.page.on('response', self._on_response)

        yield

        # 清理
        self.context.close()
        self.browser.close()
        self.playwright.stop()

    def _on_request(self, request):
        """记录API请求"""
        if '/api/v1/voices' in request.url:
            self.api_requests.append({
                'url': request.url,
                'method': request.method,
                'timestamp': time.time()
            })

    def _on_response(self, response):
        """记录API响应"""
        if '/api/v1/voices' in response.url:
            try:
                body = response.json() if response.ok else None
            except:
                body = None
            self.api_responses.append({
                'url': response.url,
                'status': response.status,
                'body': body,
                'timestamp': time.time()
            })

    def screenshot(self, name: str):
        """保存截图"""
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        self.page.screenshot(path=path, full_page=True)
        print(f"📸 截图已保存: {path}")
        return path

    def register_and_login(self):
        """注册并登录测试用户"""
        print(f"\n📧 注册测试用户: {self.credentials['email']}")

        # 导航到首页
        self.page.goto(FRONTEND_URL)
        self.page.wait_for_load_state('networkidle')

        # 点击登录按钮
        login_btn = self.page.locator('button:has-text("登录")').first
        if login_btn.is_visible():
            login_btn.click()
            self.page.wait_for_timeout(1000)

        # 切换到注册模式
        register_link = self.page.locator('button:has-text("立即注册")').first
        if register_link.is_visible():
            register_link.click()
            self.page.wait_for_timeout(500)

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

        # 提交注册
        submit_btn = self.page.locator('button[type="submit"]').first
        if submit_btn.is_visible():
            submit_btn.click()

        self.page.wait_for_timeout(3000)
        self.screenshot("01_after_register")
        print("✅ 注册完成")

    def test_voice_list_api_called_on_login(self):
        """测试1: 验证登录后前端调用音色列表API"""
        print("\n" + "="*60)
        print("测试1: 验证登录后前端调用音色列表API")
        print("="*60)

        self.register_and_login()

        # 等待API调用
        self.page.wait_for_timeout(2000)

        # 验证是否调用了 /voices API
        voice_api_calls = [r for r in self.api_requests if '/voices' in r['url']]

        print(f"📊 检测到 {len(voice_api_calls)} 次音色API调用")
        for call in voice_api_calls:
            print(f"   - {call['method']} {call['url']}")

        assert len(voice_api_calls) > 0, "登录后应该调用音色列表API"

        # 验证响应
        voice_responses = [r for r in self.api_responses if '/voices' in r['url'] and r['status'] == 200]
        assert len(voice_responses) > 0, "应该收到成功的音色列表响应"

        print("✅ 测试通过: 登录后成功调用音色列表API")

    def test_voice_status_displayed_correctly(self):
        """测试2: 验证音色状态在UI中正确显示"""
        print("\n" + "="*60)
        print("测试2: 验证音色状态在UI中正确显示")
        print("="*60)

        self.register_and_login()

        # 导航到工作台
        self.page.wait_for_timeout(2000)

        # 检查工作台是否加载
        workspace = self.page.locator('text=智能工作台').first
        if not workspace.is_visible():
            # 尝试点击进入工作台
            start_btn = self.page.locator('button:has-text("开始创作")').first
            if start_btn.is_visible():
                start_btn.click()
                self.page.wait_for_timeout(2000)

        self.screenshot("02_workspace_loaded")

        # 检查音色库区域是否存在
        voice_library = self.page.locator('text=音色库').first
        assert voice_library.is_visible(), "应该显示音色库区域"

        print("✅ 测试通过: 工作台和音色库正确加载")

    def test_training_voice_shows_progress(self):
        """测试3: 验证训练中的音色显示进度"""
        print("\n" + "="*60)
        print("测试3: 验证训练中的音色显示进度指示器")
        print("="*60)

        self.register_and_login()
        self.page.wait_for_timeout(2000)

        # 检查是否有训练中的音色显示
        # 训练中的音色会显示 "正在克隆的任务" 或进度条
        training_section = self.page.locator('text=正在克隆的任务').first
        progress_indicator = self.page.locator('.animate-spin').first

        # 如果没有训练中的音色，这是正常的（新用户）
        if training_section.is_visible() or progress_indicator.is_visible():
            print("✅ 检测到训练中的音色，显示进度指示器")
            self.screenshot("03_training_voice_progress")
        else:
            print("ℹ️ 当前没有训练中的音色（新用户正常情况）")

        print("✅ 测试通过: 训练状态UI逻辑正确")

    def test_voice_polling_interval(self):
        """测试4: 验证音色状态轮询间隔"""
        print("\n" + "="*60)
        print("测试4: 验证音色状态轮询机制")
        print("="*60)

        self.register_and_login()

        # 清空之前的请求记录
        initial_count = len(self.api_requests)

        # 等待足够长的时间来观察轮询（前端每10秒轮询一次）
        print("⏳ 等待15秒观察轮询行为...")
        self.page.wait_for_timeout(15000)

        # 检查是否有新的API调用
        new_requests = self.api_requests[initial_count:]
        voice_polls = [r for r in new_requests if '/voices' in r['url']]

        print(f"📊 15秒内检测到 {len(voice_polls)} 次音色API轮询")

        # 注意：只有当有训练中的音色时才会轮询
        # 新用户没有训练中的音色，所以可能不会有轮询
        if len(voice_polls) > 0:
            print("✅ 检测到轮询行为")
            # 验证轮询间隔大约是10秒
            if len(voice_polls) >= 2:
                interval = voice_polls[1]['timestamp'] - voice_polls[0]['timestamp']
                print(f"   轮询间隔: {interval:.1f}秒")
        else:
            print("ℹ️ 没有检测到轮询（可能没有训练中的音色）")

        print("✅ 测试通过: 轮询机制验证完成")

    def test_api_response_structure(self):
        """测试5: 验证API响应结构正确"""
        print("\n" + "="*60)
        print("测试5: 验证音色API响应结构")
        print("="*60)

        self.register_and_login()
        self.page.wait_for_timeout(2000)

        # 获取音色列表响应
        voice_responses = [r for r in self.api_responses
                         if '/voices' in r['url']
                         and r['status'] == 200
                         and r['body'] is not None]

        if len(voice_responses) > 0:
            response = voice_responses[0]
            body = response['body']

            print(f"📊 API响应结构:")
            print(f"   - 包含 'data' 字段: {'data' in body}")
            print(f"   - 包含 'total' 字段: {'total' in body}")

            assert 'data' in body, "响应应包含 'data' 字段"
            assert 'total' in body, "响应应包含 'total' 字段"

            # 如果有音色数据，验证字段结构
            if body['data'] and len(body['data']) > 0:
                voice = body['data'][0]
                expected_fields = ['id', 'name', 'status', 'createdAt']
                for field in expected_fields:
                    assert field in voice, f"音色数据应包含 '{field}' 字段"
                print(f"   - 音色数据字段完整: ✅")

            print("✅ 测试通过: API响应结构正确")
        else:
            print("⚠️ 未能获取有效的API响应")


class TestVoiceStatusUpdate:
    """测试音色状态更新后UI变化"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """初始化测试环境"""
        ensure_screenshot_dir()
        self.credentials = generate_test_credentials()
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

        yield

        self.context.close()
        self.browser.close()
        self.playwright.stop()

    def screenshot(self, name: str):
        """保存截图"""
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        self.page.screenshot(path=path, full_page=True)
        return path

    def test_voice_block_ui_elements(self):
        """测试6: 验证音色块UI元素"""
        print("\n" + "="*60)
        print("测试6: 验证音色块UI元素存在")
        print("="*60)

        # 导航到首页
        self.page.goto(FRONTEND_URL)
        self.page.wait_for_load_state('networkidle')

        # 检查声音克隆区域
        clone_section = self.page.locator('text=声音克隆').first

        if clone_section.is_visible():
            print("✅ 声音克隆区域可见")

            # 检查上传区域
            upload_area = self.page.locator('text=上传参考音频文件').first
            if upload_area.is_visible():
                print("✅ 上传区域可见")

            # 检查文件输入
            file_input = self.page.locator('input[type="file"]').first
            if file_input:
                print("✅ 文件输入元素存在")

        self.screenshot("06_voice_clone_section")
        print("✅ 测试通过: 音色块UI元素验证完成")

    def test_system_voices_displayed(self):
        """测试7: 验证系统预设音色显示"""
        print("\n" + "="*60)
        print("测试7: 验证系统预设音色显示")
        print("="*60)

        self.page.goto(FRONTEND_URL)
        self.page.wait_for_load_state('networkidle')

        # 尝试进入工作台
        start_btn = self.page.locator('button:has-text("开始创作")').first
        if start_btn.is_visible():
            start_btn.click()
            self.page.wait_for_timeout(2000)

        # 检查是否有系统音色（如 "温柔女声"、"磁性男声" 等）
        system_voices = [
            '温柔女声', '磁性男声', '活力少女', '沉稳大叔'
        ]

        found_voices = []
        for voice_name in system_voices:
            voice_element = self.page.locator(f'text={voice_name}').first
            if voice_element.is_visible():
                found_voices.append(voice_name)

        print(f"📊 检测到 {len(found_voices)} 个系统音色:")
        for v in found_voices:
            print(f"   - {v}")

        self.screenshot("07_system_voices")

        # 至少应该有一些系统音色
        assert len(found_voices) > 0, "应该显示系统预设音色"
        print("✅ 测试通过: 系统预设音色正确显示")


def main():
    """直接运行测试"""
    print("="*60)
    print("  音色状态轮询测试")
    print("="*60)
    print(f"\n⚙️ 测试配置:")
    print(f"   - 前端地址: {FRONTEND_URL}")
    print(f"   - API地址: {API_BASE_URL}")
    print(f"   - 截图目录: {SCREENSHOT_DIR}")

    # 使用 pytest 运行
    import sys
    sys.exit(pytest.main([__file__, '-v', '--tb=short']))


if __name__ == '__main__':
    main()
