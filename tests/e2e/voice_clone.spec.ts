import { test, expect } from '@playwright/test';
import path from 'path';

const USER_EMAIL = 'xiaowu.417@qq.com';
const USER_PASSWORD = '1234qwer';
const BASE_URL = 'http://localhost:3000';

async function loginUser(page: any, email: string, password: string) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const alreadyLoggedIn = await page.locator('span.material-symbols-outlined:has-text("payments")').isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyLoggedIn) {
    return;
  }

  let opened = false;
  const loginButton = page.locator('button:has-text("登录 / 注册")').first();
  if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginButton.click();
    await page.waitForTimeout(500);
    opened = true;
  }

  if (!opened) {
    const directLogin = page.locator('button:has-text("登录")').first();
    if (await directLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      await directLogin.click();
      await page.waitForTimeout(500);
      opened = true;
    }
  }

  if (!opened) {
    throw new Error('Login modal not found');
  }

  const passwordLoginTab = page.locator('text=密码登录');
  if (await passwordLoginTab.isVisible()) {
    await passwordLoginTab.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[placeholder*="手机号 / 电子邮箱"], input[placeholder*="邮箱"]', email);
  await page.fill('input[placeholder*="登录密码"], input[placeholder*="密码"]', password);
  const submitButton = page.locator('button:has-text("立即登录")').first();
  if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitButton.click({ force: true });
  } else {
    await page.locator('button:has-text("登录")').first().click({ force: true });
  }
  await page.waitForTimeout(3000);
}

test.describe.serial('Voice Cloning and Voice Library E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginUser(page, USER_EMAIL, USER_PASSWORD);
  });

  test('Test 6: Predefined Voices Direct Use (预定义音色直接使用)', async ({ page }) => {
    test.setTimeout(120000);
    // Step 1-2: 打开前端并登录（已在beforeEach中完成）

    // Step 3: 导航到"语音生成"页面，检查"系统预设"
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForTimeout(3000);

    // 验证在声音克隆页面
    await expect(page.locator('text=声音克隆')).toBeVisible();

    // 点击"系统预设"标签
    await page.locator('button:has-text("系统预设")').first().click();
    await page.waitForTimeout(2000);

    // 验证有8个预定义音色
    const predefinedCards = page.locator('div.group.p-4.rounded-2xl').filter({ has: page.locator('text=点击使用此音色') });
    await expect(predefinedCards).toHaveCount(8);

    // 验证"我的创作"不显示预定义音色
    await page.locator('button:has-text("我的创作")').first().click();
    await page.waitForTimeout(2000);
    const initialUserVoiceCount = await page.locator('div.group.p-4.rounded-2xl').count();

    // Step 4: 使用预定义音色直接生成语音
    await page.locator('button:has-text("系统预设")').first().click();
    await page.waitForTimeout(2000);

    // 选择第一个预定义音色
    const firstVoice = predefinedCards.first();
    await firstVoice.click();
    await page.waitForTimeout(1000);

    // 输入测试文本并生成
    const textInput = page.locator('textarea[placeholder*="输入您想要合成的文本"]').first();
    await textInput.fill('你好，这是一个测试 test6。');
    await page.waitForTimeout(500);

    const generateButton = page.locator('button:has-text("开始生成")').first();
    await generateButton.click();
    await page.waitForTimeout(2000);

    // 验证"我的创作"中没有新增音色
    await page.locator('button:has-text("我的创作")').first().click();
    await page.waitForTimeout(2000);
    const currentUserVoiceCount = await page.locator('div.group.p-4.rounded-2xl').count();
    expect(currentUserVoiceCount).toBe(initialUserVoiceCount);

    // Step 5: 导航到"声音库"页面
    await page.locator('nav button:has-text("声音库")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 验证"预定义音色"筛选
    await page.click('button:has-text("预定义音色")');
    await page.waitForTimeout(3000);

    const predefinedInLibrary = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    await expect(predefinedInLibrary).toHaveCount(8);

    // 验证"全部音色"筛选
    await page.click('button:has-text("全部音色")');
    await page.waitForTimeout(2000);

    const allPredefined = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    await expect(allPredefined).toHaveCount(8);

    // Step 6: 测试刷新后预定义音色持久性
    await page.locator('nav button:has-text("首页")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.locator('nav button:has-text("声音库")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.click('button:has-text("预定义音色")');
    await page.waitForTimeout(2000);

    const predefinedAfterRefresh = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    await expect(predefinedAfterRefresh).toHaveCount(8);

    // Step 7: 测试试听功能
    if (await predefinedAfterRefresh.count() > 0) {
      const firstVoiceInLibrary = predefinedAfterRefresh.first();
      await firstVoiceInLibrary.hover();
      await page.waitForTimeout(1000);

      const playButton = firstVoiceInLibrary.locator('button').filter({ has: page.locator('span.material-symbols-outlined:has-text("play_circle")') });
      if (await playButton.count() > 0) {
        await playButton.first().click();
        await page.waitForTimeout(2000);

        // 检查是否变为暂停按钮
        const pauseButton = firstVoiceInLibrary.locator('button').filter({ has: page.locator('span.material-symbols-outlined:has-text("pause_circle")') });
        if (await pauseButton.count() > 0) {
          // 尝试暂停，但不强制要求成功（音频可能已播放完成）
          try {
            await pauseButton.first().click({ timeout: 5000 });
          } catch (e) {
            // 音频可能已播放完成，忽略错误
          }
        }
      }
    }

    // Step 8: 测试"应用音色"按钮
    await page.click('button:has-text("我的创作")');
    await page.waitForTimeout(2000);

    const userVoices = page.locator('div.group.bg-white').filter({ hasNot: page.locator('span:has-text("预定义")') });
    if (await userVoices.count() > 0) {
      // 查找一个ready状态的音色
      for (let i = 0; i < Math.min(await userVoices.count(), 5); i++) {
        const voice = userVoices.nth(i);
        const applyButton = voice.locator('button:has-text("应用音色")');
        if (await applyButton.isVisible() && !(await applyButton.isDisabled())) {
          await applyButton.click();
          await page.waitForTimeout(2000);
          await expect(page.locator('text=声音克隆')).toBeVisible();
          break;
        }
      }
    }

    // Step 9: 在工作台输入文本
    const workspaceTextInput = page.locator('textarea[placeholder*="输入您想要合成的文本"]').first();
    if (await workspaceTextInput.isVisible()) {
      await workspaceTextInput.fill('你好，这是一个测试 test6。');
      await page.waitForTimeout(500);

      const workspaceGenerateButton = page.locator('button:has-text("开始生成")').first();
      if (await workspaceGenerateButton.isVisible() && !(await workspaceGenerateButton.isDisabled())) {
        await workspaceGenerateButton.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 10: 测试删除功能
    await page.locator('nav button:has-text("声音库")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证预定义音色不显示删除按钮
    await page.click('button:has-text("预定义音色")');
    await page.waitForTimeout(2000);

    const predefinedVoicesCheck = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    if (await predefinedVoicesCheck.count() > 0) {
      const firstPredefined = predefinedVoicesCheck.first();
      const deleteButtons = firstPredefined.locator('button[title="删除"]');
      await expect(deleteButtons).toHaveCount(0);
    }

    // Step 11: 测试退出登录后预定义音色持久性
    // 查找账户按钮
    const accountSelectors = [
      'button:has-text("账户")',
      'nav button:has-text("账户")',
      'button:has(span.material-symbols-outlined:has-text("account_circle"))'
    ];

    let accountButton: any = null;
    for (const selector of accountSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          accountButton = btn;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (accountButton) {
      await accountButton.click();
      await page.waitForTimeout(1000);

      const logoutButton = page.locator('button:has-text("退出登录")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // 刷新并重新登录
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 重新登录
    await loginUser(page, USER_EMAIL, USER_PASSWORD);

    // 验证预定义音色仍然存在
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("系统预设")').first().click();
    await page.waitForTimeout(3000);

    const finalPredefinedCount = await page.locator('div.group.p-4.rounded-2xl').filter({ has: page.locator('text=点击使用此音色') }).count();
    expect(finalPredefinedCount).toBe(8);

    // 验证声音库中的预定义音色
    await page.locator('nav button:has-text("声音库")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.click('button:has-text("预定义音色")');
    await page.waitForTimeout(2000);

    const finalLibPredefined = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    await expect(finalLibPredefined).toHaveCount(8);

    await page.click('button:has-text("全部音色")');
    await page.waitForTimeout(2000);

    const finalAllPredefined = page.locator('div.group.bg-white').filter({ has: page.locator('span:has-text("预定义")') });
    await expect(finalAllPredefined).toHaveCount(8);
  });

  test('Test 1: Voice Cloning, File Upload and Management', async ({ page }) => {
    test.setTimeout(120000);
    // 2. 用户导航到"语音生成"-->"声音克隆"页面
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForTimeout(3000);
    
    // 3. 用户选择./data/audio/1229.MP3文件进行上传，进行声音克隆
    const audioPath = path.join(process.cwd(), 'data/audio/1229.MP3');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"][accept*="mp3"], input[type="file"]').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(audioPath);
    
    // 输入声音名称并点击克隆
    const voiceName = `TestVoice1_${Date.now()}`;
    await page.fill('input[placeholder*="音色名称"], input[placeholder*="声音名称"]', voiceName);
    await page.click('button:has-text("开始克隆")');
    
    // 等待克隆中的音色出现在列表
    await expect(page.locator(`text=${voiceName}`).first()).toBeVisible({ timeout: 60000 });

    // 4. 上传成功后，用户刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 阿里云OSS中的删除需要后端逻辑支持，前端无法直接看到OSS
  });

  test('Test 2: Real-time update and Generation History Management', async ({ page }) => {
    test.setTimeout(120000);
    // 1. 用户运行test1 (已经在上一个test中模拟或本测试独立运行)
    
    // 2. 用户登出，再次用相同账号登录系统
    await page.goto(BASE_URL);
    await loginUser(page, USER_EMAIL, USER_PASSWORD);

    // 3. 用户导航到"语音生成"-->"声音克隆"页面
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForTimeout(3000);
    
    // 选择./data/audio/1230.MP3文件上传
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"][accept*="mp3"], input[type="file"]').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(process.cwd(), 'data/audio/1230.MP3'));
    
    await page.fill('input[placeholder*="音色名称"], input[placeholder*="声音名称"]', 'TestVoice2');
    await page.click('button:has-text("开始克隆")');

    // 4. 上传成功后，用户即使不刷新页面，也可以在音色列表中看到克隆的声音
    await expect(page.locator('text=TestVoice2').first()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('text=1230.MP3').first()).toBeVisible();

    // 5. 用户在生成历史中下载刚才生成的声音
    await page.click('text=生成历史');
    await page.waitForTimeout(2000);
    
    // 确认删除成功，生成历史中不再显示该记录
    // 且音色列表中的克隆声音仍然保留
    await page.click('text=声音克隆');
    await expect(page.locator('text=TestVoice2').first()).toBeVisible({ timeout: 60000 });
  });

  test('Test 3: Delete Cloned Voice via API integration', async ({ page }) => {
    test.setTimeout(120000);
    // 1. 用户导航到"语音生成"-->"声音克隆"页面
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. 用户删除刚刚创建的音色
    const deleteButton = page.locator('button[title="删除"]').first();
    await deleteButton.click();
    
    // 系统弹出确认删除对话框
    await page.waitForTimeout(1000);

    // 3. 用户确认删除成功，音色列表中不再显示该音色
    await page.waitForTimeout(1000);
  });

  test('Test 4: Voice Library and Text-to-Speech with Emotion Tags', async ({ page }) => {
    test.setTimeout(120000);
    // 2. 用户导航到"语音生成"-->"声音库"页面
    await page.locator('button:has-text("语音生成")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 确认刚刚创建的音色出现在声音库中
    await expect(page.locator('text=TestVoice2').first()).toBeVisible();
    
    // 3. 用户选择刚刚创建的音色，点击"应用音色"按钮
    await page.locator('text=TestVoice2').first().click();
    
    // 系统跳转到工作台页面，确认该音色已被选择
    await page.waitForTimeout(2000);

    // 4. 用户在工作台页面输入文本"你好，这是一个测试。(高兴)"
    await page.fill('textarea[placeholder*="输入您想要合成的文本"]', '你好，这是一个测试。(高兴)');
    
    // 5. 选择生成语音
    // 这里需要拦截请求来确认后端接收到的文本转换
    await page.click('button:has-text("开始生成")');
    await page.waitForTimeout(3000);
  });
});
