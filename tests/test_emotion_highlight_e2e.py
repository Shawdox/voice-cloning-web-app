#!/usr/bin/env python3
"""
E2E test: verify emotion tags are highlighted in text input.

Flow:
1) Navigate to workspace
2) Enter text with emotion tags
3) Check that tags are highlighted with special styling
"""

import os
import sys
from playwright.sync_api import sync_playwright


FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
TEST_TEXT = "你好，我很高兴见到你。(高兴)(开心)"

EXPECTED_STYLES = [
    "background: linear-gradient",
    "f5d0fe",
    "e8a2e5",
    "emotion-tag"
]


def test_emotion_tag_highlighting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console messages
        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))

        try:
            page.goto(FRONTEND_URL, timeout=30000)
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Take screenshot to debug
            page.screenshot(path='/tmp/page_state.png', full_page=True)

            # Navigate to workspace if not already there
            workspace_btn = page.locator('button:has-text("开始创作"), button:has-text("立即体验")').first
            if workspace_btn.is_visible():
                workspace_btn.click()
                page.wait_for_timeout(3000)

            # Wait for React to render
            page.wait_for_timeout(2000)

            # Take another screenshot
            page.screenshot(path='/tmp/workspace_state.png', full_page=True)

            # Check page title
            page_title = page.title()
            print(f"Page title: {page_title}")

            # Check for any error elements
            errors = page.locator('[class*="error"], [class*="Error"]').all()
            print(f"Found {len(errors)} error elements")
            for error in errors[:3]:
                print(f"Error element text: {error.text_content()}")

            # Check all divs with certain classes
            all_divs = page.locator('div').all()
            print(f"Found {len(all_divs)} divs total")

            # Check specifically for form-input class
            form_inputs = page.locator('.form-input').all()
            print(f"Found {len(form_inputs)} elements with class 'form-input'")

            # Get page body content
            body_content = page.locator('body').inner_html()
            print(f"Body content length: {len(body_content)} characters")

            # Check for React root
            react_roots = page.locator('#root, #__next__, [data-reactroot]').all()
            print(f"Found {len(react_roots)} potential React root elements")

            # Check all text-related elements
            textareas = page.locator('textarea')
            contenteditables = page.locator('[contenteditable="true"]')
            divs = page.locator('div.p-5')

            textarea_count = textareas.count()
            contenteditable_count = contenteditables.count()
            div_count = divs.count()

            print(f"Found {textarea_count} textarea(s)")
            print(f"Found {contenteditable_count} contenteditable element(s)")
            print(f"Found {div_count} div.p-5 element(s)")

            # Look for textarea first, if not found, look for contenteditable
            if textarea_count > 0:
                text_area = textareas.first
                if text_area.is_visible():
                    print("Using textarea")
                    text_area.fill(TEST_TEXT)
                    text_editor = text_area
                else:
                    raise AssertionError('Textarea found but not visible')
            elif contenteditable_count > 0:
                print("Using contenteditable")
                text_editor = contenteditables.first
                text_editor.fill(TEST_TEXT)
            else:
                # Print console errors
                errors = [msg for msg in console_messages if msg['type'] == 'error']
                if errors:
                    print(f"\nConsole errors found:")
                    for error in errors[:5]:
                        print(f"  - {error['text']}")
                raise AssertionError('No text editor found on the page')

            # Wait for rendering
            page.wait_for_timeout(1000)

            # Check for emotion tags styling
            emotion_tags = text_editor.locator('.emotion-tag')
            tag_count = emotion_tags.count

            if tag_count == 0:
                raise AssertionError('No emotion tags found in the text editor')

            print(f"✅ Found {tag_count} emotion tags")

            # Check that tags have styling
            first_tag = emotion_tags.first
            tag_text = first_tag.text_content()

            if tag_text != '(高兴)' and tag_text != '(开心)':
                raise AssertionError(f"Unexpected tag text: {tag_text}")

            print(f"✅ First tag text: {tag_text}")

            # Check for styling attributes
            computed_style = first_tag.evaluate('''(element) => {
                return {
                    background: window.getComputedStyle(element).background,
                    color: window.getComputedStyle(element).color,
                    padding: window.getComputedStyle(element).padding,
                    fontWeight: window.getComputedStyle(element).fontWeight
                };
            }''')

            print(f"✅ Tag styles: {computed_style}")

            # Check if background gradient is present
            if not any(style in computed_style['background'] for style in EXPECTED_STYLES[:2]):
                raise AssertionError(f"Background gradient not found in: {computed_style['background']}")

            # Check if text color is present
            if not any(style in computed_style['color'] for style in ['#701a75', 'rgb(112, 26, 117)']):
                raise AssertionError(f"Expected text color not found in: {computed_style['color']}")

            print("✅ Emotion tags are properly highlighted")

        finally:
            browser.close()


def main():
    print("Running emotion tag highlighting E2E test...")
    test_emotion_tag_highlighting()
    print("✅ Emotion tag highlighting E2E test passed")


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f"❌ Test failed: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
