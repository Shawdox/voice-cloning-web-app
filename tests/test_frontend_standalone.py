#!/usr/bin/env python3
"""
Frontend UI Tests for Voice Cloning Application

Prerequisites:
1. Backend server running on http://localhost:8080
2. Frontend server running on http://localhost:3000 (or set FRONTEND_URL env var)

Usage:
    python test_frontend_standalone.py
"""

from playwright.sync_api import sync_playwright
import os
import sys

# Configuration
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8080')


def check_servers():
    """Check if servers are running."""
    import requests

    print("🔍 Checking servers...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=2)
        if response.status_code == 200:
            print(f"✅ Backend is running on {BACKEND_URL}")
        else:
            print(f"⚠️ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend is not running on {BACKEND_URL}")
        print(f"   Error: {e}")
        return False

    try:
        response = requests.get(FRONTEND_URL, timeout=2)
        if response.status_code == 200:
            print(f"✅ Frontend is running on {FRONTEND_URL}")
        else:
            print(f"⚠️ Frontend returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend is not running on {FRONTEND_URL}")
        print(f"   Error: {e}")
        return False

    return True


def test_homepage():
    """Test homepage loads and capture screenshot."""
    print("\n" + "="*60)
    print("TEST 1: Homepage Load")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print(f"🌐 Navigating to {FRONTEND_URL}...")
            page.goto(FRONTEND_URL, timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)

            # Capture screenshot
            screenshot_path = '/tmp/frontend_homepage.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"✅ Homepage loaded successfully")
            print(f"📸 Screenshot saved: {screenshot_path}")

            # Get page title
            title = page.title()
            print(f"📄 Page title: {title}")

            # Count elements
            buttons = page.locator('button').count()
            inputs = page.locator('input').count()
            print(f"🔘 Found {buttons} buttons")
            print(f"📝 Found {inputs} input fields")

            return True
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
        finally:
            browser.close()


def test_navigation():
    """Test navigation and UI elements."""
    print("\n" + "="*60)
    print("TEST 2: Navigation & UI Elements")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(FRONTEND_URL, timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)

            # Check for common UI elements
            print("🔍 Checking for UI elements...")

            # Look for navigation/menu items
            nav_items = page.locator('nav, [role="navigation"]').count()
            print(f"📍 Found {nav_items} navigation elements")

            # Look for file upload
            file_inputs = page.locator('input[type="file"]').count()
            print(f"📁 Found {file_inputs} file upload inputs")

            # Look for text areas
            textareas = page.locator('textarea').count()
            print(f"📝 Found {textareas} text areas")

            # Capture full page screenshot
            screenshot_path = '/tmp/frontend_ui_elements.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved: {screenshot_path}")

            return True
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
        finally:
            browser.close()


def test_console_logs():
    """Check for console errors."""
    print("\n" + "="*60)
    print("TEST 3: Console Errors Check")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))

        try:
            page.goto(FRONTEND_URL, timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)

            # Filter errors and warnings
            errors = [msg for msg in console_messages if msg['type'] == 'error']
            warnings = [msg for msg in console_messages if msg['type'] == 'warning']

            print(f"📊 Console messages: {len(console_messages)} total")
            print(f"   - Errors: {len(errors)}")
            print(f"   - Warnings: {len(warnings)}")

            if errors:
                print("\n⚠️ Console Errors:")
                for error in errors[:5]:
                    print(f"   - {error['text']}")
            else:
                print("✅ No console errors found")

            if warnings:
                print("\n⚠️ Console Warnings:")
                for warning in warnings[:3]:
                    print(f"   - {warning['text']}")

            return len(errors) == 0
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
        finally:
            browser.close()


def main():
    """Run all frontend tests."""
    print("="*60)
    print("  Voice Cloning Frontend UI Tests")
    print("="*60)
    print(f"\nFrontend URL: {FRONTEND_URL}")
    print(f"Backend URL: {BACKEND_URL}\n")

    # Check if servers are running
    if not check_servers():
        print("\n❌ Servers are not running. Please start them first:")
        print(f"   Backend: cd backend && go run main.go")
        print(f"   Frontend: cd voiceclone-pro-console && npm run dev")
        sys.exit(1)

    # Run tests
    results = []
    results.append(("Homepage Load", test_homepage()))
    results.append(("Navigation & UI", test_navigation()))
    results.append(("Console Errors", test_console_logs()))

    # Summary
    print("\n" + "="*60)
    print("  Test Summary")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed ({passed*100//total}%)")

    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
