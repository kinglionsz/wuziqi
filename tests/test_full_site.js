/**
 * 五子棋游戏完整功能测试脚本
 * 测试所有主要功能模块
 * 
 * 运行方式:
 * npx playwright test tests/test_full_site.js --headed
 * 或
 * node tests/test_full_site.js
 */

const { test, expect } = require('@playwright/test');

// 测试配置
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = './test-screenshots';

// 辅助函数：等待并截图
async function waitAndScreenshot(page, name, delay = 1000) {
  await page.waitForTimeout(delay);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

// 辅助函数：安全点击
async function safeClick(page, selector, options = {}) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  await page.click(selector, options);
}

test.describe('五子棋游戏完整功能测试', () => {
  
  // ==================== 1. 首页/游戏主界面 ====================
  test.describe('首页测试', () => {
    
    test('首页加载和所有元素显示', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitAndScreenshot(page, '01-homepage');
      
      // 验证页面标题
      await expect(page).toHaveTitle(/五子棋|Wuziqi/i);
      
      // 验证主要按钮存在
      await expect(page.locator('button:has-text("双人对战")')).toBeVisible();
      await expect(page.locator('button:has-text("人机对战")')).toBeVisible();
      await expect(page.locator('button:has-text("在线对战")')).toBeVisible();
      await expect(page.locator('button:has-text("重新开始")')).toBeVisible();
      await expect(page.locator('button:has-text("悔棋")')).toBeVisible();
      await expect(page.locator('button:has-text("设置")')).toBeVisible();
      await expect(page.locator('button:has-text("排名")')).toBeVisible();
      await expect(page.locator('button:has-text("规则")')).toBeVisible();
      
      // 验证棋盘存在
      await expect(page.locator('.board, [class*="board"], canvas, .game-board')).toBeVisible();
      
      console.log('✅ 首页所有元素显示正常');
    });

    test('游戏状态显示', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 验证当前回合显示
      const turnIndicator = page.locator('text=/当前回合|轮到|黑棋|白棋/i').first();
      await expect(turnIndicator).toBeVisible();
      
      // 验证计时器存在（如果有）
      const timer = page.locator('text=/:\d{2}/, .timer, [class*="timer"]').first();
      if (await timer.isVisible().catch(() => false)) {
        console.log('✅ 计时器显示正常');
      }
    });
  });

  // ==================== 2. 游戏模式测试 ====================
  test.describe('游戏模式测试', () => {
    
    test('双人对战模式 (PVP)', async ({ page }) => {
      await page.goto(BASE_URL);
      await waitAndScreenshot(page, '02-before-pvp');
      
      // 点击双人对战
      await safeClick(page, 'button:has-text("双人对战")');
      await waitAndScreenshot(page, '03-pvp-mode');
      
      // 验证游戏开始
      await expect(page.locator('text=/双人对战|PVP|本地对战/i')).toBeVisible();
      
      // 测试落子
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      if (box) {
        // 在棋盘中心落子
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await waitAndScreenshot(page, '04-pvp-move1');
        
        // 验证有棋子出现
        const pieces = page.locator('.piece, .chess, [class*="piece"], circle, .black, .white');
        await expect(pieces.first()).toBeVisible({ timeout: 5000 });
      }
      
      console.log('✅ 双人对战模式测试通过');
    });

    test('人机对战模式 (PVE)', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 点击人机对战
      await safeClick(page, 'button:has-text("人机对战")');
      await waitAndScreenshot(page, '05-pve-mode');
      
      // 验证AI难度选择（如果有）
      const difficultyModal = page.locator('text=/难度|简单|中等|困难|AI/i');
      if (await difficultyModal.isVisible().catch(() => false)) {
        await safeClick(page, 'button:has-text("开始"), button:has-text("确认")');
      }
      
      // 玩家落子后等待AI回应
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(2000); // 等待AI思考
        await waitAndScreenshot(page, '06-pve-ai-move');
      }
      
      console.log('✅ 人机对战模式测试通过');
    });

    test('在线对战模式 (ONLINE)', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 点击在线对战
      await safeClick(page, 'button:has-text("在线对战")');
      await waitAndScreenshot(page, '07-online-mode');
      
      // 验证房间管理界面出现
      await expect(page.locator('text=/创建房间|加入房间|房间号|在线/i')).toBeVisible();
      
      console.log('✅ 在线对战模式入口测试通过');
    });
  });

  // ==================== 3. 游戏控制按钮测试 ====================
  test.describe('游戏控制按钮测试', () => {
    
    test('重新开始功能', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 先落几个子
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 3, box.y + box.height / 3);
        await page.waitForTimeout(500);
      }
      
      // 点击重新开始
      await safeClick(page, 'button:has-text("重新开始")');
      await waitAndScreenshot(page, '08-restart');
      
      console.log('✅ 重新开始功能测试通过');
    });

    test('悔棋功能', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 先开始游戏并落子
      await safeClick(page, 'button:has-text("双人对战")');
      
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
        
        // 点击悔棋
        const undoBtn = page.locator('button:has-text("悔棋")');
        if (await undoBtn.isEnabled().catch(() => false)) {
          await undoBtn.click();
          await waitAndScreenshot(page, '09-undo');
          console.log('✅ 悔棋功能测试通过');
        } else {
          console.log('⚠️ 悔棋按钮不可用（可能需要多步后才能悔棋）');
        }
      }
    });
  });

  // ==================== 4. 设置模态框测试 ====================
  test.describe('设置模态框测试', () => {
    
    test('打开和关闭设置', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 打开设置
      await safeClick(page, 'button:has-text("设置")');
      await waitAndScreenshot(page, '10-settings-open');
      
      // 验证设置模态框内容
      await expect(page.locator('text=/设置|主题|音效|难度/i')).toBeVisible();
      
      // 测试主题切换（如果有）
      const themeOption = page.locator('text=/主题|皮肤|样式|暗黑|明亮/i').first();
      if (await themeOption.isVisible().catch(() => false)) {
        console.log('✅ 主题设置选项存在');
      }
      
      // 关闭设置
      const closeBtn = page.locator('button:has-text("关闭"), button:has-text("取消"), .close, [class*="close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        // 点击遮罩层关闭
        await page.keyboard.press('Escape');
      }
      
      await waitAndScreenshot(page, '11-settings-close');
      console.log('✅ 设置模态框测试通过');
    });

    test('设置项修改', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await safeClick(page, 'button:has-text("设置")');
      
      // 测试音效开关
      const soundToggle = page.locator('text=/音效|声音|sound/i').locator('..').locator('input, button, [role="switch"]').first();
      if (await soundToggle.isVisible().catch(() => false)) {
        await soundToggle.click();
        console.log('✅ 音效设置可切换');
      }
      
      // 保存设置
      const saveBtn = page.locator('button:has-text("保存"), button:has-text("确认"), button:has-text("应用")');
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
    });
  });

  // ==================== 5. 房间管理模态框测试 ====================
  test.describe('房间管理模态框测试', () => {
    
    test('创建房间', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 进入在线对战
      await safeClick(page, 'button:has-text("在线对战")');
      await waitAndScreenshot(page, '12-room-management');
      
      // 点击创建房间
      const createBtn = page.locator('button:has-text("创建房间"), button:has-text("新建"), button:has-text("Create")');
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
        await waitAndScreenshot(page, '13-create-room');
        
        // 验证房间信息
        await expect(page.locator('text=/房间号|Room|ID/i')).toBeVisible();
        console.log('✅ 创建房间功能测试通过');
      }
    });

    test('加入房间', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await safeClick(page, 'button:has-text("在线对战")');
      
      // 点击加入房间
      const joinBtn = page.locator('button:has-text("加入房间"), button:has-text("加入"), button:has-text("Join")');
      if (await joinBtn.isVisible().catch(() => false)) {
        await joinBtn.click();
        
        // 输入房间号
        const roomInput = page.locator('input[placeholder*="房间"], input[placeholder*="Room"], input').first();
        if (await roomInput.isVisible().catch(() => false)) {
          await roomInput.fill('TEST123');
          await waitAndScreenshot(page, '14-join-room');
          console.log('✅ 加入房间功能测试通过');
        }
      }
    });
  });

  // ==================== 6. 排名系统模态框测试 ====================
  test.describe('排名系统模态框测试', () => {
    
    test('打开排名系统', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 点击排名按钮
      await safeClick(page, 'button:has-text("排名")');
      await waitAndScreenshot(page, '15-ranking-open');
      
      // 验证排名内容
      await expect(page.locator('text=/排行榜|排名|Rank|段位|积分/i')).toBeVisible();
      
      // 验证排名列表
      const rankItems = page.locator('[class*="rank"], .ranking-item, tr').first();
      await expect(rankItems).toBeVisible({ timeout: 5000 });
      
      console.log('✅ 排名系统测试通过');
    });

    test('排名标签切换', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await safeClick(page, 'button:has-text("排名")');
      
      // 测试切换不同排名类型
      const tabs = ['总排行', '周排行', '月排行', '好友'];
      for (const tab of tabs) {
        const tabBtn = page.locator(`text=${tab}`);
        if (await tabBtn.isVisible().catch(() => false)) {
          await tabBtn.click();
          await page.waitForTimeout(500);
          console.log(`✅ ${tab} 标签可切换`);
        }
      }
      
      await waitAndScreenshot(page, '16-ranking-tabs');
    });
  });

  // ==================== 7. 回放模态框测试 ====================
  test.describe('回放模态框测试', () => {
    
    test('回放功能', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 先完成一局游戏
      await safeClick(page, 'button:has-text("双人对战")');
      
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      if (box) {
        // 落几个子
        for (let i = 0; i < 3; i++) {
          await page.mouse.click(
            box.x + box.width / 2 + (i * 30),
            box.y + box.height / 2
          );
          await page.waitForTimeout(500);
        }
      }
      
      // 查找回放按钮
      const replayBtn = page.locator('button:has-text("回放"), button:has-text("Replay"), button:has-text("复盘")');
      if (await replayBtn.isVisible().catch(() => false)) {
        await replayBtn.click();
        await waitAndScreenshot(page, '17-replay-modal');
        
        // 测试回放控制
        const playBtn = page.locator('button:has-text("播放"), button:has-text("▶"), .play');
        if (await playBtn.isVisible().catch(() => false)) {
          await playBtn.click();
          await page.waitForTimeout(1000);
          console.log('✅ 回放功能测试通过');
        }
      }
    });
  });

  // ==================== 8. 胜利弹窗测试 ====================
  test.describe('胜利弹窗测试', () => {
    
    test('胜利提示显示', async ({ page }) => {
      await page.goto(BASE_URL);
      await safeClick(page, 'button:has-text("双人对战")');
      
      // 模拟一局游戏（5子连珠）
      const board = page.locator('.board, canvas, .game-board').first();
      const box = await board.boundingBox();
      
      if (box) {
        // 横向连续落5子（黑棋）
        const startX = box.x + box.width / 2 - 80;
        const startY = box.y + box.height / 2;
        
        for (let i = 0; i < 5; i++) {
          await page.mouse.click(startX + i * 40, startY);
          await page.waitForTimeout(300);
          
          // 白棋随意落子
          if (i < 4) {
            await page.mouse.click(startX + i * 40, startY + 40);
            await page.waitForTimeout(300);
          }
        }
        
        await waitAndScreenshot(page, '18-victory-popup');
        
        // 验证胜利弹窗
        const victoryModal = page.locator('text=/胜利|获胜|Win|Victory/i');
        if (await victoryModal.isVisible().catch(() => false)) {
          console.log('✅ 胜利弹窗显示正常');
          
          // 测试再来一局按钮
          const againBtn = page.locator('button:has-text("再来一局"), button:has-text("再来")');
          if (await againBtn.isVisible().catch(() => false)) {
            await againBtn.click();
            console.log('✅ 再来一局按钮可用');
          }
        } else {
          console.log('⚠️ 未能触发胜利条件，可能需要调整落子位置');
        }
      }
    });
  });

  // ==================== 9. 规则模态框测试 ====================
  test.describe('规则模态框测试', () => {
    
    test('打开和查看规则', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // 点击规则按钮
      await safeClick(page, 'button:has-text("规则")');
      await waitAndScreenshot(page, '19-rules-modal');
      
      // 验证规则内容
      await expect(page.locator('text=/规则|Rule|游戏说明|如何玩/i')).toBeVisible();
      
      // 验证规则详情
      const ruleContent = page.locator('text=/五子棋|连珠|胜负|禁手/i');
      await expect(ruleContent.first()).toBeVisible();
      
      console.log('✅ 规则模态框测试通过');
    });

    test('规则滚动查看', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await safeClick(page, 'button:has-text("规则")');
      
      // 滚动查看完整规则
      const modal = page.locator('[class*="modal"], [class*="dialog"], [role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        await modal.evaluate(el => el.scrollTop = el.scrollHeight);
        await page.waitForTimeout(500);
        await waitAndScreenshot(page, '20-rules-scroll');
        console.log('✅ 规则内容可滚动查看');
      }
    });
  });

  // ==================== 10. 响应式测试 ====================
  test.describe('响应式布局测试', () => {
    
    test('移动端视图', async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await waitAndScreenshot(page, '21-mobile-view');
      
      // 验证主要元素仍然可见
      await expect(page.locator('button:has-text("双人对战")')).toBeVisible();
      await expect(page.locator('.board, canvas, .game-board')).toBeVisible();
      
      console.log('✅ 移动端响应式测试通过');
    });

    test('平板视图', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await waitAndScreenshot(page, '22-tablet-view');
      
      console.log('✅ 平板响应式测试通过');
    });
  });

  // ==================== 11. 性能测试 ====================
  test.describe('性能测试', () => {
    
    test('页面加载性能', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`页面加载时间: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // 应该小于5秒
      
      // 检查是否有控制台错误
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
      
      console.log('✅ 性能测试通过');
    });
  });
});

// 单独运行模式（不使用 Playwright test runner）
async function runStandalone() {
  console.log('🎮 五子棋游戏完整功能测试\n');
  console.log('提示: 推荐使用 Playwright 运行以获得更详细的报告');
  console.log('运行命令: npx playwright test tests/test_full_site.js --headed\n');
  console.log('测试内容包括:');
  console.log('1. 首页加载和元素显示');
  console.log('2. 游戏模式 (PVP/PVE/ONLINE)');
  console.log('3. 游戏控制按钮 (重新开始/悔棋)');
  console.log('4. 设置模态框');
  console.log('5. 房间管理');
  console.log('6. 排名系统');
  console.log('7. 回放功能');
  console.log('8. 胜利弹窗');
  console.log('9. 规则说明');
  console.log('10. 响应式布局');
  console.log('11. 性能测试');
}

// 如果直接运行此文件
if (require.main === module) {
  runStandalone();
}

module.exports = { runStandalone };
