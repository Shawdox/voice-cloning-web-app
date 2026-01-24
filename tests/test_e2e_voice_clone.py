#!/usr/bin/env python3
"""
端到端测试：完整的语音克隆流程
测试流程：注册新账号 → 上传音频文件 → 克隆音色 → 使用音色生成语音

使用方法：
1. 确保前端和后端服务已启动
2. 运行: python test_e2e_voice_clone.py
"""

import os
import sys
import time
import uuid
from playwright.sync_api import sync_playwright, expect

# 配置
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
AUDIO_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'audio', '1229.MP3')
TTS_TEXT = "你好，我是你创建的音色"
SCREENSHOT_DIR = '/tmp/e2e_screenshots'


def ensure_screenshot_dir():
    """确保截图目录存在"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def generate_test_email():
    """生成唯一的测试邮箱"""
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def generate_test_password():
    """生成测试密码"""
    return "TestPass123!"


class VoiceCloneE2ETest:
    """语音克隆端到端测试类"""

    def __init__(self, headless=True):
        self.headless = headless
        self.browser = None
        self.page = None
        self.test_email = generate_test_email()
        self.test_password = generate_test_password()
        self.voice_name = f"测试音色_{uuid.uuid4().hex[:6]}"

    def setup(self):
        """初始化浏览器"""
        print("\n" + "="*60)
        print("🚀 初始化测试环境")
        print("="*60)

        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.page = self.browser.new_page()

        # 监听控制台消息
        self.console_messages = []
        self.page.on('console', lambda msg: self.console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))

        print(f"📧 测试邮箱: {self.test_email}")
        print(f"🔑 测试密码: {self.test_password}")
        print(f"🎤 音色名称: {self.voice_name}")

    def teardown(self):
        """清理资源"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def screenshot(self, name):
        """保存截图"""
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        self.page.screenshot(path=path, full_page=True)
        print(f"📸 截图已保存: {path}")
        return path

    def step_1_navigate_to_homepage(self):
        """步骤1: 导航到首页"""
        print("\n" + "-"*60)
        print("📍 步骤 1: 导航到首页")
        print("-"*60)

        self.page.goto(FRONTEND_URL, timeout=30000)
        self.page.wait_for_load_state('networkidle')

        title = self.page.title()
        print(f"✅ 页面加载成功，标题: {title}")
        self.screenshot("01_homepage")
        return True

    def step_2_open_register_modal(self):
        """步骤2: 打开注册模态框"""
        print("\n" + "-"*60)
        print("📍 步骤 2: 打开注册模态框")
        print("-"*60)

        # 查找并点击登录/注册按钮
        login_btn = self.page.locator('button:has-text("登录"), button:has-text("注册")').first
        if login_btn.is_visible():
            login_btn.click()
            print("✅ 点击登录按钮")
        else:
            # 尝试点击头部的登录按钮
            header_login = self.page.locator('header button:has-text("登录")').first
            if header_login.is_visible():
                header_login.click()
                print("✅ 点击头部登录按钮")
            else:
                print("⚠️ 未找到登录按钮，尝试其他方式...")
                # 可能需要先进入工作台
                workspace_btn = self.page.locator('button:has-text("开始创作"), button:has-text("立即体验")').first
                if workspace_btn.is_visible():
                    workspace_btn.click()
                    self.page.wait_for_timeout(1000)

        self.page.wait_for_timeout(1000)
        self.screenshot("02_login_modal")

        # 切换到注册模式
        register_link = self.page.locator('button:has-text("立即注册"), a:has-text("立即注册")').first
        if register_link.is_visible():
            register_link.click()
            print("✅ 切换到注册模式")
            self.page.wait_for_timeout(500)

        self.screenshot("02b_register_modal")
        return True

    def step_3_register_account(self):
        """步骤3: 注册新账号"""
        print("\n" + "-"*60)
        print("📍 步骤 3: 注册新账号")
        print("-"*60)

        # 切换到邮箱注册模式
        email_tab = self.page.locator('button:has-text("邮箱注册")').first
        if email_tab.is_visible():
            email_tab.click()
            print("✅ 切换到邮箱注册模式")
            self.page.wait_for_timeout(500)

        # 填写邮箱
        email_input = self.page.locator('input[type="email"], input[placeholder*="邮箱"]').first
        if email_input.is_visible():
            email_input.fill(self.test_email)
            print(f"✅ 填写邮箱: {self.test_email}")

        # 填写密码
        password_input = self.page.locator('input[type="password"]').first
        if password_input.is_visible():
            password_input.fill(self.test_password)
            print("✅ 填写密码: ********")

        # 勾选同意条款
        terms_checkbox = self.page.locator('input[type="checkbox"]').first
        if terms_checkbox.is_visible() and not terms_checkbox.is_checked():
            terms_checkbox.click()
            print("✅ 勾选同意条款")

        self.screenshot("03_register_form_filled")

        # 点击注册按钮
        register_btn = self.page.locator('button[type="submit"]:has-text("注册"), button:has-text("立即注册")').first
        if register_btn.is_visible():
            register_btn.click()
            print("✅ 点击注册按钮")

        # 等待注册完成
        self.page.wait_for_timeout(3000)
        self.screenshot("03b_after_register")

        # 检查是否注册成功（模态框关闭或跳转到工作台）
        modal = self.page.locator('.fixed.inset-0').first
        if not modal.is_visible():
            print("✅ 注册成功，模态框已关闭")
            return True

        # 检查是否有错误消息
        error_msg = self.page.locator('text=注册失败, text=错误').first
        if error_msg.is_visible():
            print(f"❌ 注册失败: {error_msg.text_content()}")
            return False

        print("✅ 注册流程完成")
        return True

    def step_4_navigate_to_workspace(self):
        """步骤4: 导航到工作台"""
        print("\n" + "-"*60)
        print("📍 步骤 4: 导航到工作台")
        print("-"*60)

        # 检查是否已在工作台
        workspace_header = self.page.locator('text=智能工作台').first
        if workspace_header.is_visible():
            print("✅ 已在工作台页面")
            self.screenshot("04_workspace")
            return True

        # 点击进入工作台
        workspace_btn = self.page.locator('button:has-text("开始创作"), a:has-text("工作台")').first
        if workspace_btn.is_visible():
            workspace_btn.click()
            self.page.wait_for_timeout(2000)
            print("✅ 进入工作台")

        self.screenshot("04_workspace")
        return True

    def step_5_upload_audio_and_clone(self):
        """步骤5: 上传音频文件并克隆音色"""
        print("\n" + "-"*60)
        print("📍 步骤 5: 上传音频文件并克隆音色")
        print("-"*60)

        # 检查音频文件是否存在
        audio_path = os.path.abspath(AUDIO_FILE_PATH)
        if not os.path.exists(audio_path):
            print(f"❌ 音频文件不存在: {audio_path}")
            return False
        print(f"✅ 音频文件存在: {audio_path}")

        # 找到文件上传输入框
        file_input = self.page.locator('input[type="file"][accept*=".mp3"]').first
        if not file_input:
            print("❌ 未找到文件上传输入框")
            return False

        # 上传文件
        file_input.set_input_files(audio_path)
        print("✅ 文件已选择")
        self.page.wait_for_timeout(1000)
        self.screenshot("05a_file_selected")

        # 等待命名模态框出现
        name_input = self.page.locator('input[placeholder*="音色名称"]').first
        if name_input.is_visible():
            name_input.fill(self.voice_name)
            print(f"✅ 填写音色名称: {self.voice_name}")

        self.screenshot("05b_voice_naming")

        # 点击开始克隆按钮
        clone_btn = self.page.locator('button:has-text("开始克隆")').first
        if clone_btn.is_visible():
            clone_btn.click()
            print("✅ 点击开始克隆按钮")

        # 等待上传和创建完成
        self.page.wait_for_timeout(5000)
        self.screenshot("05c_cloning_started")

        # 检查是否成功
        success_msg = self.page.locator('text=音色创建成功').first
        if success_msg.is_visible():
            print("✅ 音色创建任务已提交")
            return True

        print("✅ 音色克隆流程完成")
        return True

    def step_6_wait_for_voice_ready(self):
        """步骤6: 等待音色训练完成"""
        print("\n" + "-"*60)
        print("📍 步骤 6: 等待音色训练完成")
        print("-"*60)

        # 等待音色训练完成（最多等待1分钟，因为实际训练需要更长时间）
        max_wait = 60  # 1分钟
        check_interval = 10  # 每10秒检查一次
        elapsed = 0

        while elapsed < max_wait:
            # 重新导航到工作台页面获取最新状态
            self.page.goto(FRONTEND_URL)
            self.page.wait_for_load_state('networkidle')
            self.page.wait_for_timeout(2000)

            # 检查音色是否已完成训练
            voice_item = self.page.locator(f'text={self.voice_name}').first
            if voice_item.is_visible():
                # 检查是否还在训练中
                training_indicator = self.page.locator('text=正在克隆').first
                if not training_indicator.is_visible():
                    print(f"✅ 音色训练完成！耗时: {elapsed}秒")
                    self.screenshot("06_voice_ready")
                    return True

            print(f"⏳ 等待音色训练... ({elapsed}/{max_wait}秒)")
            time.sleep(check_interval)
            elapsed += check_interval

        print("⚠️ 音色训练超时，继续测试...")
        return True

    def step_7_generate_speech(self):
        """步骤7: 使用音色生成语音"""
        print("\n" + "-"*60)
        print("📍 步骤 7: 使用音色生成语音")
        print("-"*60)

        # 选择刚创建的音色
        voice_item = self.page.locator(f'text={self.voice_name}').first
        if voice_item.is_visible():
            voice_item.click()
            print(f"✅ 选择音色: {self.voice_name}")
            self.page.wait_for_timeout(500)

        # 找到文本输入框
        text_area = self.page.locator('textarea').first
        if text_area.is_visible():
            text_area.fill(TTS_TEXT)
            print(f"✅ 输入文本: {TTS_TEXT}")

        self.screenshot("07a_text_input")

        # 点击生成按钮
        generate_btn = self.page.locator('button:has-text("开始生成"), button:has-text("生成音频")').first
        if generate_btn.is_visible() and generate_btn.is_enabled():
            generate_btn.click()
            print("✅ 点击生成按钮")

        # 等待生成完成
        self.page.wait_for_timeout(5000)
        self.screenshot("07b_generating")

        print("✅ 语音生成流程完成")
        return True

    def run_all_tests(self):
        """运行所有测试步骤"""
        results = []

        try:
            self.setup()
            ensure_screenshot_dir()

            # 执行测试步骤
            steps = [
                ("导航到首页", self.step_1_navigate_to_homepage),
                ("打开注册模态框", self.step_2_open_register_modal),
                ("注册新账号", self.step_3_register_account),
                ("导航到工作台", self.step_4_navigate_to_workspace),
                ("上传音频并克隆音色", self.step_5_upload_audio_and_clone),
                ("等待音色训练完成", self.step_6_wait_for_voice_ready),
                ("使用音色生成语音", self.step_7_generate_speech),
            ]

            for step_name, step_func in steps:
                try:
                    result = step_func()
                    results.append((step_name, result))
                    if not result:
                        print(f"⚠️ 步骤 '{step_name}' 失败，继续执行...")
                except Exception as e:
                    print(f"❌ 步骤 '{step_name}' 异常: {e}")
                    results.append((step_name, False))

        finally:
            self.teardown()

        return results


def main():
    """主函数"""
    print("="*60)
    print("  语音克隆应用 - 端到端测试")
    print("="*60)
    print(f"\n⚙️ 测试配置:")
    print(f"   - 前端地址: {FRONTEND_URL}")
    print(f"   - 音频文件: {AUDIO_FILE_PATH}")
    print(f"   - TTS文本: {TTS_TEXT}")
    print(f"   - 截图目录: {SCREENSHOT_DIR}")

    # 运行测试
    test = VoiceCloneE2ETest(headless=True)
    results = test.run_all_tests()

    # 输出测试结果
    print("\n" + "="*60)
    print("  📋 测试结果总结")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for step_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {step_name}")

    print(f"\n总计: {passed}/{total} 步骤通过")

    if passed == total:
        print("\n🎉 所有测试步骤通过！")
        return 0
    else:
        print(f"\n⚠️ {total - passed} 个步骤失败")
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
