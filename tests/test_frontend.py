"""Frontend UI tests using Playwright for voice cloning web application."""

from playwright.sync_api import sync_playwright
import time
import os

# Frontend URL - check environment variable or use default
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3002')


def test_homepage_loads():
    """Test that the homepage loads successfully."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🌐 Navigating to homepage...")
        page.goto(FRONTEND_URL)
        page.wait_for_load_state('networkidle')

        # Take screenshot for verification
        page.screenshot(path='/tmp/homepage.png', full_page=True)
        print("✅ Homepage loaded successfully")
        print(f"📸 Screenshot saved to /tmp/homepage.png")

        # Check page title
        title = page.title()
        print(f"📄 Page title: {title}")

        browser.close()


def test_user_registration_flow():
    """Test user registration flow."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\n🔐 Testing user registration flow...")
        page.goto(FRONTEND_URL)
        page.wait_for_load_state('networkidle')

        # Look for login/register button
        page.screenshot(path='/tmp/before_register.png', full_page=True)

        # Try to find and click register/login button
        try:
            # Common patterns for auth buttons
            register_button = page.locator('button:has-text("注册"), button:has-text("登录"), button:has-text("Register"), button:has-text("Login")').first
            if register_button.is_visible():
                print("✅ Found auth button")
                register_button.click()
                page.wait_for_timeout(1000)
                page.screenshot(path='/tmp/register_modal.png', full_page=True)
                print("📸 Registration modal screenshot saved")
            else:
                print("⚠️ No auth button found")
        except Exception as e:
            print(f"⚠️ Could not find auth button: {e}")

        browser.close()


def test_voice_cloning_interface():
    """Test voice cloning interface elements."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\n🎤 Testing voice cloning interface...")
        page.goto(FRONTEND_URL)
        page.wait_for_load_state('networkidle')

        # Look for voice cloning related elements
        page.screenshot(path='/tmp/voice_interface.png', full_page=True)

        # Check for file upload elements
        file_inputs = page.locator('input[type="file"]').all()
        print(f"📁 Found {len(file_inputs)} file upload inputs")

        # Check for buttons
        buttons = page.locator('button').all()
        print(f"🔘 Found {len(buttons)} buttons on page")

        browser.close()


def test_console_errors():
    """Check for console errors on page load."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))

        print("\n🔍 Checking for console errors...")
        page.goto(FRONTEND_URL)
        page.wait_for_load_state('networkidle')

        # Filter errors and warnings
        errors = [msg for msg in console_messages if msg['type'] in ['error', 'warning']]

        if errors:
            print(f"⚠️ Found {len(errors)} console errors/warnings:")
            for error in errors[:5]:  # Show first 5
                print(f"  - [{error['type']}] {error['text']}")
        else:
            print("✅ No console errors found")

        browser.close()


if __name__ == '__main__':
    print("=" * 60)
    print("  Voice Cloning Frontend Tests")
    print("=" * 60)

    try:
        test_homepage_loads()
        test_user_registration_flow()
        test_voice_cloning_interface()
        test_console_errors()

        print("\n" + "=" * 60)
        print("✅ All frontend tests completed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
