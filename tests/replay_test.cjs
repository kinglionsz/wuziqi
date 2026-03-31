const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台日志
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[落子]') || text.includes('[AI落子]') || text.includes('[回放]')) {
      console.log(text);
    }
  });

  try {
    console.log('=== 访问游戏页面 ===');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

    // 切换到 PVE 模式
    console.log('=== 切换到PVE模式 ===');
    await page.click('button:has-text("人机对战")');
    await page.waitForTimeout(500);

    // 进行落子
    console.log('=== 开始落子测试 ===');
    
    // 第1步：黑棋(7,7)
    await page.click('.board-cell:nth-child(8):nth-of-type(8)');
    await page.waitForTimeout(500);
    
    // 第3步：黑棋(7,6)
    await page.click('.board-cell:nth-child(8):nth-of-type(7)');
    await page.waitForTimeout(500);
    
    // 第5步：黑棋(6,7)
    await page.click('.board-cell:nth-child(7):nth-of-type(8)');
    await page.waitForTimeout(500);

    console.log('=== 落子完成，开始回放 ===');
    
    // 点击回放按钮
    await page.click('button:has-text("回放")');
    await page.waitForTimeout(1000);

    // 点击下一步
    console.log('=== 回放测试 - 点击下一步 ===');
    await page.click('button:has-text("下一步")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("下一步")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("下一步")');
    await page.waitForTimeout(500);

    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('测试错误:', error);
  } finally {
    await browser.close();
  }
})();
