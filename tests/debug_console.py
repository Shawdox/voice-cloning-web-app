import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def debug_with_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        def handle_console(msg):
            console_logs.append(f"[{msg.type}] {msg.text}")
            print(f"[CONSOLE {msg.type}] {msg.text}")

        page.on("console", handle_console)

        # Capture network errors
        def handle_response(response):
            if response.status >= 400:
                print(f"[NETWORK ERROR] {response.status} {response.url}")

        page.on("response", handle_response)

        # Login
        print("=== Logging in ===")
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

        print("\n=== Navigating to workspace ===")
        page.locator("nav button", has_text="语音生成").click()
        page.wait_for_load_state("networkidle")

        print("\n=== Waiting 20 seconds for predefined voices ===")
        time.sleep(20)

        # Check predefined voices
        print("\n=== Checking for predefined voices ===")
        predefined_h4 = page.locator("h4")
        print(f"Found {predefined_h4.count()} h4 elements:")
        for i in range(predefined_h4.count()):
            text = predefined_h4.nth(i).text_content()
            print(f"  - '{text}'")

        voice_divs = page.locator("div.group\\/voice")
        print(f"\nFound {voice_divs.count()} div.group/voice elements")

        # Check if API was called
        print("\n=== Checking network calls ===")
        # Use page.evaluate to check fetch calls
        api_called = page.evaluate("""
            () => {
                const logs = window.performance.getEntriesByType('resource');
                return logs.filter(l => l.name.includes('predefined')).map(l => l.name);
            }
        """)
        print(f"Predefined API calls: {api_called}")

        # Dump console logs
        print(f"\n=== Console Logs ({len(console_logs)} total) ===")
        for log in console_logs:
            print(log)

        page.screenshot(path="tests/debug_console.png", full_page=True)
        print("\n=== Screenshot saved to tests/debug_console.png ===")

        browser.close()

if __name__ == "__main__":
    debug_with_console()
