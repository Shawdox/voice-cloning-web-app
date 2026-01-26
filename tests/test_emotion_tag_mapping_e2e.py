#!/usr/bin/env python3
"""
E2E test: verify emotion tag mapping in TTS request payload.

Flow:
1) Login with provided account
2) Select a ready user voice
3) Fill text with mixed tags
4) Intercept /tts request and assert mapped payload
"""

import os
import sys
from playwright.sync_api import sync_playwright, expect


FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
LOGIN_ID = os.getenv('E2E_LOGIN_ID', 'xiaowu.417@qq.com')
LOGIN_PASSWORD = os.getenv('E2E_LOGIN_PASSWORD', '1234qwer')

TEST_TEXT = "(愤怒)(开心) 测试中文情感标签映射 (温柔)"
EXPECTED_TEXT = "(angry)(happy) 测试中文情感标签映射 (温柔)"


def login(page):
    login_btn = page.locator('button:has-text("登录"), button:has-text("注册")').first
    if login_btn.is_visible():
        login_btn.click()
    else:
        header_login = page.locator('header button:has-text("登录")').first
        if header_login.is_visible():
            header_login.click()
        else:
            workspace_btn = page.locator('button:has-text("开始创作"), button:has-text("立即体验")').first
            if workspace_btn.is_visible():
                workspace_btn.click()

    page.wait_for_timeout(800)
    password_tab = page.locator('button:has-text("密码登录")').first
    if password_tab.is_visible():
        password_tab.click()

    login_id_input = page.locator('input[placeholder*="手机号"], input[placeholder*="邮箱"]').first
    login_id_input.fill(LOGIN_ID)

    password_input = page.locator('input[type="password"]').first
    password_input.fill(LOGIN_PASSWORD)

    submit_btn = page.locator('button[type="submit"]:has-text("登录"), button:has-text("立即登录")').first
    submit_btn.click()

    page.wait_for_timeout(1500)

    workspace_btn = page.locator('button:has-text("开始创作"), button:has-text("立即体验"), a:has-text("工作台")').first
    if workspace_btn.is_visible():
        workspace_btn.click()
        page.wait_for_timeout(1500)


def select_ready_user_voice(page):
    voice_tabs = page.locator('button:has-text("我的创作")').first
    if voice_tabs.is_visible():
        voice_tabs.click()
        page.wait_for_timeout(500)

    selected_badge = page.locator('span:has-text("已选择")').first
    if selected_badge.is_visible():
        return True

    list_container = page.locator('div.p-3.space-y-3').first
    empty_state = list_container.locator('text=暂无可用声音')
    if empty_state.is_visible():
        return False

    voice_cards = list_container.locator('div.group').filter(has_not=page.locator('text=正在克隆'))
    if voice_cards.count() > 0:
        voice_cards.first.click()
        page.wait_for_timeout(500)
        return True

    return False


def test_emotion_tag_mapping():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        dialog_messages = []

        def handle_dialog(dialog):
            dialog_messages.append(dialog.message)
            dialog.dismiss()

        page.on('dialog', handle_dialog)

        page.goto(FRONTEND_URL, timeout=30000)
        page.wait_for_load_state('networkidle')

        login(page)

        if not select_ready_user_voice(page):
            raise RuntimeError('No selectable user voice found. Please create a ready voice first.')

        text_area = page.locator('textarea').first
        text_area.fill(TEST_TEXT)

        generate_btn = page.locator('button:has-text("开始生成"), button:has-text("生成音频")').first
        expect(generate_btn).to_be_enabled(timeout=5000)

        with page.expect_request("**/api/v1/tts", timeout=20000) as req_info:
            generate_btn.click()

        request = req_info.value
        try:
            payload = request.post_data_json
        except Exception:
            payload = {}

        if not isinstance(payload, dict):
            payload = {}

        if dialog_messages:
            raise AssertionError(f"Dialog shown during submission: {dialog_messages[-1]}")

        sent_text = payload.get('text')
        if sent_text != EXPECTED_TEXT:
            raise AssertionError(f"Unexpected text payload. Got: {sent_text}")

        browser.close()


def main():
    print("Running emotion tag mapping E2E test...")
    test_emotion_tag_mapping()
    print("✅ Emotion tag mapping E2E test passed")


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f"❌ Test failed: {exc}")
        sys.exit(1)
