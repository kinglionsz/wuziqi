import { test, expect } from '@playwright/test';

/**
 * 五子棋游戏 E2E 测试
 * 测试线上环境: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173' ;

// 处理腾讯云安全验证页面的辅助函数
async function handleSecurityCheck(page) {
  console.log('🔍 开始处理安全验证页面...');

  try {
    // 等待页面初始加载
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // 尝试多种选择器来查找"继续访问"按钮
    const selectors = [
      // 腾讯云安全验证页面的常见选择器
      'button:has-text("继续访问")',
      'button:has-text("继续")',
      'a:has-text("继续访问")',
      'a:has-text("继续")',
      // 备用选择器
      'button:has-text("Verify")',
      'button:has-text("Continue")',
      'input[value="继续访问"]',
      '#tcaptcha_submit',
      'button.tcaptcha_submit',
      // 通用的按钮选择器
      'button.primary',
      'button[type="submit"]',
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click({ force: true });
          console.log(`✅ 点击了按钮: ${selector}`);
          clicked = true;
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (clicked) {
      // 等待页面跳转
      await page.waitForTimeout(5000);
      // 等待网络空闲
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }

    // 检查是否还有安全验证遮罩
    const overlaySelectors = [
      '.captcha-modal',
      '#tcaptcha',
      '[class*="captcha"]',
      '[class*="security"]',
      'iframe[src*="captcha"]',
    ];

    for (const selector of overlaySelectors) {
      try {
        const overlay = page.locator(selector).first();
        if (await overlay.isVisible({ timeout: 2000 })) {
          console.log(`⚠️ 检测到安全验证遮罩: ${selector}`);
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        // 继续
      }
    }

    // 最终等待页面加载完成
    await page.waitForTimeout(2000);
    console.log('✅ 安全验证页面处理完成');

  } catch (error) {
    console.log('⚠️ 安全验证处理出错:', error.message);
    await page.waitForTimeout(3000);
  }
}

test.describe('五子棋游戏 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {
    // 访问页面并处理安全验证
    await page.goto(BASE_URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await handleSecurityCheck(page);

    // 验证页面加载成功
    await page.waitForSelector('h1, .board, [class*="board"], button', { timeout: 30000 });
  });

  test('首页加载', async ({ page }) => {
    await page.waitForSelector('h1, .board, [class*="board"]', { timeout: 10000 });

    // 验证游戏模式按钮
    await expect(page.locator('button:has-text("双人对战")')).toBeVisible();
    await expect(page.locator('button:has-text("人机对战")')).toBeVisible();
    await expect(page.locator('button:has-text("在线对战")')).toBeVisible();
  });

  test('游戏控制按钮显示', async ({ page }) => {
    await expect(page.locator('button:has-text("重新开始")')).toBeVisible();
    await expect(page.locator('button:has-text("悔棋")')).toBeVisible();
    await expect(page.locator('button:has-text("设置")')).toBeVisible();
    await expect(page.locator('button:has-text("排名")')).toBeVisible();
    await expect(page.locator('button:has-text("规则")')).toBeVisible();
  });

  test('棋盘显示', async ({ page }) => {
    const board = page.locator('.board, [class*="board"]').first();
    await expect(board).toBeVisible();
  });

  test('设置模态框', async ({ page }) => {
    await page.click('button:has-text("设置")');
    await page.waitForSelector('[class*="modal"], .settings-modal', { timeout: 5000 });
    // 使用更精确的选择器 - 匹配模态框标题
    await expect(page.locator('h2:has-text("游戏设置")')).toBeVisible();
  });

  test('规则模态框', async ({ page }) => {
    await page.click('button:has-text("规则")');
    await page.waitForSelector('[class*="modal"], .rules-modal', { timeout: 5000 });
    await expect(page.locator('text=五子棋游戏规则')).toBeVisible();
  });

  test('排名模态框', async ({ page }) => {
    await page.click('button:has-text("排名")');
    await page.waitForSelector('[class*="modal"], .ranking-modal', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('PVP 模式落子', async ({ page }) => {
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(500);

    const board = page.locator('.board, [class*="board"]').first();
    const boardBox = await board.boundingBox();
    if (boardBox) {
      await page.mouse.click(boardBox.x + boardBox.width / 2, boardBox.y + boardBox.height / 2);
      await page.waitForTimeout(500);
    }
  });

  test('重新开始功能', async ({ page }) => {
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(500);

    const board = page.locator('.board, [class*="board"]').first();
    const box = await board.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }

    await page.click('button:has-text("重新开始")');
    await page.waitForTimeout(500);
  });

  test('悔棋功能', async ({ page }) => {
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(500);

    const board = page.locator('.board, [class*="board"]').first();
    const box = await board.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }

    const undoBtn = page.locator('button:has-text("悔棋")');
    if (await undoBtn.isEnabled().catch(() => false)) {
      await undoBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('在线对战-创建房间', async ({ page }) => {
    await page.click('button:has-text("在线对战")');
    await page.waitForSelector('[class*="modal"], .room-modal', { timeout: 5000 });

    const createBtn = page.locator('button:has-text("创建房间"), button:has-text("新建")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(3000);
    }
  });

  test('在线对战-加入房间', async ({ page }) => {
    await page.click('button:has-text("在线对战")');
    await page.waitForSelector('[class*="modal"], .room-modal', { timeout: 5000 });

    const joinTab = page.locator('button:has-text("加入房间")').first();
    if (await joinTab.isVisible().catch(() => false)) {
      await joinTab.click();
      await page.waitForTimeout(500);

      const roomInput = page.locator('input[placeholder*="房间"], input[type="text"]').first();
      if (await roomInput.isVisible().catch(() => false)) {
        await roomInput.fill('TEST123');
      }
    }
  });

  test('在线对战-观众模式', async ({ page }) => {
    await page.click('button:has-text("在线对战")');
    await page.waitForSelector('[class*="modal"], .room-modal', { timeout: 5000 });

    const spectateTab = page.locator('button:has-text("观众"), button:has-text("观战")').first();
    if (await spectateTab.isVisible().catch(() => false)) {
      await spectateTab.click();
      await page.waitForTimeout(500);
    }
  });
});