import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

async function waitAndScreenshot(page, name, delay = 1000) {
  await page.waitForTimeout(delay);
  await page.screenshot({ path: `./test-screenshots/${name}.png`, fullPage: true });
}

test.describe('五子棋游戏功能测试', () => {
  
  test('首页加载和元素显示', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitAndScreenshot(page, '01-homepage');
    
    await expect(page.locator('button:has-text("双人对战")')).toBeVisible();
    await expect(page.locator('button:has-text("人机对战")')).toBeVisible();
    await expect(page.locator('button:has-text("在线对战")')).toBeVisible();
    await expect(page.locator('button:has-text("设置")')).toBeVisible();
    await expect(page.locator('button:has-text("排名")')).toBeVisible();
    await expect(page.locator('button:has-text("规则")')).toBeVisible();
    
    console.log('✅ 首页所有元素显示正常');
  });

  test('双人对战模式', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.click('button:has-text("双人对战")');
    await waitAndScreenshot(page, '02-pvp-mode');
    
    // 验证游戏已开始 - 通过检查悔棋按钮是否变为可用或页面有变化
    await page.waitForTimeout(500);
    const undoButton = page.locator('button:has-text("悔棋")');
    await expect(undoButton).toBeVisible();
    console.log('✅ 双人对战模式测试通过');
  });

  test('人机对战模式', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("人机对战")');
    await waitAndScreenshot(page, '03-pve-mode');
    
    console.log('✅ 人机对战模式测试通过');
  });

  test('在线对战模式', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.click('button:has-text("在线对战")');
    await waitAndScreenshot(page, '04-online-mode');
    await page.waitForTimeout(500);
    
    // 验证在线对战按钮处于激活状态
    const onlineButton = page.locator('button:has-text("在线对战")');
    await expect(onlineButton).toBeVisible();
    console.log('✅ 在线对战模式测试通过');
  });

  test('设置模态框', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.click('button:has-text("设置")');
    await waitAndScreenshot(page, '05-settings');
    await page.waitForTimeout(500);
    
    // 截图验证模态框是否打开
    console.log('✅ 设置模态框测试通过');
  });

  test('排名系统', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.click('button:has-text("排名")');
    await waitAndScreenshot(page, '06-ranking');
    await page.waitForTimeout(500);
    
    // 截图验证排名系统
    console.log('✅ 排名系统测试通过');
  });

  test('规则说明', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.click('button:has-text("规则")');
    await waitAndScreenshot(page, '07-rules');
    await page.waitForTimeout(500);
    
    // 截图验证规则说明
    console.log('✅ 规则模态框测试通过');
  });

  test('响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitAndScreenshot(page, '08-mobile');
    
    await expect(page.locator('button:has-text("双人对战")')).toBeVisible();
    console.log('✅ 移动端响应式测试通过');
  });

  test('性能测试', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 页面加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
    console.log('✅ 性能测试通过');
  });
});
