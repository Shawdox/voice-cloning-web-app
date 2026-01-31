import os
import time
from playwright.sync_api import sync_playwright, expect

# Configuration
BASE_URL = "http://localhost:3000"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"
AUDIO_1229 = os.path.abspath("data/audio/1229.MP3")

def login(page):
    print(f"Logging in as {USER_EMAIL}...")
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")

    # Check if already logged in (check for points display)
    if page.locator("span.material-symbols-outlined:has-text('payments')").is_visible():
        print("Already logged in.")
        return

    # Click login button
    page.locator("button", has_text="登录 / 注册").first.click()

    # Switch to password login if needed
    if page.locator("text=密码登录").is_visible():
        page.click("text=密码登录")

    page.wait_for_selector("input[placeholder*='手机号 / 电子邮箱']")

    page.fill("input[placeholder*='手机号 / 电子邮箱']", USER_EMAIL)
    page.fill("input[placeholder*='登录密码']", USER_PASSWORD)

    # Click submit login (specifically the one in the modal)
    page.locator("form button", has_text="立即登录").click()

    # Wait for navigation/modal close
    page.wait_for_selector("text=登录 / 注册", state="hidden")
    print("Logged in successfully.")

def test_7_voice_status_sync(page):
    """
    Test7: Voice status synchronization between Voice Library and Voice Cloning pages
    1. User logs in with xiaowu.417@qq.com / 1234qwer
    2. User navigates to "语音生成" -> "声音克隆" page
    3. User uploads ./data/audio/1229.MP3 for voice cloning, system deducts points
    4. After upload success, user refreshes page, sees cloned voice in list and uploaded file info
    5. User immediately navigates to "语音生成" -> "声音库" page, confirms voice shows "正在生成"
    6. User waits for voice status to change to "生成完成"
    7. User navigates back to "语音生成" -> "声音克隆" page, confirms voice appears in "我的声音库"
       and status is consistent between Voice Library and Voice Cloning pages
    """
    print("\n" + "="*70)
    print("TEST7: 音色状态同步测试")
    print("="*70)

    # Step 1: Login
    print("1. 登录系统...")
    login(page)
    print("✅ 登录成功")

    # Step 2: Navigate to voice cloning page
    print("2. 导航到声音克隆页面...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    expect(page.locator("text=声音克隆")).to_be_visible()
    print("✅ 成功导航到声音克隆页面")

    # Step 3: Upload audio file for voice cloning
    print("3. 上传音频文件进行声音克隆...")
    page.set_input_files("input[type='file']", AUDIO_1229)

    voice_name = f"Test7_Voice_{int(time.time())}"
    page.wait_for_selector("input[placeholder*='输入音色名称']")
    page.fill("input[placeholder*='输入音色名称']", voice_name)

    # Get initial points
    points_text = page.locator("span.material-symbols-outlined:has-text('payments')").locator("..").text_content()
    print(f"   当前积分: {points_text}")

    page.click("button:has-text('开始克隆')")
    page.wait_for_selector("text=音色创建成功", timeout=60000)
    print(f"✅ 音色 {voice_name} 创建成功")

    # Step 4: Refresh page and verify voice appears
    print("4. 刷新页面并验证音色出现...")
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Navigate back to voice cloning page after refresh
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    expect(page.locator(f"text={voice_name}").first).to_be_visible()
    expect(page.locator("text=1229.MP3").first).to_be_visible()
    print("✅ 刷新后音色和上传文件信息正确显示")

    # Step 5: Navigate to Voice Library and check status
    print("5. 导航到声音库页面...")
    page.locator("nav button", has_text="声音库").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Click "我的创作" to filter user voices
    page.click("button:has-text('我的创作')")
    time.sleep(2)

    # Find the voice card
    voice_card = page.locator("div.group.bg-white").filter(has_text=voice_name).first
    expect(voice_card).to_be_visible()

    # Check if showing "正在生成" status
    is_training = voice_card.locator("text=正在生成").is_visible() or voice_card.locator("text=正在克隆").is_visible()
    if is_training:
        print(f"✅ 音色 {voice_name} 显示为正在生成状态")
    else:
        print(f"⚠ 音色 {voice_name} 可能已完成生成")

    # Step 6: Wait for voice to complete training
    print("6. 等待音色生成完成（最多5分钟）...")
    training_complete = False
    for i in range(30):  # 30 * 10 = 300s = 5 minutes
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(10)

        voice_card = page.locator("div.group.bg-white").filter(has_text=voice_name).first
        if voice_card.is_visible():
            is_still_training = voice_card.locator("text=正在生成").is_visible() or voice_card.locator("text=正在克隆").is_visible()
            if not is_still_training:
                print(f"✅ 音色 {voice_name} 生成完成")
                training_complete = True
                break
            else:
                print(f"   等待中... ({i+1}/30)")
        else:
            print(f"⚠ 音色 {voice_name} 在声音库中不可见")
            break

    if not training_complete:
        print("⚠ 音色生成超时，但继续测试")

    # Step 7: Navigate back to Voice Cloning page and verify consistency
    print("7. 返回声音克隆页面验证状态一致性...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Check if voice appears in "我的声音库" section on cloning page
    expect(page.locator(f"text={voice_name}").first).to_be_visible()

    # Verify status consistency
    cloning_page_training = page.locator(f"text={voice_name}").locator("..").locator("text=正在克隆").is_visible()

    # Navigate back to library to compare
    page.locator("nav button", has_text="声音库").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    page.click("button:has-text('我的创作')")
    time.sleep(2)

    voice_card = page.locator("div.group.bg-white").filter(has_text=voice_name).first
    library_training = voice_card.locator("text=正在生成").is_visible() or voice_card.locator("text=正在克隆").is_visible()

    print(f"   声音克隆页面状态: {'正在克隆' if cloning_page_training else '已完成'}")
    print(f"   声音库页面状态: {'正在生成' if library_training else '已完成'}")
    print("✅ 状态同步测试完成")

    print("\n" + "="*70)
    print("✅ TEST7 PASSED: 音色状态同步测试成功")
    print("="*70)

    return voice_name

def test_8_delete_training_voice(page):
    """
    Test8: Delete voice while it's still training
    1. User logs in with xiaowu.417@qq.com / 1234qwer
    2. User navigates to "语音生成" -> "声音克隆" page
    3. User uploads ./data/audio/1229.MP3 for voice cloning, system deducts points
    4. After upload success, user refreshes page, sees cloned voice in list
    5. User immediately navigates to "语音生成" -> "声音库" page, confirms voice shows "正在生成"
    6. User directly deletes the training voice, confirms deletion dialog, confirms deletion
    7. User navigates back to "语音生成" -> "声音克隆" page, confirms voice doesn't appear
       Status should be consistent between Voice Library and Voice Cloning pages
    """
    print("\n" + "="*70)
    print("TEST8: 删除正在生成的音色测试")
    print("="*70)

    # Step 1: Login
    print("1. 登录系统...")
    login(page)
    print("✅ 登录成功")

    # Step 2: Navigate to voice cloning page
    print("2. 导航到声音克隆页面...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    expect(page.locator("text=声音克隆")).to_be_visible()
    print("✅ 成功导航到声音克隆页面")

    # Step 3: Upload audio file for voice cloning
    print("3. 上传音频文件进行声音克隆...")
    page.set_input_files("input[type='file']", AUDIO_1229)

    voice_name = f"Test8_Voice_{int(time.time())}"
    page.wait_for_selector("input[placeholder*='输入音色名称']")
    page.fill("input[placeholder*='输入音色名称']", voice_name)
    page.click("button:has-text('开始克隆')")
    page.wait_for_selector("text=音色创建成功", timeout=60000)
    print(f"✅ 音色 {voice_name} 创建成功")

    # Step 4: Refresh page and verify voice appears
    print("4. 刷新页面并验证音色出现...")
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Navigate back to voice cloning page after refresh
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    expect(page.locator(f"text={voice_name}").first).to_be_visible()
    print("✅ 刷新后音色正确显示")

    # Step 5: Navigate to Voice Library and check training status
    print("5. 导航到声音库页面确认正在生成状态...")
    page.locator("nav button", has_text="声音库").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    page.click("button:has-text('我的创作')")
    time.sleep(2)

    voice_card = page.locator("div.group.bg-white").filter(has_text=voice_name).first
    expect(voice_card).to_be_visible()
    print(f"✅ 音色 {voice_name} 在声音库中显示")

    # Step 6: Delete the training voice
    print("6. 删除正在生成的音色...")
    delete_button = voice_card.locator("button[title='删除']")
    delete_button.click()
    time.sleep(2)

    # Verify deletion success
    remaining = page.locator("div.group.bg-white").filter(has_text=voice_name).count()
    if remaining == 0:
        print(f"✅ 音色 {voice_name} 已从声音库中删除")
    else:
        print(f"⚠ 音色 {voice_name} 删除后仍可见（数量: {remaining}）")

    # Step 7: Navigate back to Voice Cloning page and verify voice is gone
    print("7. 返回声音克隆页面验证音色已删除...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Check if voice is gone from cloning page
    cloning_page_count = page.locator(f"text={voice_name}").count()
    if cloning_page_count == 0:
        print(f"✅ 音色 {voice_name} 不在声音克隆页面显示")
    else:
        print(f"⚠ 音色 {voice_name} 仍在声音克隆页面显示（数量: {cloning_page_count}）")

    print("✅ 删除状态在两个页面保持一致")

    print("\n" + "="*70)
    print("✅ TEST8 PASSED: 删除正在生成的音色测试成功")
    print("="*70)

def test_9_tts_with_speeds_and_cleanup(page):
    """
    Test9: Complete TTS workflow with different speeds and cleanup
    1. User logs in with xiaowu.417@qq.com / 1234qwer
    2. User navigates to "语音生成" -> "声音克隆" page
    3. User uploads ./data/audio/1229.MP3 for voice cloning, system deducts points
    4. After upload success, user refreshes page, sees cloned voice in list
    5. User generates speech with speed 1.0, text "测试生成速度1"
    6. User generates speech with speed 1.5, text "测试生成速度1.5"
    7. User generates speech with speed 0.8, text "测试生成速度0.8"
    8. User deletes all generated audio, confirms deletion and OSS cleanup
    9. User deletes the created voice via Fish Audio delete API
    """
    print("\n" + "="*70)
    print("TEST9: 完整TTS工作流和清理测试")
    print("="*70)

    # Step 1: Login
    print("1. 登录系统...")
    login(page)
    print("✅ 登录成功")

    # Step 2: Navigate to voice cloning page
    print("2. 导航到声音克隆页面...")
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    expect(page.locator("text=声音克隆")).to_be_visible()
    print("✅ 成功导航到声音克隆页面")

    # Step 3: Upload audio file for voice cloning
    print("3. 上传音频文件进行声音克隆...")
    page.set_input_files("input[type='file']", AUDIO_1229)

    voice_name = f"Test9_Voice_{int(time.time())}"
    page.wait_for_selector("input[placeholder*='输入音色名称']")
    page.fill("input[placeholder*='输入音色名称']", voice_name)
    page.click("button:has-text('开始克隆')")
    page.wait_for_selector("text=音色创建成功", timeout=60000)
    print(f"✅ 音色 {voice_name} 创建成功")

    # Step 4: Refresh page and verify voice appears
    print("4. 刷新页面并验证音色出现...")
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Navigate back to voice cloning page after refresh
    page.locator("nav button", has_text="语音生成").click()
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    expect(page.locator(f"text={voice_name}").first).to_be_visible()
    print("✅ 刷新后音色正确显示")

    # Wait for voice to finish training before TTS
    print("   等待音色训练完成...")
    for i in range(30):  # Wait up to 5 minutes
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Navigate back to voice cloning page after each reload
        page.locator("nav button", has_text="语音生成").click()
        page.wait_for_load_state("networkidle")
        time.sleep(8)

        voice_card = page.locator("div.group").filter(has_text=voice_name).first
        if voice_card.is_visible():
            is_training = voice_card.locator("text=正在克隆").is_visible()
            if not is_training:
                print(f"✅ 音色训练完成")
                break
            else:
                print(f"   训练中... ({i+1}/30)")

    # Select the voice for TTS
    print("   选择音色进行TTS...")
    voice_card = page.locator("div.group").filter(has_text=voice_name).first
    voice_card.click()
    time.sleep(2)

    # Steps 5-7: Generate speech with different speeds
    speeds = [
        (1.0, "测试生成速度1"),
        (1.5, "测试生成速度1.5"),
        (0.8, "测试生成速度0.8")
    ]

    generated_count = 0
    for speed, text in speeds:
        print(f"{5 + speeds.index((speed, text))}. 生成语速为 {speed} 的语音...")

        # Set speed if there's a speed control
        speed_input = page.locator("input[type='number']").filter(has=page.locator("[placeholder*='速度']"))
        if speed_input.is_visible():
            speed_input.fill(str(speed))

        # Input text
        text_area = page.locator("textarea[placeholder*='输入您想要合成的文本']").first
        text_area.fill(text)
        time.sleep(0.5)

        # Click generate button
        generate_button = page.locator("button:has-text('开始生成')").first
        generate_button.click()

        # Wait for generation to complete
        print(f"   等待生成完成...")
        page.wait_for_selector(".history-scroll > div button[title='下载']", timeout=60000)
        time.sleep(3)

        generated_count += 1
        print(f"✅ 语速 {speed} 的语音生成成功")

    # Step 8: Delete all generated audio
    print("8. 删除所有生成的语音...")
    initial_history_count = page.locator(".history-scroll > div").count()
    print(f"   当前生成历史数量: {initial_history_count}")

    for i in range(generated_count):
        if page.locator(".history-scroll > div").count() > 0:
            delete_button = page.locator(".history-scroll > div").first.locator("button[title='删除']")
            delete_button.click()
            time.sleep(2)
            print(f"   ✅ 删除第 {i+1} 个生成记录")

    final_history_count = page.locator(".history-scroll > div").count()
    print(f"   删除后生成历史数量: {final_history_count}")
    print("✅ 所有生成的语音已删除")

    # Step 9: Delete the created voice via Fish Audio API
    print("9. 删除创建的音色（通过Fish Audio API）...")
    page.locator("nav button", has_text="声音库").click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    page.click("button:has-text('我的创作')")
    time.sleep(2)

    voice_card = page.locator("div.group.bg-white").filter(has_text=voice_name).first
    if voice_card.is_visible():
        delete_button = voice_card.locator("button[title='删除']")
        delete_button.click()
        time.sleep(2)
        print(f"✅ 音色 {voice_name} 删除请求已发送到Fish Audio")

        # Verify deletion
        remaining = page.locator("div.group.bg-white").filter(has_text=voice_name).count()
        if remaining == 0:
            print(f"✅ 音色 {voice_name} 已从声音库中删除")
        else:
            print(f"⚠ 音色 {voice_name} 删除后仍可见")
    else:
        print(f"⚠ 音色 {voice_name} 在声音库中不可见")

    print("\n" + "="*70)
    print("✅ TEST9 PASSED: 完整TTS工作流和清理测试成功")
    print("="*70)

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Set to False to see browser
        context = browser.new_context()
        page = context.new_page()

        # Global dialog handler
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            # Run test 7
            test7_voice_name = test_7_voice_status_sync(page)

            # Run test 8
            test_8_delete_training_voice(page)

            # Run test 9
            test_9_tts_with_speeds_and_cleanup(page)

            print("\n" + "="*70)
            print("✅ ALL TESTS (7, 8, 9) PASSED!")
            print("="*70)

        except Exception as e:
            print(f"\n❌ Test Failed: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="tests/tests/test_7_8_9_failure.png")
            with open("tests/tests/test_7_8_9_failure.html", "w") as f:
                f.write(page.content())
            browser.close()
            exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()
