import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'newuser@example.com';
const TEST_PASSWORD = 'password123';
const UNLIMITED_EMAIL = 'xiaowu.417@qq.com';
const UNLIMITED_PASSWORD = '1234qwer';

// Helper function to calculate credits based on UTF-8 byte count
function calculateCredits(text: string): number {
  const byteCount = Buffer.byteLength(text, 'utf8');
  return Math.round((byteCount / 114000) * 10000);
}

// Helper function to read text file
function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// Helper function to login
async function loginUser(page: any, email: string, password: string) {
  const alreadyLoggedIn = await page.locator('span.material-symbols-outlined:has-text("payments")').isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyLoggedIn) {
    return;
  }

  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);

  let opened = false;
  const loginButton = page.locator('button:has-text("登录 / 注册")').first();
  if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginButton.click();
    await page.waitForTimeout(1000);
    opened = true;
  }

  if (!opened) {
    const directLogin = page.locator('button:has-text("登录")').first();
    if (await directLogin.isVisible({ timeout: 2000 }).catch(() => false)) {
      await directLogin.click();
      await page.waitForTimeout(1000);
      opened = true;
    }
  }

  if (!opened) {
    throw new Error('Login modal not found');
  }

  // Switch to password login if needed
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
    const fallbackButton = page.locator('button:has-text("登录")').first();
    await fallbackButton.click({ force: true });
  }
  await page.waitForTimeout(3000);
}

async function registerUser(page: any, email: string, password: string) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("登录 / 注册")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("立即注册")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("邮箱注册")').click();
  await page.waitForTimeout(1000);

  await page.fill('input[placeholder*="电子邮箱地址"], input[placeholder*="邮箱"]', email);
  await page.fill('input[placeholder*="登录密码"], input[placeholder*="密码"]', password);
  await page.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("立即注册")').click();
  await page.waitForTimeout(3000);
}

async function getCredits(page: any): Promise<number> {
  const headerIcon = page.locator('span.material-symbols-outlined:has-text("payments")').first();
  if (await headerIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
    const headerCredits = headerIcon.locator('..').locator('span').nth(1);
    const creditText = await headerCredits.textContent();
    return parseInt(creditText || '0', 10);
  }

  const workspaceLabel = page.locator('text=可用积分');
  if (await workspaceLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const workspaceCredits = workspaceLabel.locator('..').locator('span').last();
    const creditText = await workspaceCredits.textContent();
    return parseInt(creditText || '0', 10);
  }

  throw new Error('Credits display not found');
}

async function waitForCredits(page: any): Promise<number> {
  try {
    await page.waitForSelector('span.material-symbols-outlined:has-text("payments")', { timeout: 15000 });
    return await getCredits(page);
  } catch {
    await navigateToWorkspace(page);
    await page.waitForSelector('text=可用积分', { timeout: 15000 });
    return await getCredits(page);
  }
}

async function navigateToWorkspace(page: any) {
  const navButton = page.locator('nav button:has-text("语音生成")').first();
  if (await navButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await navButton.click();
    await page.waitForTimeout(3000);
    return;
  }

  const workspaceNav = page.locator('button:has-text("语音生成")').first();
  if (await workspaceNav.isVisible({ timeout: 2000 }).catch(() => false)) {
    await workspaceNav.click();
    await page.waitForTimeout(3000);
    return;
  }

  const startButtons = [
    'button:has-text("开始体验")',
    'button:has-text("立即体验")',
    'button:has-text("开始使用")',
    'button:has-text("开始生成")'
  ];

  for (const selector of startButtons) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(3000);
      return;
    }
  }

  throw new Error('Unable to navigate to workspace');
}

async function logoutUser(page: any) {
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
}

async function cleanupUserFiles(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'delete_user_account.py');
    const args = [scriptPath, email, password, '--cleanup-only'];
    execFile('python3', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve();
    });
  });
}

function deleteUserAccount(
  email: string,
  password: string,
  options?: { allowMissing?: boolean; skipApi?: boolean }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'delete_user_account.py');
    const args = [scriptPath, email, password];
    if (options?.allowMissing) {
      args.push('--allow-missing');
    }
    if (options?.skipApi) {
      args.push('--skip-api');
    }
    execFile('python3', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve();
    });
  });
}

test.describe.serial('Credit System E2E Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Test 10: Credit flow with voice cloning and deductions', async ({ page }) => {
    test.setTimeout(180000);
    await deleteUserAccount(TEST_EMAIL, TEST_PASSWORD, { allowMissing: true, skipApi: true });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("登录 / 注册")').first().click();

    await registerUser(page, TEST_EMAIL, TEST_PASSWORD);

    // Confirm credits are 5000
    const initialCredits = await waitForCredits(page);
    expect(initialCredits).toBe(5000);

    // Navigate to voice cloning
    await navigateToWorkspace(page);

    // Upload audio
    const audioPath = path.join(process.cwd(), 'data/audio/1229.MP3');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"][accept*="mp3"], input[type="file"]').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(audioPath);
    await page.waitForTimeout(2000);

    const voiceName = `TestVoice_${Date.now()}`;
    await page.fill('input[placeholder="输入音色名称"], input[placeholder*="音色名称"]', voiceName);
    await page.locator('button:has-text("开始克隆")').first().click();

    await expect(
      page.locator('div[class*="bg-white"][class*="rounded-2xl"]').filter({ hasText: voiceName }).first()
    ).toBeVisible({ timeout: 60000 });

    const creditsAfterClone = await waitForCredits(page);
    expect(creditsAfterClone).toBe(initialCredits);

    let voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    for (let i = 0; i < 30; i++) {
      const isTraining = await voiceCard.locator('text=正在克隆').isVisible().catch(() => false);
      if (!isTraining) {
        break;
      }
      await page.waitForTimeout(6000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await navigateToWorkspace(page);
      voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    }

    await voiceCard.click();
    await page.waitForTimeout(1000);

    const input1Path = path.join(process.cwd(), 'input_txt/input1.txt');
    const input1Text = readTextFile(input1Path);
    const input1ByteCount = Buffer.byteLength(input1Text, 'utf8');
    expect(input1ByteCount).toBe(711);

    const expectedDeduction1 = calculateCredits(input1Text);
    expect(expectedDeduction1).toBe(62);

    const textInput = page.locator('textarea[placeholder*="输入您想要合成的文本"]').first();
    await textInput.fill(input1Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();
    await page.waitForTimeout(5000);

    const creditsAfterFirst = await getCredits(page);
    const actualDeduction1 = creditsAfterClone - creditsAfterFirst;
    expect(actualDeduction1).toBe(expectedDeduction1);

    const input2Path = path.join(process.cwd(), 'input_txt/input2.txt');
    const input2Text = readTextFile(input2Path);
    const input2ByteCount = Buffer.byteLength(input2Text, 'utf8');
    expect(input2ByteCount).toBe(3614);

    const expectedDeduction2 = Math.max(100, calculateCredits(input2Text));
    expect(expectedDeduction2).toBe(317);

    await textInput.fill(input2Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();
    await page.waitForTimeout(5000);

    const creditsAfterSecond = await getCredits(page);
    const actualDeduction2 = creditsAfterFirst - creditsAfterSecond;
    expect(actualDeduction2).toBe(expectedDeduction2);

    const input3Path = path.join(process.cwd(), 'input_txt/input3.txt');
    const input3Text = readTextFile(input3Path);
    const input3ByteCount = Buffer.byteLength(input3Text, 'utf8');
    expect(input3ByteCount).toBe(5805);

    await textInput.fill(input3Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();

    await expect(page.locator('text=该输入过长')).toBeVisible({ timeout: 5000 });

    await logoutUser(page);

    await deleteUserAccount(TEST_EMAIL, TEST_PASSWORD);
  });

  test('Test 11: Insufficient credits for second generation', async ({ page }) => {
    test.setTimeout(300000);
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    await deleteUserAccount(TEST_EMAIL, TEST_PASSWORD, { allowMissing: true, skipApi: true });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("登录 / 注册")').first().click();

    await registerUser(page, TEST_EMAIL, TEST_PASSWORD);

    const initialCredits = await waitForCredits(page);
    expect(initialCredits).toBe(5000);

    await navigateToWorkspace(page);

    const audioPath = path.join(process.cwd(), 'data/audio/1229.MP3');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"][accept*="mp3"], input[type="file"]').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(audioPath);
    await page.waitForTimeout(2000);

    const voiceName = `TestVoice_${Date.now()}`;
    await page.fill('input[placeholder="输入音色名称"], input[placeholder*="音色名称"]', voiceName);
    await page.locator('button:has-text("开始克隆")').first().click();

    await expect(
      page.locator('div[class*="bg-white"][class*="rounded-2xl"]').filter({ hasText: voiceName }).first()
    ).toBeVisible({ timeout: 60000 });

    const creditsAfterClone = await waitForCredits(page);
    expect(creditsAfterClone).toBe(initialCredits);

    let voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    for (let i = 0; i < 30; i++) {
      const isTraining = await voiceCard.locator('text=正在克隆').isVisible().catch(() => false);
      if (!isTraining) {
        break;
      }
      await page.waitForTimeout(6000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await navigateToWorkspace(page);
      voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    }

    await voiceCard.click();
    await page.waitForTimeout(1000);

    await new Promise<void>((resolve, reject) => {
      execFile('python3', [path.join(process.cwd(), 'update_credits.py'), TEST_EMAIL, '62'], (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }
        resolve();
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    const updatedCredits = await waitForCredits(page);
    expect(updatedCredits).toBe(62);

    await navigateToWorkspace(page);

    voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    await voiceCard.click();
    await page.waitForTimeout(1000);

    const input1Path = path.join(process.cwd(), 'input_txt/input1.txt');
    const input1Text = readTextFile(input1Path);
    const input1ByteCount = Buffer.byteLength(input1Text, 'utf8');
    expect(input1ByteCount).toBe(711);

    const expectedDeduction1 = calculateCredits(input1Text);
    expect(expectedDeduction1).toBe(62);

    const textInput = page.locator('textarea[placeholder*="输入您想要合成的文本"]').first();
    await textInput.fill(input1Text);
    await page.waitForTimeout(500);
    let ttsCreated = false;
    for (let i = 0; i < 5; i++) {
      const generateButton = page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first();
      await expect(generateButton).toBeEnabled({ timeout: 5000 });
      let response;
      try {
        [response] = await Promise.all([
          page.waitForResponse((res) => res.url().includes('/tts') && res.request().method() === 'POST', { timeout: 10000 }),
          generateButton.click(),
        ]);
      } catch (err) {
        throw new Error('TTS request did not fire in time');
      }
      const body = await response.json().catch(() => null);
      const message = body?.message || body?.error || '';

      if (response.status() === 201 && message.includes('TTS')) {
        ttsCreated = true;
        break;
      }

      if (message.includes('音色尚未完成克隆')) {
        await page.waitForTimeout(6000);
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await navigateToWorkspace(page);
        voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
        await voiceCard.click();
        await page.waitForTimeout(1000);
        await textInput.fill(input1Text);
        continue;
      }

      throw new Error(`TTS request failed: ${response.status()} ${message}`);
    }

    expect(ttsCreated).toBeTruthy();
    await page.waitForTimeout(3000);

    await page.reload();
    await page.waitForTimeout(2000);

    await new Promise<void>((resolve, reject) => {
      execFile('python3', [path.join(process.cwd(), 'update_credits.py'), TEST_EMAIL, '50'], (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }
        resolve();
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);
    const lowCredits = await waitForCredits(page);
    expect(lowCredits).toBe(50);

    await navigateToWorkspace(page);
    voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    await voiceCard.click();
    await page.waitForTimeout(1000);

    const input2Path = path.join(process.cwd(), 'input_txt/input2.txt');
    const input2Text = readTextFile(input2Path);
    const input2ByteCount = Buffer.byteLength(input2Text, 'utf8');
    expect(input2ByteCount).toBe(3614);

    const expectedDeduction2 = calculateCredits(input2Text);
    expect(expectedDeduction2).toBe(317);

    await textInput.fill(input2Text);
    await page.waitForTimeout(500);
    const generateButton = page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first();
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    await generateButton.click();

    await expect(page.locator('text=积分余额不足，请充值')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("去充值")')).toBeVisible({ timeout: 10000 });

    await logoutUser(page);
    await deleteUserAccount(TEST_EMAIL, TEST_PASSWORD);
  });

  test('Test 12: Unlimited credits account flow', async ({ page }) => {
    test.setTimeout(300000);

    await loginUser(page, UNLIMITED_EMAIL, UNLIMITED_PASSWORD);

    const initialCredits = await waitForCredits(page);
    expect(initialCredits).toBeGreaterThanOrEqual(900000);

    await navigateToWorkspace(page);

    const audioPath = path.join(process.cwd(), 'data/audio/1229.MP3');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"][accept*="mp3"], input[type="file"]').first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(audioPath);
    await page.waitForTimeout(2000);

    const voiceName = `TestVoice_${Date.now()}`;
    await page.fill('input[placeholder="输入音色名称"], input[placeholder*="音色名称"]', voiceName);
    await page.locator('button:has-text("开始克隆")').first().click();

    await expect(
      page.locator('div[class*="bg-white"][class*="rounded-2xl"]').filter({ hasText: voiceName }).first()
    ).toBeVisible({ timeout: 60000 });

    const creditsAfterClone = await waitForCredits(page);
    expect(creditsAfterClone).toBe(initialCredits);

    let voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    for (let i = 0; i < 30; i++) {
      const isTraining = await voiceCard.locator('text=正在克隆').isVisible().catch(() => false);
      if (!isTraining) {
        break;
      }
      await page.waitForTimeout(6000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await navigateToWorkspace(page);
      voiceCard = page.locator('div.group').filter({ hasText: voiceName }).first();
    }

    await voiceCard.click();
    await page.waitForTimeout(1000);

    const input1Path = path.join(process.cwd(), 'input_txt/input1.txt');
    const input1Text = readTextFile(input1Path);
    const input1ByteCount = Buffer.byteLength(input1Text, 'utf8');
    expect(input1ByteCount).toBe(711);

    const expectedDeduction1 = calculateCredits(input1Text);
    expect(expectedDeduction1).toBe(62);

    const textInput = page.locator('textarea[placeholder*="输入您想要合成的文本"]').first();
    await textInput.fill(input1Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();
    await page.waitForTimeout(3000);

    const creditsAfterFirst = await waitForCredits(page);
    expect(creditsAfterFirst).toBeGreaterThanOrEqual(900000);

    const input2Path = path.join(process.cwd(), 'input_txt/input2.txt');
    const input2Text = readTextFile(input2Path);
    const input2ByteCount = Buffer.byteLength(input2Text, 'utf8');
    expect(input2ByteCount).toBe(3614);

    const expectedDeduction2 = calculateCredits(input2Text);
    expect(expectedDeduction2).toBe(317);

    await textInput.fill(input2Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();
    await page.waitForTimeout(3000);

    const creditsAfterSecond = await waitForCredits(page);
    expect(creditsAfterSecond).toBeGreaterThanOrEqual(900000);

    const input3Path = path.join(process.cwd(), 'input_txt/input3.txt');
    const input3Text = readTextFile(input3Path);
    const input3ByteCount = Buffer.byteLength(input3Text, 'utf8');
    expect(input3ByteCount).toBe(5805);

    await textInput.fill(input3Text);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("开始生成音频"), button:has-text("开始生成")').first().click();
    await expect(page.locator('text=该输入过长')).toBeVisible({ timeout: 5000 });

    await logoutUser(page);
    await cleanupUserFiles(UNLIMITED_EMAIL, UNLIMITED_PASSWORD);
  });
});
