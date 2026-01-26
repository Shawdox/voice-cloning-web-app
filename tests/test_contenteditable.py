#!/usr/bin/env python3
"""Simple test to check if contentEditable element exists."""

import os
from playwright.sync_api import sync_playwright


FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')


def test_contenteditable_exists():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            page.goto(FRONTEND_URL, timeout=30000)
            page.wait_for_load_state('networkidle')

            # Take screenshot
            page.screenshot(path='/tmp/ce_test_1.png', full_page=True)

            # Check all divs
            all_divs = page.locator('div').all()
            print(f"Total divs: {len(all_divs)}")

            # Check for specific patterns
            divs_with_editing = page.locator('[contenteditable="true"]').all()
            print(f"Divs with contentEditable: {len(divs_with_editing)}")

            # Check for emotion tag highlights
            emotion_divs = page.locator('.emotion-tag-highlight').all()
            print(f"Emotion tag highlights: {len(emotion_divs)}")

            # Navigate to workspace
            workspace_btn = page.locator('button:has-text("开始创作"), button:has-text("立即体验")').first
            if workspace_btn.is_visible():
                workspace_btn.click()
                page.wait_for_timeout(3000)

            # Take screenshot after navigation
            page.screenshot(path='/tmp/ce_test_2.png', full_page=True)

            # Check again
            divs_with_editing_2 = page.locator('[contenteditable="true"]').all()
            print(f"After navigation - Divs with contentEditable: {len(divs_with_editing_2)}")

        finally:
            browser.close()


def main():
    print("Checking for contentEditable element...")
    test_contenteditable_exists()


if __name__ == '__main__':
    test_contenteditable_exists()
