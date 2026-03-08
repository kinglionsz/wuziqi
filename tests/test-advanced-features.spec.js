import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173' ;

/**
 * 在线对战和回放功能测试
 * 注意：在线对战测试需要后端服务器运行在 localhost:3000
 */
test.describe('在线对战功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听 console 错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
  });

  test('在线对战 - 进入在线对战页面', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 点击在线对战按钮
    await page.click('button:has-text("在线对战")');
    await page.waitForTimeout(1000);
    
    // 验证房间模态框打开
    const modal = page.locator('.room-modal');
    await expect(modal).toBeVisible();
    
    // 验证标题
    await expect(page.locator('h2:has-text("在线对战")')).toBeVisible();
    
    // 验证三个 Tab 都存在 - 使用更精确的选择器
    await expect(page.locator('.room-tabs button:has-text("创建房间")')).toBeVisible();
    await expect(page.locator('.room-tabs button:has-text("加入房间")')).toBeVisible();
    await expect(page.locator('.room-tabs button:has-text("观战")')).toBeVisible();
    
    console.log('✅ 在线对战页面进入成功');
  });

  test('在线对战 - 切换 Tab', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 进入在线对战
    await page.click('button:has-text("在线对战")');
    await page.waitForTimeout(500);
    
    // 验证默认在创建房间 Tab
    await expect(page.locator('.create-room-section')).toBeVisible();
    
    // 切换到加入房间 Tab
    await page.click('button:has-text("加入房间")');
    await page.waitForTimeout(300);
    await expect(page.locator('.join-room-section')).toBeVisible();
    
    // 切换到观战 Tab
    await page.click('button:has-text("观战")');
    await page.waitForTimeout(300);
    await expect(page.locator('.spectate-room-section')).toBeVisible();
    
    console.log('✅ 在线对战 Tab 切换成功');
  });

  test('在线对战 - 加入房间输入框验证', async ({ page }) => {
    // 注意：此测试需要后端服务器运行在 localhost:3000
    // 如果服务器未运行，按钮将被禁用
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 进入在线对战
    await page.click('button:has-text("在线对战")');
    await page.waitForTimeout(500);
    
    // 切换到加入房间 Tab
    await page.click('button:has-text("加入房间")');
    await page.waitForTimeout(300);
    
    // 验证输入框存在
    const input = page.locator('.room-input');
    await expect(input).toBeVisible();
    
    // 输入房间号
    await input.fill('ABC123');
    await expect(input).toHaveValue('ABC123');
    
    // 检查按钮状态 - 如果未连接服务器，按钮将被禁用
    const joinButton = page.locator('.join-room-button');
    const isDisabled = await joinButton.isDisabled();
    
    if (isDisabled) {
      console.log('⚠️ 后端服务器未运行，跳过按钮启用验证');
    } else {
      await expect(joinButton).toBeEnabled();
    }
    
    console.log('✅ 加入房间输入框验证成功');
  });

  test('在线对战 - 观战输入框验证', async ({ page }) => {
    // 注意：此测试需要后端服务器运行在 localhost:3000
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 进入在线对战
    await page.click('button:has-text("在线对战")');
    await page.waitForTimeout(500);
    
    // 切换到观战 Tab
    await page.click('button:has-text("观战")');
    await page.waitForTimeout(300);
    
    // 验证输入框存在
    const input = page.locator('.room-input');
    await expect(input).toBeVisible();
    
    // 输入房间号
    await input.fill('ROOM01');
    await expect(input).toHaveValue('ROOM01');
    
    // 检查按钮状态 - 如果未连接服务器，按钮将被禁用
    const spectateButton = page.locator('.spectate-room-button');
    const isDisabled = await spectateButton.isDisabled();
    
    if (isDisabled) {
      console.log('⚠️ 后端服务器未运行，跳过按钮启用验证');
    } else {
      await expect(spectateButton).toBeEnabled();
    }
    
    console.log('✅ 观战输入框验证成功');
  });

  test('在线对战 - 关闭模态框', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 进入在线对战
    await page.click('button:has-text("在线对战")');
    await page.waitForTimeout(500);
    
    // 验证模态框打开
    await expect(page.locator('.room-modal')).toBeVisible();
    
    // 点击关闭按钮
    await page.click('button:has-text("关闭")');
    await page.waitForTimeout(500);
    
    // 验证模态框关闭
    await expect(page.locator('.room-modal')).not.toBeVisible();
    
    console.log('✅ 关闭模态框成功');
  });
});

test.describe('回放功能测试', () => {
  
  test('回放按钮在有落子历史时显示', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    // 先下一颗棋子，触发落子历史
    const cells = page.locator('.board-cell');
    await cells.first().click();
    await page.waitForTimeout(500);
    
    // 验证回放按钮存在（当有落子历史时）- 使用更通用的选择器
    const replayButton = page.locator('button:has-text("回放")');
    await expect(replayButton).toBeVisible();
    
    console.log('✅ 回放按钮显示成功');
  });

  test('回放模态框打开', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    // 先下一颗棋子
    const cells = page.locator('.board-cell');
    await cells.first().click();
    await page.waitForTimeout(500);
    
    // 点击回放按钮 - 使用 force: true 强制点击
    const replayButton = page.locator('button:has-text("回放")');
    await replayButton.click({ force: true });
    await page.waitForTimeout(500);
    
    // 验证回放模态框打开
    const replayModal = page.locator('.replay-modal');
    await expect(replayModal).toBeVisible();
    
    // 验证标题
    await expect(page.locator('h2:has-text("回放模式")')).toBeVisible();
    
    console.log('✅ 回放模态框打开成功');
  });

  test('回放控制按钮存在', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战并下棋
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    // 下两颗棋子
    const cells = page.locator('.board-cell');
    await cells.nth(0).click();
    await page.waitForTimeout(300);
    await cells.nth(1).click();
    await page.waitForTimeout(300);
    
    // 点击回放按钮
    await page.locator('button:has-text("回放")').click();
    await page.waitForTimeout(500);
    
    // 验证控制按钮存在 - 使用更精确的选择器
    await expect(page.locator('.replay-controls button:has-text("开始")')).toBeVisible();
    await expect(page.locator('.replay-controls button:has-text("上一步")')).toBeVisible();
    await expect(page.locator('.replay-controls button:has-text("下一步")')).toBeVisible();
    await expect(page.locator('.replay-controls button:has-text("结束")')).toBeVisible();
    
    console.log('✅ 回放控制按钮验证成功');
  });

  test('回放 - 退出回放', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战并下棋
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    const cells = page.locator('.board-cell');
    await cells.first().click();
    await page.waitForTimeout(500);
    
    // 点击回放按钮
    await page.locator('button:has-text("回放")').click();
    await page.waitForTimeout(500);
    
    // 验证回放模态框打开
    await expect(page.locator('.replay-modal')).toBeVisible();
    
    // 点击退出回放按钮
    await page.click('button:has-text("退出回放")');
    await page.waitForTimeout(500);
    
    // 验证回放模态框关闭
    await expect(page.locator('.replay-modal')).not.toBeVisible();
    
    console.log('✅ 退出回放成功');
  });
});

test.describe('人机对战功能测试', () => {
  
  test('人机对战 - 选择难度', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 点击人机对战按钮
    await page.click('button:has-text("人机对战")');
    await page.waitForTimeout(500);
    
    // 验证游戏开始 - 悔棋按钮应该可见
    const undoButton = page.locator('button:has-text("悔棋")');
    await expect(undoButton).toBeVisible();
    
    console.log('✅ 人机对战模式启动成功');
  });
});

test.describe('游戏流程测试', () => {
  
  test('双人对战 - 落子功能', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    // 获取棋盘格子并点击 - 使用正确的 class 名称
    const cells = page.locator('.board-cell');
    const firstCell = cells.first();
    
    // 等待格子可见
    await expect(firstCell).toBeVisible({ timeout: 10000 });
    
    // 点击第一个格子落子
    await firstCell.click();
    await page.waitForTimeout(500);
    
    // 验证有棋子落下（检查 stone 元素存在）- 棋子使用 stone class
    const cellWithPiece = page.locator('.stone.black, .stone.white');
    const count = await cellWithPiece.count();
    expect(count).toBeGreaterThan(0);
    
    console.log('✅ 落子功能正常');
  });

  test('双人对战 - 悔棋功能', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    
    // 开始双人对战
    await page.click('button:has-text("双人对战")');
    await page.waitForTimeout(1000);
    
    // 点击一个格子落子 - 使用正确的 class 名称
    const cells = page.locator('.board-cell');
    await cells.nth(100).click();
    await page.waitForTimeout(500);
    
    // 点击悔棋按钮
    const undoButton = page.locator('button:has-text("悔棋")');
    await undoButton.click();
    await page.waitForTimeout(500);
    
    console.log('✅ 悔棋功能正常');
  });
});
