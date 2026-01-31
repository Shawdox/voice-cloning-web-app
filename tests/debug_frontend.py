#!/usr/bin/env python3
"""
前端调试脚本：使用浏览器检查预定义音色是否加载
"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def test_frontend_predefined_voices():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 监听控制台日志
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # 监听网络请求
        network_requests = []
        page.on("request", lambda request: network_requests.append({
            "url": request.url,
            "method": request.method
        }))

        # 监听网络响应
        network_responses = []
        page.on("response", lambda response: network_responses.append({
            "url": response.url,
            "status": response.status
        }))

        print("="*70)
        print("前端预定义音色调试")
        print("="*70)

        # 1. 打开首页
        print("\n1. 打开首页...")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # 2. 登录
        print("\n2. 登录系统...")
        page.locator("button", has_text="登录 / 注册").first.click()
        time.sleep(1)

        if page.locator("text=密码登录").is_visible():
            page.click("text=密码登录")

        page.fill("input[placeholder*='手机号 / 电子邮箱']", USER_EMAIL)
        page.fill("input[placeholder*='登录密码']", USER_PASSWORD)
        page.locator("form button", has_text="立即登录").click()
        page.wait_for_selector("text=登录 / 注册", state="hidden", timeout=10000)
        print("✅ 登录成功")

        # 3. 导航到语音生成页面
        print("\n3. 导航到'语音生成'页面...")
        page.locator("nav button", has_text="语音生成").click()
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # 4. 检查是否调用了预定义音色API
        print("\n4. 检查网络请求...")
        predefined_api_called = False
        for req in network_requests:
            if "/api/v1/voices/predefined" in req["url"]:
                predefined_api_called = True
                print(f"   ✅ 找到预定义音色API请求: {req['method']} {req['url']}")

        if not predefined_api_called:
            print("   ❌ 未找到预定义音色API请求！")
            print("   可能原因:")
            print("   - 前端代码未调用API")
            print("   - isLoggedIn状态未正确设置")
            print("   - useEffect依赖项问题")

        # 5. 检查API响应
        print("\n5. 检查API响应...")
        for resp in network_responses:
            if "/api/v1/voices/predefined" in resp["url"]:
                print(f"   状态码: {resp['status']}")
                if resp['status'] == 200:
                    print("   ✅ API响应成功")
                else:
                    print(f"   ❌ API响应失败: {resp['status']}")

        # 6. 点击"系统预设"标签
        print("\n6. 点击'系统预设'标签...")
        system_preset_button = page.locator("button:has-text('系统预设')").first
        if system_preset_button.is_visible():
            system_preset_button.click()
            time.sleep(3)
            print("   ✅ 系统预设标签已点击")

            # 检查是否有预定义音色卡片
            predefined_cards = page.locator("div.group.p-4.rounded-2xl").filter(
                has=page.locator("text=点击克隆此音色")
            )
            count = predefined_cards.count()
            print(f"   预定义音色数量: {count}")

            if count == 0:
                print("   ❌ 未找到预定义音色卡片")
                # 检查是否显示空状态
                if page.locator("text=暂无预定义音色").is_visible():
                    print("   页面显示: '暂无预定义音色'")
            else:
                print(f"   ✅ 找到 {count} 个预定义音色")
                for i in range(min(count, 3)):
                    name = predefined_cards.nth(i).locator("h4").text_content()
                    print(f"      - {name}")
        else:
            print("   ❌ 未找到'系统预设'按钮")

        # 7. 打印控制台日志
        print("\n7. 浏览器控制台日志:")
        relevant_logs = [log for log in console_logs if "predefined" in log.lower() or "voice" in log.lower() or "error" in log.lower()]
        if relevant_logs:
            for log in relevant_logs[-10:]:  # 最后10条相关日志
                print(f"   {log}")
        else:
            print("   (无相关日志)")

        # 8. 截图
        print("\n8. 保存截图...")
        page.screenshot(path="tests/debug_frontend_predefined.png", full_page=True)
        print("   ✅ 截图已保存到 tests/debug_frontend_predefined.png")

        print("\n" + "="*70)
        print("调试完成")
        print("="*70)

        # 保持浏览器打开以便手动检查
        print("\n按Enter键关闭浏览器...")
        input()

        browser.close()

if __name__ == "__main__":
    test_frontend_predefined_voices()
