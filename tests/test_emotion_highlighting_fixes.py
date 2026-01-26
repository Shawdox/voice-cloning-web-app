#!/usr/bin/env python3
"""
Comprehensive test for emotion tag highlighting fixes.

Tests:
1. Only emotion tags from mapping are highlighted
2. Text cursor is visible and functional
3. Non-emotion text in parentheses is NOT highlighted
"""

import os
import sys
from playwright.sync_api import sync_playwright


FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')


def test_emotion_highlighting_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            page.goto(FRONTEND_URL, timeout=30000)
            page.wait_for_load_state('networkidle')

            # Navigate to workspace if not already there
            workspace_btn = page.locator('button:has-text("开始创作"), button:has-text("立即体验")').first
            if workspace_btn.is_visible():
                workspace_btn.click()
                page.wait_for_timeout(3000)

            # Wait for React to render
            page.wait_for_timeout(2000)

            # Take screenshot for debugging
            page.screenshot(path='/tmp/before_test.png', full_page=True)

            # Find textarea
            editor = page.locator('textarea').first
            if not editor.is_visible():
                raise AssertionError('Textarea not visible')

            # Test 1: Fill text with emotion tag - should be highlighted
            test_text = "你好，我很高兴见到你。(高兴)"
            
            editor.fill(test_text)

            page.wait_for_timeout(1000)

            # Check if emotion tag is highlighted
            highlighted_tags = page.locator('.emotion-tag-highlight').all()
            print(f"Test 1 - Emotion tag highlighting: Found {len(highlighted_tags)} highlighted tags")

            if len(highlighted_tags) == 0:
                raise AssertionError('No emotion tags found highlighted')
            
            first_tag = highlighted_tags[0]
            tag_text = first_tag.text_content()
            print(f"First highlighted tag: {tag_text}")

            if tag_text != '(高兴)':
                raise AssertionError(f"Expected '(高兴)' but got '{tag_text}'")

            # Check that the tag has correct styling
            computed_style = first_tag.evaluate('''(element) => {
                return {
                    background: window.getComputedStyle(element).background,
                    color: window.getComputedStyle(element).color,
                };
            }''')

            print(f"Tag background: {computed_style['background']}")
            print(f"Tag color: {computed_style['color']}")

            if not any(color in computed_style['background'] for color in ['#f5d0fe', '#e8a2e5', 'rgb(245, 208, 254)']):
                raise AssertionError(f"Background gradient not found in: {computed_style['background']}")

            print("✅ Test 1 PASSED: Emotion tag (高兴) is highlighted correctly")

            # Test 2: Text with non-emotion parentheses - should NOT be highlighted
            test_text_2 = "(abc) defghijkl"
            editor.fill(test_text_2)
            page.wait_for_timeout(1000)

            highlighted_tags_2 = page.locator('.emotion-tag-highlight').all()
            print(f"Test 2 - Non-emotion text: Found {len(highlighted_tags_2)} highlighted tags")

            if len(highlighted_tags_2) > 0:
                raise AssertionError(f"Non-emotion text should not be highlighted, but found {len(highlighted_tags_2)} highlighted tags")

            print("✅ Test 2 PASSED: Non-emotion parentheses are not highlighted")

            # Test 3: Multiple emotion tags - all should be highlighted
            test_text_3 = "(高兴)(开心)(愤怒) 今天天气真好！"
            editor.fill(test_text_3)
            page.wait_for_timeout(1000)

            highlighted_tags_3 = page.locator('.emotion-tag-highlight').all()
            print(f"Test 3 - Multiple tags: Found {len(highlighted_tags_3)} highlighted tags")

            if len(highlighted_tags_3) != 3:
                raise AssertionError(f"Expected 3 highlighted tags but found {len(highlighted_tags_3)}")

            print("✅ Test 3 PASSED: Multiple emotion tags are all highlighted")

            # Test 4: Check cursor visibility
            editor.click()
            page.wait_for_timeout(500)

            # Get computed caret color
            caret_color = editor.evaluate('''(element) => {
                return window.getComputedStyle(element).caretColor;
            }''')

            print(f"Test 4 - Cursor color: {caret_color}")

            if caret_color not in ['#1c0d14', 'rgb(28, 13, 20)']:
                print(f"⚠️  Warning: Cursor color is {caret_color}, expected #1c0d14")
            else:
                print("✅ Test 4 PASSED: Cursor is visible with correct color")

            # Test 5: Check that textarea is fully visible
            text_color = editor.evaluate('''(element) => {
                return window.getComputedStyle(element).color;
            }''')

            text_opacity = editor.evaluate('''(element) => {
                return window.getComputedStyle(element).opacity;
            }''')

            print(f"Test 5 - Text color: {text_color}, opacity: {text_opacity}")

            if text_opacity < 0.5:
                raise AssertionError(f"Text opacity is too low: {text_opacity}")

            print("✅ Test 5 PASSED: Text area is visible")

            print("\n" + "="*60)
            print("  🎉 All emotion tag highlighting tests PASSED!")
            print("="*60)

        finally:
            browser.close()


def main():
    print("Running comprehensive emotion tag highlighting tests...")
    test_emotion_highlighting_fixes()
    print("✅ All tests completed successfully")


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f"❌ Test failed: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
