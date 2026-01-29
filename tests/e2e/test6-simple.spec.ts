import { test, expect } from "@playwright/test";
const USER_EMAIL = "xiaowu.417@qq.com";
const USER_PASSWORD = "1234qwer";
const BASE_URL = "http://localhost:3001";

test.describe("Test 6: System Predefined Voices Display", () => {
  test("Predefined voices are displayed correctly", async ({ page }) => {
    // Go to base URL
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    // Click login button
    const loginButton = page.locator("main").locator("button:has-text(\"登录 / 注册\")").first();
    await loginButton.click();
    
    // Wait for login modal to appear
    await page.waitForSelector("[role=\"dialog\"], .fixed", { timeout: 10000 });
    
    // Fill login form
    await page.fill("input[type=\"email\"]", USER_EMAIL);
    await page.fill("input[type=\"password\"]", USER_PASSWORD);
    
    // Submit login
    await page.click("button[type=\"submit\"]");
    
    // Wait for login to complete - stay on current page
    await page.waitForTimeout(10000);
    
    // Navigate to voice cloning page
    await page.locator("main").getByText("语音生成").first().click();
    await page.locator("main").getByText("声音克隆").first().click();
    await page.waitForTimeout(2000);
    
    // Check if predefined voices section is visible
    const predefinedVoicesSection = page.locator("main").getByText("系统预定义音色").first();
    await expect(predefinedVoicesSection).toBeVisible({ timeout: 10000 });
    
    // Check expected voices are displayed
    const expectedVoices = ["郑翔洲", "AD学姐", "Energetic Male", "Friendly Women", "士道", "元気な女性", "韩男", "유라-기쁨-"];
    for (const voiceName of expectedVoices.slice(0, 3)) {
      const voice = page.locator("main").getByText(voiceName, { exact: false });
      await expect(voice).toBeVisible({ timeout: 5000 });
    }
    
    // Check if first voice has play button
    const firstVoice = page.locator("main").getByText(expectedVoices[0], { exact: false }).locator("..");
    const playButton = firstVoice.locator("button:has([class*=\"play_arrow\"]), button:has(.material-symbols-outlined:has-text(\"play_arrow\"))").first();
    await expect(playButton).toBeVisible({ timeout: 2000 });
    
    // Check if first voice has download button
    const downloadButton = firstVoice.locator("button:has([class*=\"download\"]), button:has(.material-symbols-outlined:has-text(\"download\"))").first();
    if (await downloadButton.isVisible({ timeout: 2000 })) {
      console.log("Download button is visible");
    }
    
    // Check if first voice has clone/add button
    const addButton = firstVoice.locator("button:has([class*=\"add_circle\"]), button:has(.material-symbols-outlined:has-text(\"add\"))").first();
    await expect(addButton).toBeVisible({ timeout: 2000 });
    
    console.log("Test completed successfully");
  });
});
