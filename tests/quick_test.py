#!/usr/bin/env python3
"""
简化版测试：直接在浏览器中检查预定义音色
"""
from playwright.sync_api import sync_playwright
import time

def quick_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("="*70)
        print("快速测试：预定义音色显示")
        print("="*70)

        # 登录
        print("\n1. 登录...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        page.locator("button", has_text="登录 / 注册").first.click()
        time.sleep(1)

        if page.locator("text=密码登录").is_visible():
            page.click("text=密码登录")

        page.fill("input[placeholder*='手机号 / 电子邮箱']", "xiaowu.417@qq.com")
        page.fill("input[placeholder*='登录密码']", "1234qwer")
        page.locator("form button", has_text="立即登录").click()
        page.wait_for_selector("text=登录 / 注册", state="hidden", timeout=10000)
        print("✅ 登录成功")

        # 导航到语音生成
        print("\n2. 导航到语音生成...")
        page.locator("nav button", has_text="语音生成").click()
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print("✅ 已到达语音生成页面")

        # 点击系统预设
        print("\n3. 点击'系统预设'...")
        page.locator("button:has-text('系统预设')").first.click()

        # 等待更长时间让API响应
        print("   等待预定义音色加载...")
        for i in range(10):
            time.sleep(1)
            count = page.locator("div.group.p-4.rounded-2xl").filter(
                has=page.locator("text=点击克隆此音色")
            ).count()
            print(f"   第{i+1}秒: 找到 {count} 个预定义音色")

            if count == 8:
                print("\n✅ 成功！找到8个预定义音色")
                break
        else:
            print("\n❌ 10秒后仍未找到预定义音色")
            print("\n请检查浏览器开发者工具:")
            print("1. 按F12打开开发者工具")
            print("2. 切换到Console标签，查看错误")
            print("3. 切换到Network标签，查找'predefined'请求")

        # 截图
        page.screenshot(path="tests/quick_test.png", full_page=True)
        print("\n截图已保存: tests/quick_test.png")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

if __name__ == "__main__":
    quick_test()
