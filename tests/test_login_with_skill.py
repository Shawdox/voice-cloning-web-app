#!/usr/bin/env python3
"""
使用 webapp-testing skill 测试登录功能
这个脚本演示了如何自动化测试 Web 应用
"""
from playwright.sync_api import sync_playwright
import sys

def test_login_page_elements():
    """测试 1: 验证登录页面元素"""
    print("\n" + "="*60)
    print("🧪 测试 1: 登录页面元素检查")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 导航到前端
            print("📍 导航到 http://localhost:3000")
            page.goto('http://localhost:3000', timeout=10000)
            page.wait_for_load_state('networkidle')

            # 截图保存初始状态
            page.screenshot(path='/tmp/login_page_initial.png', full_page=True)
            print("📸 截图已保存: /tmp/login_page_initial.png")

            # 检查页面标题
            title = page.title()
            print(f"📄 页面标题: {title}")

            # 查找登录相关元素
            email_inputs = page.locator('input[type="email"], input[type="text"]').count()
            password_inputs = page.locator('input[type="password"]').count()
            buttons = page.locator('button').count()

            print(f"\n🔍 页面元素统计:")
            print(f"   - 输入框（邮箱/文本）: {email_inputs}")
            print(f"   - 密码输入框: {password_inputs}")
            print(f"   - 按钮总数: {buttons}")

            # 验证关键元素存在
            if email_inputs > 0 and password_inputs > 0:
                print("✅ 登录页面元素完整")
                return True
            else:
                print("❌ 登录页面缺少必要元素")
                return False

        except Exception as e:
            print(f"❌ 测试失败: {e}")
            return False
        finally:
            browser.close()


def test_login_interaction():
    """测试 2: 测试登录表单交互"""
    print("\n" + "="*60)
    print("🧪 测试 2: 登录表单交互")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 监听控制台消息
        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text
        }))

        try:
            page.goto('http://localhost:3000', timeout=10000)
            page.wait_for_load_state('networkidle')

            # 尝试填写表单
            print("📝 尝试填写登录表单...")

            # 查找并填写邮箱输入框
            email_input = page.locator('input[type="email"], input[type="text"]').first
            if email_input.count() > 0:
                email_input.fill('test@example.com')
                print("✅ 邮箱输入框填写成功: test@example.com")

            # 查找并填写密码输入框
            password_input = page.locator('input[type="password"]').first
            if password_input.count() > 0:
                password_input.fill('testpassword123')
                print("✅ 密码输入框填写成功: ********")

            # 截图填写后的状态
            page.screenshot(path='/tmp/login_form_filled.png', full_page=True)
            print("📸 截图已保存: /tmp/login_form_filled.png")

            # 检查控制台错误
            errors = [msg for msg in console_messages if msg['type'] == 'error']
            warnings = [msg for msg in console_messages if msg['type'] == 'warning']

            print(f"\n📊 控制台消息统计:")
            print(f"   - 总消息数: {len(console_messages)}")
            print(f"   - 错误: {len(errors)}")
            print(f"   - 警告: {len(warnings)}")

            if errors:
                print("\n⚠️ 控制台错误:")
                for error in errors[:3]:
                    print(f"   - {error['text']}")
            else:
                print("✅ 无控制台错误")

            return len(errors) == 0

        except Exception as e:
            print(f"❌ 测试失败: {e}")
            return False
        finally:
            browser.close()


def main():
    """运行所有测试"""
    print("="*60)
    print("  语音克隆应用 - 登录功能自动化测试")
    print("="*60)
    print("\n⚙️ 测试环境:")
    print("   - 前端: http://localhost:3000")
    print("   - 后端: http://localhost:8080")

    # 运行测试
    results = []
    results.append(("登录页面元素检查", test_login_page_elements()))
    results.append(("登录表单交互", test_login_interaction()))

    # 测试总结
    print("\n" + "="*60)
    print("  📋 测试总结")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\n总计: {passed}/{total} 测试通过 ({passed*100//total}%)")

    if passed == total:
        print("\n🎉 所有测试通过！")
        return 0
    else:
        print(f"\n⚠️ {total - passed} 个测试失败")
        return 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 意外错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
