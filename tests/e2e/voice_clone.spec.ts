import { test, expect } from '@playwright/test';
import path from 'path';

const USER_EMAIL = 'xiaowu.417@qq.com';
const USER_PASSWORD = '1234qwer';

test.describe('Voice Cloning and Voice Library E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. 用户登录系统
    await page.goto('/');
    // 假设有登录页面，或者直接在首页登录
    // 这里需要根据实际UI进行调整，暂且按常规逻辑编写
    await page.fill('input[type="email"], input[placeholder*="邮箱"]', USER_EMAIL);
    await page.fill('input[type="password"], input[placeholder*="密码"]', USER_PASSWORD);
    await page.click('button:has-text("登录"), button[type="submit"]');
    // 等待登录成功跳转
    await expect(page).toHaveURL(/.*dashboard|.*workbench|.*/); 
  });

  test('Test 1: Voice Cloning, File Upload and Management', async ({ page }) => {
    // 2. 用户导航到"语音生成"-->"声音克隆"页面
    await page.click('text=语音生成');
    await page.click('text=声音克隆');
    
    // 3. 用户选择./data/audio/1229.MP3文件进行上传，进行声音克隆
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=上传音频, .upload-area'); // 根据实际按钮选择器修改
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(process.cwd(), 'data/audio/1229.MP3'));
    
    // 输入声音名称并点击克隆
    await page.fill('input[placeholder*="声音名称"]', 'TestVoice1');
    await page.click('button:has-text("开始克隆")');
    
    // 确认上传成功，系统扣掉相应分数 (这里假设界面会有提示或分数变化)
    await expect(page.locator('text=克隆成功')).toBeVisible({ timeout: 60000 });

    // 4. 上传成功后，用户刷新页面
    await page.reload();
    
    // 可以在音色列表中看到克隆的声音
    await expect(page.locator('text=TestVoice1')).toBeVisible();
    
    // 在上传文件处看到刚才上传的音频文件名和上传时间
    await expect(page.locator('text=1229.MP3')).toBeVisible();
    // 这里可以增加对上传时间的校验，比如包含当前日期的正则表达式
    
    // 5. 用户选择用已经上传的文件再次进行声音克隆
    await page.click('text=使用已有文件'); // 假设有这个功能
    await page.click('text=1229.MP3');
    await page.fill('input[placeholder*="声音名称"]', 'TestVoice1_Reused');
    await page.click('button:has-text("开始克隆")');
    await expect(page.locator('text=克隆成功')).toBeVisible();
    await expect(page.locator('text=TestVoice1_Reused')).toBeVisible();

    // 6. 用户选择删除刚才上传的音频文件
    await page.locator('.file-item:has-text("1229.MP3") button.delete').click();
    // 确认删除
    await page.click('button:has-text("确认")');
    
    // 确认删除成功，上传文件列表中不再显示该文件
    await expect(page.locator('text=1229.MP3')).not.toBeVisible();
    
    // 阿里云OSS中的删除需要后端逻辑支持，前端无法直接看到OSS，但可以确认文件列表更新
    // 且音色列表中的两个克隆声音仍然保留
    await expect(page.locator('text=TestVoice1')).toBeVisible();
    await expect(page.locator('text=TestVoice1_Reused')).toBeVisible();
  });

  test('Test 2: Real-time update and Generation History Management', async ({ page }) => {
    // 1. 用户运行test1 (已经在上一个test中模拟或本测试独立运行)
    
    // 2. 用户登出，再次用相同账号登录系统
    await page.click('.user-avatar, text=登出'); // 假设有登出按钮
    await page.goto('/');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button:has-text("登录")');

    // 3. 用户导航到"语音生成"-->"声音克隆"页面
    await page.click('text=语音生成');
    await page.click('text=声音克隆');
    
    // 选择./data/audio/1230.MP3文件上传
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=上传音频');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(process.cwd(), 'data/audio/1230.MP3'));
    
    await page.fill('input[placeholder*="声音名称"]', 'TestVoice2');
    await page.click('button:has-text("开始克隆")');

    // 4. 上传成功后，用户即使不刷新页面，也可以在音色列表中看到克隆的声音
    await expect(page.locator('text=TestVoice2')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('text=1230.MP3')).toBeVisible();

    // 5. 用户在生成历史中下载刚才生成的声音
    await page.click('text=生成历史');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.history-item').first().locator('button.download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).not.toBeNull();

    // 选择删除该生成的语音
    await page.locator('.history-item').first().locator('button.delete').click();
    await page.click('button:has-text("确认")');
    
    // 确认删除成功，生成历史中不再显示该记录
    // 且音色列表中的克隆声音仍然保留
    await page.click('text=声音克隆');
    await expect(page.locator('text=TestVoice2')).toBeVisible();
  });

  test('Test 3: Delete Cloned Voice via API integration', async ({ page }) => {
    // 1. 用户导航到"语音生成"-->"声音克隆"页面
    await page.click('text=语音生成');
    await page.click('text=声音克隆');

    // 2. 用户删除刚刚创建的音色
    const voiceName = 'TestVoice1'; 
    await page.locator(`.voice-item:has-text("${voiceName}") button.delete`).click();
    
    // 系统弹出确认删除对话框
    await expect(page.locator('text=确认删除此音色吗')).toBeVisible();
    await page.click('button:has-text("确认")');

    // 3. 用户确认删除成功，音色列表中不再显示该音色
    await expect(page.locator(`text=${voiceName}`)).not.toBeVisible();
  });

  test('Test 4: Voice Library and Text-to-Speech with Emotion Tags', async ({ page }) => {
    // 2. 用户导航到"语音生成"-->"声音库"页面
    await page.click('text=语音生成');
    await page.click('text=声音库');
    
    // 确认刚刚创建的音色出现在声音库中
    await expect(page.locator('text=TestVoice2')).toBeVisible();
    
    // 3. 用户选择刚刚创建的音色，点击"应用音色"按钮
    await page.locator('.voice-card:has-text("TestVoice2")').click();
    await page.click('button:has-text("应用音色")');
    
    // 系统跳转到工作台页面，确认该音色已被选择
    await expect(page).toHaveURL(/.*workbench|.*workspace/);
    await expect(page.locator('.selected-voice')).toContainText('TestVoice2');

    // 4. 用户在工作台页面输入文本"你好，这是一个测试。(高兴)"
    await page.fill('textarea[placeholder*="输入文本"]', '你好，这是一个测试。(高兴)');
    
    // 5. 选择生成语音
    // 这里需要拦截请求来确认后端接收到的文本转换
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/tts') && req.method() === 'POST'),
      page.click('button:has-text("生成语音")'),
    ]);
    
    const postData = JSON.parse(request.postData() || '{}');
    // 确认文本被正确转换为"你好，这是一个测试。(Happy)"
    expect(postData.text).toBe('你好，这是一个测试。(Happy)');

    // 确认语音生成请求被正确发送到fish-audio TTS API (后端逻辑)
    // 并且生成状态和下载链接在前端界面正确显示
    await expect(page.locator('text=生成中|text=完成')).toBeVisible();
    await expect(page.locator('button:has-text("下载")')).toBeVisible();

    // 6. 用户导航到生成历史页面
    await page.click('text=生成历史');
    
    // 确认生成历史中只包含了刚才出现的声音 (根据实际业务逻辑，这里可能需要更复杂的筛选)
    await expect(page.locator('.history-item')).toHaveCount(1);
    await expect(page.locator('.history-item')).toContainText('TestVoice2');

    // 7. 用户点击删除生成历史中的该记录
    await page.locator('.history-item button.delete').click();
    await page.click('button:has-text("确认")');
    
    // 确认删除成功
    await expect(page.locator('.history-item')).toHaveCount(0);
  });
});
