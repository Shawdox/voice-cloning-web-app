import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def debug_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser
        page = browser.new_page()

        # Login
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        if not page.locator("span.material-symbols-outlined:has-text('payments')").is_visible():
            page.locator("button", has_text="登录 / 注册").first.click()
            if page.locator("text=密码登录").is_visible():
                page.click("text=密码登录")
            page.wait_for_selector("input[placeholder*='手机号 / 电子邮箱']")
            page.fill("input[placeholder*='手机号 / 电子邮箱']", USER_EMAIL)
            page.fill("input[placeholder*='登录密码']", USER_PASSWORD)
            page.locator("form button", has_text="立即登录").click()
            page.wait_for_selector("text=登录 / 注册", state="hidden")

        # Navigate to workspace
        page.locator("nav button", has_text="语音生成").click()
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Take screenshot
        page.screenshot(path="tests/debug_workspace.png", full_page=True)

        # Print HTML of the section
        print("Looking for predefined voices section...")

        # Check if section exists
        predefined_h4 = page.locator("h4")
        print(f"\nFound {predefined_h4.count()} h4 elements:")
        for i in range(predefined_h4.count()):
            text = predefined_h4.nth(i).text_content()
            print(f"  - {text}")

        # Check for the group/voice div
        voice_divs = page.locator("div.group\\/voice")
        print(f"\nFound {voice_divs.count()} voice cards (div.group/voice)")

        # Wait for user to check
        print("\nBrowser will stay open for 30 seconds. Check localhost:3000...")
        time.sleep(30)

        browser.close()

if __name__ == "__main__":
    debug_page()
