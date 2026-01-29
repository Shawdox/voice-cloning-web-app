"""
清理测试数据脚本
删除测试期间创建的所有数据：上传文件、音色、TTS历史
"""
import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def login(page):
    print(f"Logging in as {USER_EMAIL}...")
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    
    # Check if already logged in
    if page.locator("span.material-symbols-outlined:has-text('payments')").is_visible():
        print("Already logged in.")
        return

    page.locator("button", has_text="登录 / 注册").first.click()
    
    if page.locator("text=密码登录").is_visible():
        page.click("text=密码登录")
    
    page.wait_for_selector("input[placeholder*='手机号 / 电子邮箱']")
    page.fill("input[placeholder*='手机号 / 电子邮箱']", USER_EMAIL)
    page.fill("input[placeholder*='登录密码']", USER_PASSWORD)
    page.locator("form button", has_text="立即登录").click()
    page.wait_for_selector("text=登录 / 注册", state="hidden")
    print("Logged in successfully.")

def cleanup(page):
    print("\n" + "="*60)
    print("开始清理测试数据...")
    print("="*60)
    
    login(page)
    
    # 1. Delete all TTS history
    print("\n[1/3] 清理TTS生成历史...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    
    if page.locator("button:has-text('清空记录')").is_visible():
        page.click("button:has-text('清空记录')")
        time.sleep(2)
        print("✓ 历史记录已清空")
    else:
        history_count = page.locator(".history-scroll > div").count()
        print(f"  Found {history_count} history records")
        deleted = 0
        for i in range(history_count):
            if page.locator(".history-scroll > div").count() > 0:
                page.locator(".history-scroll > div").first.locator("button[title='删除']").click()
                time.sleep(1)
                deleted += 1
                if deleted % 5 == 0:
                    print(f"  Deleted {deleted}/{history_count}...")
        print(f"✓ 删除了 {deleted} 条历史记录")
    
    # 2. Delete all uploaded files
    print("\n[2/3] 清理已上传的音频文件...")
    uploaded_file_count = page.locator("div.group\\/file").count()
    print(f"  Found {uploaded_file_count} uploaded files")
    
    deleted = 0
    for i in range(uploaded_file_count):
        if page.locator("div.group\\/file").count() > 0:
            file_item = page.locator("div.group\\/file").first
            file_item.hover()
            file_item.locator("button[title='删除']").click()
            time.sleep(1)
            deleted += 1
            if deleted % 5 == 0:
                print(f"  Deleted {deleted}/{uploaded_file_count}...")
    print(f"✓ 删除了 {deleted} 个上传文件")
    
    # 3. Delete all user voices
    print("\n[3/3] 清理用户音色...")
    page.locator("nav button", has_text="声音库").click()
    page.wait_for_selector("text=我的声音库")
    time.sleep(2)
    
    # Click "我的创作" filter
    page.click("button:has-text('我的创作')")
    time.sleep(1)
    
    user_voice_count = page.locator("div.group.bg-white").count()
    print(f"  Found {user_voice_count} user voices")
    
    deleted = 0
    for i in range(user_voice_count):
        if page.locator("div.group.bg-white").count() > 0:
            voice_card = page.locator("div.group.bg-white").first
            # Find and click delete button
            voice_card.locator("button[title='删除']").click()
            time.sleep(2)
            deleted += 1
            if deleted % 5 == 0:
                print(f"  Deleted {deleted}/{user_voice_count}...")
    print(f"✓ 删除了 {deleted} 个用户音色")
    
    print("\n" + "="*60)
    print("✅ 清理完成!")
    print("="*60)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())
        
        try:
            cleanup(page)
        except Exception as e:
            print(f"\n❌ Cleanup failed: {e}")
            page.screenshot(path="tests/cleanup_failure.png")
            exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
