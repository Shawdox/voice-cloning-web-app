import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def debug_network():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Monitor all network requests
        requests = []

        def handle_request(request):
            if 'predefined' in request.url:
                print(f"[REQUEST] {request.method} {request.url}")
                requests.append({'type': 'request', 'method': request.method, 'url': request.url, 'time': time.time()})

        def handle_response(response):
            if 'predefined' in response.url:
                print(f"[RESPONSE] {response.status} {response.url}")
                requests.append({'type': 'response', 'status': response.status, 'url': response.url, 'time': time.time()})

        def handle_request_failed(request):
            if 'predefined' in request.url:
                print(f"[FAILED] {request.url} - {request.failure()}")
                requests.append({'type': 'failed', 'url': request.url, 'time': time.time()})

        page.on("request", handle_request)
        page.on("response", handle_response)
        page.on("requestfailed", handle_request_failed)

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

        print("\n=== Waiting 30 seconds for predefined voices === ")
        time.sleep(30)

        print(f"\n=== Total predefined requests: {len(requests)} ===")
        for req in requests:
            print(req)

        browser.close()

if __name__ == "__main__":
    debug_network()
