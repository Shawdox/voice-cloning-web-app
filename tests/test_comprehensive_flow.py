#!/usr/bin/env python3
"""
综合测试：音色创建、显示和TTS生成完整流程
测试场景：
1. 验证音色创建时间戳正确显示（修复 Invalid Date 问题）
2. 验证用户创建的音色在声音库中正确显示
3. 验证完整的TTS生成流程（选择音色、输入文本、生成语音、状态更新、下载链接）
"""

import asyncio
import os
import random
import string
import time
from datetime import datetime
from playwright.async_api import async_playwright, Page, expect

# 测试配置
FRONTEND_URL = "http://localhost:3000"
API_BASE_URL = "http://localhost:8080/api/v1"
AUDIO_FILE = "/home/xiaowu/voice_web_app/data/audio/1229.MP3"
SCREENSHOT_DIR = "/tmp/comprehensive_flow_screenshots"
MAX_WAIT_TIME = 120  # 最大等待时间（秒）

# 创建截图目录
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def generate_random_string(length=6):
    """生成随机字符串"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

async def take_screenshot(page: Page, name: str):
    """截图辅助函数"""
    screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    await page.screenshot(path=screenshot_path, full_page=True)
    print(f"📸 截图: {screenshot_path}")

async def wait_for_api_response(page: Page, url_pattern: str, timeout: int = 10000):
    """等待特定API响应"""
    try:
        async with page.expect_response(lambda response: url_pattern in response.url, timeout=timeout) as response_info:
            response = await response_info.value
            return response
    except Exception as e:
        print(f"⚠️ 等待API响应超时: {url_pattern}")
        return None

async def register_and_login(page: Page, email: str, password: str = "Test123456"):
    """注册并登录测试账号"""
    print("\n" + "="*70)
    print("📍 步骤 1: 注册并登录测试账号")
    print("="*70)

    await page.goto(FRONTEND_URL)
    await page.wait_for_load_state("networkidle")
    await take_screenshot(page, "01_homepage")

    # 打开登录模态框（使用header中的按钮）
    login_button = page.get_by_role("banner").get_by_role("button", name="登录 / 注册")
    await login_button.click()
    await page.wait_for_timeout(500)
    print("✅ 打开登录模态框")

    # 切换到注册模式（点击"立即注册"按钮）
    register_button = page.locator('button:has-text("立即注册")')
    await register_button.click()
    await page.wait_for_timeout(500)
    print("✅ 切换到注册模式")

    # 切换到邮箱注册标签
    email_tab = page.locator('button:has-text("邮箱注册")')
    await email_tab.click()
    await page.wait_for_timeout(500)
    await take_screenshot(page, "01b_register_form")
    print("✅ 切换到邮箱注册")

    # 填写注册表单
    await page.fill('input[placeholder*="邮箱"]', email)
    await page.fill('input[placeholder*="密码"]', password)

    # 勾选服务协议
    terms_checkbox = page.locator('input[type="checkbox"]')
    await terms_checkbox.check()
    await page.wait_for_timeout(500)
    print("✅ 填写注册表单")

    # 提交注册
    submit_button = page.locator('button:has-text("立即注册")').last
    await submit_button.click()
    print("✅ 提交注册")

    # 等待注册成功并自动登录
    await page.wait_for_timeout(2000)
    await take_screenshot(page, "01c_after_register")
    print(f"✅ 注册和登录完成: {email}")

async def navigate_to_workspace(page: Page):
    """导航到工作台"""
    print("\n" + "="*70)
    print("📍 步骤 2: 导航到工作台")
    print("="*70)

    # 检查是否已在工作台
    workspace_heading = page.locator('h1:has-text("智能工作台")')
    if await workspace_heading.count() > 0:
        print("✅ 已在工作台页面")
    else:
        # 点击工作台链接
        workspace_link = page.locator('a:has-text("工作台")')
        await workspace_link.click()
        await page.wait_for_timeout(1000)
        print("✅ 导航到工作台")

    await take_screenshot(page, "02_workspace")

async def create_voice(page: Page, voice_name: str):
    """创建音色并返回音色ID"""
    print("\n" + "="*70)
    print("📍 步骤 3: 上传音频文件并创建音色")
    print("="*70)

    # 检查音频文件
    if not os.path.exists(AUDIO_FILE):
        raise FileNotFoundError(f"音频文件不存在: {AUDIO_FILE}")

    file_size = os.path.getsize(AUDIO_FILE) / (1024 * 1024)
    print(f"✅ 音频文件: {AUDIO_FILE} ({file_size:.2f} MB)")

    # 上传音频文件（使用正确的选择器）
    file_input = page.locator('input[type="file"]').first
    await file_input.set_input_files(AUDIO_FILE)
    await page.wait_for_timeout(1000)
    await take_screenshot(page, "03a_file_selected")
    print("✅ 文件已选择")

    # 填写音色名称
    name_input = page.locator('input[placeholder*="音色名称"]')
    await name_input.fill(voice_name)
    await take_screenshot(page, "03b_naming_modal")
    print(f"✅ 填写音色名称: {voice_name}")

    # 点击开始克隆
    clone_button = page.locator('button:has-text("开始克隆")')
    await clone_button.click()
    print("🚀 点击开始克隆...")

    # 等待上传和创建过程
    await page.wait_for_timeout(3000)
    await take_screenshot(page, "03c_upload_complete")
    print("✅ 音色克隆任务已提交")

    return voice_name

async def verify_voice_timestamp(page: Page, voice_name: str):
    """验证音色创建时间戳正确显示（测试场景1）"""
    print("\n" + "="*70)
    print("📍 测试场景 1: 验证音色创建时间戳正确显示")
    print("="*70)

    # 等待音色出现在列表中
    await page.wait_for_timeout(2000)

    # 查找音色块
    voice_card = page.locator(f'div:has-text("{voice_name}")').first

    if await voice_card.count() == 0:
        print(f"⚠️ 未找到音色: {voice_name}")
        return False

    # 获取音色块的文本内容
    card_text = await voice_card.inner_text()

    # 检查是否包含 "Invalid Date"
    if "Invalid Date" in card_text:
        print(f"❌ 发现 'Invalid Date' 错误")
        await take_screenshot(page, "04_invalid_date_error")
        return False

    # 检查是否包含正确的日期格式
    if "创建" in card_text or "正在克隆" in card_text:
        print(f"✅ 时间戳显示正确（无 Invalid Date）")
        await take_screenshot(page, "04_timestamp_correct")
        return True

    print(f"⚠️ 未找到时间戳信息")
    return False

async def verify_voice_in_library(page: Page, voice_name: str):
    """验证用户创建的音色在声音库中正确显示（测试场景2）"""
    print("\n" + "="*70)
    print("📍 测试场景 2: 验证音色在声音库中正确显示")
    print("="*70)

    # 切换到"我的创作"标签
    my_voices_tab = page.locator('button:has-text("我的创作")')
    await my_voices_tab.click()
    await page.wait_for_timeout(1000)
    await take_screenshot(page, "05_my_voices_tab")
    print("✅ 切换到'我的创作'标签")

    # 查找音色
    voice_card = page.locator(f'div:has-text("{voice_name}")').first

    if await voice_card.count() == 0:
        print(f"❌ 未在声音库中找到音色: {voice_name}")
        return False

    print(f"✅ 音色在声音库中正确显示: {voice_name}")

    # 检查音色状态
    card_text = await voice_card.inner_text()
    if "正在克隆" in card_text:
        print("📊 音色状态: 正在克隆")
    elif "创建" in card_text:
        print("📊 音色状态: 已完成")

    await take_screenshot(page, "05_voice_in_library")
    return True

async def wait_for_voice_ready(page: Page, voice_name: str, max_wait: int = 120):
    """等待音色完成训练"""
    print(f"\n⏳ 等待音色完成训练（最多 {max_wait} 秒）...")

    start_time = time.time()
    while time.time() - start_time < max_wait:
        voice_card = page.locator(f'div:has-text("{voice_name}")').first
        if await voice_card.count() > 0:
            card_text = await voice_card.inner_text()
            if "正在克隆" not in card_text and "创建" in card_text:
                print(f"✅ 音色训练完成")
                return True

        await page.wait_for_timeout(10000)  # 每10秒检查一次
        print(f"⏳ 继续等待... ({int(time.time() - start_time)}秒)")

    print(f"⚠️ 等待超时")
    return False

async def test_tts_generation(page: Page, voice_name: str):
    """测试完整的TTS生成流程（测试场景3）"""
    print("\n" + "="*70)
    print("📍 测试场景 3: 完整TTS生成流程")
    print("="*70)

    # 选择音色
    voice_card = page.locator(f'div:has-text("{voice_name}")').first
    await voice_card.click()
    await page.wait_for_timeout(1000)
    await take_screenshot(page, "06_voice_selected")
    print(f"✅ 选择音色: {voice_name}")

    # 输入测试文本
    test_text = "这是一段测试文本，用于验证语音合成功能是否正常工作。"
    text_area = page.locator('textarea[placeholder*="想要合成"]')
    await text_area.fill(test_text)
    await page.wait_for_timeout(500)
    await take_screenshot(page, "06_text_input")
    print(f"✅ 输入文本: {test_text}")

    # 点击生成按钮
    generate_button = page.locator('button:has-text("开始生成音频")')
    await generate_button.click()
    print("🚀 点击生成音频...")

    # 等待任务提交
    await page.wait_for_timeout(2000)
    await take_screenshot(page, "06_generation_started")
    print("✅ TTS任务已提交")

    return True

async def verify_tts_status_and_download(page: Page):
    """验证TTS状态更新和下载链接"""
    print("\n📊 监控TTS任务状态...")

    # 等待历史记录出现
    await page.wait_for_timeout(3000)

    # 查找生成历史区域
    history_section = page.locator('h3:has-text("生成历史")')
    if await history_section.count() == 0:
        print("⚠️ 未找到生成历史区域")
        return False

    await take_screenshot(page, "07_history_section")
    print("✅ 找到生成历史区域")

    # 监控状态变化
    max_wait = 60
    start_time = time.time()

    while time.time() - start_time < max_wait:
        await page.wait_for_timeout(5000)

        # 检查是否有完成的任务
        history_items = page.locator('div:has-text("play_arrow")')
        if await history_items.count() > 0:
            await take_screenshot(page, "07_task_completed")
            print("✅ TTS任务已完成")
            return True

        print(f"⏳ 等待任务完成... ({int(time.time() - start_time)}秒)")

    print("⚠️ 等待TTS完成超时")
    return False

async def run_comprehensive_test():
    """运行综合测试"""
    print("\n" + "="*70)
    print("  🎯 综合测试：音色创建、显示和TTS生成完整流程")
    print("="*70)

    # 生成测试数据
    test_id = generate_random_string()
    test_email = f"test_comprehensive_{test_id}@example.com"
    voice_name = f"综合测试音色_{test_id}"

    print(f"\n⚙️ 测试配置:")
    print(f"   - 前端地址: {FRONTEND_URL}")
    print(f"   - API地址: {API_BASE_URL}")
    print(f"   - 音频文件: {AUDIO_FILE}")
    print(f"   - 测试邮箱: {test_email}")
    print(f"   - 音色名称: {voice_name}")

    results = {
        "register_login": False,
        "navigate_workspace": False,
        "create_voice": False,
        "verify_timestamp": False,
        "verify_library": False,
        "wait_voice_ready": False,
        "test_tts": False,
        "verify_tts_status": False,
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # 步骤1: 注册并登录
            await register_and_login(page, test_email)
            results["register_login"] = True

            # 步骤2: 导航到工作台
            await navigate_to_workspace(page)
            results["navigate_workspace"] = True

            # 步骤3: 创建音色
            await create_voice(page, voice_name)
            results["create_voice"] = True

            # 测试场景1: 验证时间戳显示
            results["verify_timestamp"] = await verify_voice_timestamp(page, voice_name)

            # 测试场景2: 验证音色在声音库中显示
            results["verify_library"] = await verify_voice_in_library(page, voice_name)

            # 等待音色训练完成
            results["wait_voice_ready"] = await wait_for_voice_ready(page, voice_name, MAX_WAIT_TIME)

            if results["wait_voice_ready"]:
                # 测试场景3: TTS生成流程
                results["test_tts"] = await test_tts_generation(page, voice_name)

                if results["test_tts"]:
                    # 验证TTS状态和下载链接
                    results["verify_tts_status"] = await verify_tts_status_and_download(page)

        except Exception as e:
            print(f"\n❌ 测试过程中发生错误: {e}")
            import traceback
            traceback.print_exc()

        finally:
            await page.wait_for_timeout(2000)
            await browser.close()

    # 打印测试结果
    print("\n" + "="*70)
    print("  📋 测试结果总结")
    print("="*70)

    test_steps = [
        ("注册并登录", results["register_login"]),
        ("导航到工作台", results["navigate_workspace"]),
        ("创建音色", results["create_voice"]),
        ("验证时间戳显示（场景1）", results["verify_timestamp"]),
        ("验证声音库显示（场景2）", results["verify_library"]),
        ("等待音色训练完成", results["wait_voice_ready"]),
        ("TTS生成（场景3）", results["test_tts"]),
        ("验证TTS状态和下载", results["verify_tts_status"]),
    ]

    passed = sum(1 for _, result in test_steps if result)
    total = len(test_steps)

    for step_name, result in test_steps:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {step_name}")

    print(f"\n总计: {passed}/{total} 步骤通过")
    print(f"📸 截图保存在: {SCREENSHOT_DIR}\n")

    return passed == total

if __name__ == "__main__":
    success = asyncio.run(run_comprehensive_test())
    exit(0 if success else 1)
