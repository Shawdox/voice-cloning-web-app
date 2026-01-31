import { test, expect } from "@playwright/test";
const USER_EMAIL = "xiaowu.417@qq.com";
const USER_PASSWORD = "1234qwer";
const BASE_URL = "http://localhost:3000";

async function loginUser(page: any, email: string, password: string) {
  const alreadyLoggedIn = await page.locator('span.material-symbols-outlined:has-text("payments")').isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyLoggedIn) {
    return;
  }

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

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

test.describe("Test 6: System Predefined Voices Display", () => {
  test("Predefined voices are displayed correctly", async ({ page }) => {
    test.setTimeout(120000);
    // Go to base URL
    await loginUser(page, USER_EMAIL, USER_PASSWORD);
    
    // Navigate to voice cloning page
    await page.locator("button:has-text(\"语音生成\")").first().click();
    await page.waitForTimeout(2000);
    const systemPresetTab = page.locator('button:has-text("系统预设")').first();
    if (await systemPresetTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await systemPresetTab.click();
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(2000);
    
    // Check if predefined voices section is visible
    const predefinedVoicesSection = page.locator('button:has-text("系统预设")').first();
    await expect(predefinedVoicesSection).toBeVisible({ timeout: 10000 });
    
    // Check expected voices are displayed
    const expectedVoices = ["郑翔洲", "AD学姐", "Energetic Male", "Friendly Women", "士道", "元気な女性", "韩男", "유라-기쁨-"];
    for (const voiceName of expectedVoices.slice(0, 3)) {
      const voice = page.locator("main").getByText(voiceName, { exact: false });
      await expect(voice).toBeVisible({ timeout: 5000 });
    }
    
    // Check first voice entry exists
    const firstVoice = page.locator("main").getByText(expectedVoices[0], { exact: false });
    await expect(firstVoice).toBeVisible({ timeout: 5000 });
  });
});
