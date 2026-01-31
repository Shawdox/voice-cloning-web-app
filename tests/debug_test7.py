import os
import time
from playwright.sync_api import sync_playwright, expect

# Configuration
BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"
AUDIO_1229 = os.path.abspath("data/audio/1229.MP3")

def login(page):
    print(f"Logging in as {USER_EMAIL}...")
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")

    # Check if already logged in (check for points display)
    if page.locator("span.material-symbols-outlined:has-text('payments')").is_visible():
        print("Already logged in.")
        return

    # Click login button
    page.locator("button", has_text="登录 / 注册").first.click()

    # Switch to password login if needed
    if page.locator("text=密码登录").is_visible():
        page.click("text=密码登录")

    page.wait_for_selector("input[placeholder*='手机号 / 电子邮箱']")

    page.fill("input[placeholder*='手机号 / 电子邮箱']", USER_EMAIL)
    page.fill("input[placeholder*='登录密码']", USER_PASSWORD)

    # Click submit login (specifically the one in the modal)
    page.locator("form button", has_text="立即登录").click()

    # Wait for navigation/modal close
    page.wait_for_selector("text=登录 / 注册", state="hidden")
    print("Logged in successfully.")

def debug_test7():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Global dialog handler
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            print("1. 登录系统...")
            login(page)
            print("✅ 登录成功")

            print("2. 导航到声音克隆页面...")
            page.locator("nav button", has_text="语音生成").click()
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            print("✅ 成功导航到声音克隆页面")

            print("3. 上传音频文件进行声音克隆...")
            page.set_input_files("input[type='file']", AUDIO_1229)

            voice_name = f"DebugTest7_{int(time.time())}"
            page.wait_for_selector("input[placeholder*='输入音色名称']")
            page.fill("input[placeholder*='输入音色名称']", voice_name)

            page.click("button:has-text('开始克隆')")
            page.wait_for_selector("text=音色创建成功", timeout=60000)
            print(f"✅ 音色 {voice_name} 创建成功")

            print("4. 刷新页面前截图...")
            page.screenshot(path="tests/tests/before_refresh.png")

            print("5. 刷新页面...")
            page.reload()
            page.wait_for_load_state("networkidle")
            time.sleep(5)

            print("6. 刷新后截图...")
            page.screenshot(path="tests/tests/after_refresh.png")

            print("7. 查找所有音色卡片...")
            # Try different selectors
            all_voices = page.locator("div.group").all()
            print(f"   找到 {len(all_voices)} 个 div.group 元素")

            # Check for voice name in page content
            page_content = page.content()
            if voice_name in page_content:
                print(f"✅ 音色名称 {voice_name} 在页面HTML中找到")
            else:
                print(f"❌ 音色名称 {voice_name} 不在页面HTML中")

            # Try to find the voice with different approaches
            print("8. 尝试不同的选择器...")

            # Approach 1: Direct text match
            text_match = page.locator(f"text={voice_name}").count()
            print(f"   text={voice_name}: {text_match} 个匹配")

            # Approach 2: Contains text
            contains_match = page.locator(f"*:has-text('{voice_name}')").count()
            print(f"   *:has-text('{voice_name}'): {contains_match} 个匹配")

            # Approach 3: Look in specific sections
            my_voices_section = page.locator("h4:has-text('我的声音库')").locator("..")
            if my_voices_section.is_visible():
                voices_in_section = my_voices_section.locator(f"text={voice_name}").count()
                print(f"   我的声音库区域中: {voices_in_section} 个匹配")

            # Save HTML for inspection
            with open("tests/tests/after_refresh.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            print("✅ HTML已保存到 tests/tests/after_refresh.html")

            print("\n等待60秒以便手动检查...")
            time.sleep(60)

        except Exception as e:
            print(f"\n❌ Debug Failed: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="tests/tests/debug_failure.png")
        finally:
            browser.close()

if __name__ == "__main__":
    debug_test7()
