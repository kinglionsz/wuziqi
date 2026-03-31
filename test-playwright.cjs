const { chromium } = require('playwright');

(async () => {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--remote-debugging-port=9222']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 收集控制台日志
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
  });

  try {
    console.log('访问页面 http://localhost:5174/');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('页面加载完成');

    // ===== 切换到 PVE 模式 =====
    console.log('\n=== 切换到 PVE 模式 ===');
    const pveButton = await page.locator('button:has-text("人机"), button:has-text("PVE")').first();
    if (await pveButton.isVisible()) {
      await pveButton.click();
      console.log('点击了 PVE 按钮');
      await page.waitForTimeout(500);
    }

    // ===== 进行落子 (只下3步，避免游戏结束) =====
    console.log('\n=== 进行落子 (PVE模式) ===');
    
    // 只点击3个位置
    const clickPositions = [
      { x: 7, y: 7 },   // 中央
      { x: 6, y: 7 },  // 左侧
      { x: 7, y: 6 },  // 上方
    ];

    for (let i = 0; i < clickPositions.length; i++) {
      const pos = clickPositions[i];
      console.log(`\n--- 第${i+1}次落子 (${pos.x}, ${pos.y}) ---`);
      
      const boardArea = await page.locator('.board').first();
      const boardBox = await boardArea.boundingBox();
      
      if (boardBox) {
        const cellSize = boardBox.width / 15;
        const clickX = boardBox.x + (pos.x * cellSize) + (cellSize / 2);
        const clickY = boardBox.y + (pos.y * cellSize) + (cellSize / 2);
        
        await page.mouse.click(clickX, clickY);
        console.log(`点击位置: (${clickX.toFixed(1)}, ${clickY.toFixed(1)})`);
        await page.waitForTimeout(1500);
      }
    }

    // ===== 进入回放模式 =====
    console.log('\n=== 进入回放模式 ===');
    
    // 先关闭可能弹出的胜利/失败模态框
    try {
      const closeButton = await page.locator('.modal-overlay button, .modal button').first();
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        console.log('关闭了弹窗');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('没有弹窗');
    }

    // 查找并点击回放按钮
    const replayButton = await page.locator('button:has-text("回放")').first();
    if (await replayButton.isVisible()) {
      await replayButton.click();
      console.log('点击了回放按钮');
      await page.waitForTimeout(1000);
    }

    // ===== 点击下一步按钮 =====
    console.log('\n=== 点击下一步按钮 ===');
    const nextButtons = await page.locator('button:has-text("下一步")').all();
    
    for (let i = 0; i < Math.min(5, nextButtons.length); i++) {
      const btn = nextButtons[i];
      if (await btn.isVisible()) {
        await btn.click();
        console.log(`点击了下一步按钮 ${i+1}`);
        await page.waitForTimeout(500);
      }
    }

    // ===== 输出完整日志对比 =====
    console.log('\n\n========== 完整控制台日志对比 ==========');
    
    console.log('\n>>> [落子] 相关日志:');
    const luuZiLogs = consoleLogs.filter(log => log.text.includes('[落子]'));
    console.log(`共 ${luuZiLogs.length} 条`);
    luuZiLogs.forEach(log => console.log(log.text));

    console.log('\n>>> [AI落子] 相关日志:');
    const aiLuuZiLogs = consoleLogs.filter(log => log.text.includes('[AI落子]'));
    console.log(`共 ${aiLuuZiLogs.length} 条`);
    aiLuuZiLogs.forEach(log => console.log(log.text));

    console.log('\n>>> [回放] 相关日志:');
    const huiFangLogs = consoleLogs.filter(log => log.text.includes('[回放]'));
    console.log(`共 ${huiFangLogs.length} 条`);
    huiFangLogs.forEach(log => console.log(log.text));

    console.log('\n测试完成！');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('测试出错:', error.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
})();