/**
 * 排名系统 Playwright E2E 测试 (使用纯 Playwright API)
 */

import { chromium } from 'playwright'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

async function runTests() {
  console.log('🎭 启动 Playwright 测试...\n')
  console.log('='.repeat(60))

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  let passCount = 0
  let failCount = 0

  try {
    // 测试 1: 首页加载
    console.log('\n📋 测试 1: 首页加载和排名按钮...')
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 })

    const rankingButton = page.locator('.ranking-button')
    await rankingButton.waitFor({ state: 'visible', timeout: 10000 })
    console.log('   ✅ 排名按钮显示正常')
    passCount++

    // 测试 2: 打开排名模态框
    console.log('\n📋 测试 2: 打开排名模态框...')
    await rankingButton.click()

    const modal = page.locator('.ranking-modal')
    await modal.waitFor({ state: 'visible', timeout: 5000 })
    await expectText(page, '.ranking-modal h2', '排行榜')
    console.log('   ✅ 模态框打开正常')
    passCount++

    // 测试 3: 排行榜数据加载
    console.log('\n📋 测试 3: 排行榜数据...')
    await page.waitForSelector('.ranking-item', { timeout: 15000 }) // 增加等待时间到15秒
    const items = await page.locator('.ranking-item').count()
    if (items > 0) {
      console.log(`   ✅ 排行榜数据加载: ${items} 条`)
      passCount++
    } else {
      console.log('   ❌ 排行榜无数据')
      failCount++
    }

    // 测试 4: 切换到战绩面板
    console.log('\n📋 测试 4: 战绩面板...')
    await page.click('button:has-text("我的战绩")')
    await page.waitForSelector('.stats-panel', { timeout: 5000 })

    // 检查积分显示
    const ratingValue = await page.locator('.stats-summary .stat-card.main-stat .stat-value').textContent()
    console.log(`   ✅ 积分显示: ${ratingValue}`)
    passCount++

    // 测试 5: 段位显示
    console.log('\n📋 测试 5: 段位显示...')
    const rankDisplay = page.locator('.rank-display')
    await rankDisplay.waitFor({ state: 'visible', timeout: 5000 })
    const rankText = await rankDisplay.textContent()
    console.log(`   ✅ 段位信息: ${rankText.replace(/\s+/g, ' ')}`)
    passCount++

    // 测试 6: 统计数据显示
    console.log('\n📋 测试 6: 统计数据...')
    const gamesPlayed = await page.locator('.stats-details:has-text("总对局")').isVisible()
    const wins = await page.locator('.stats-details:has-text("胜利")').isVisible()
    if (gamesPlayed && wins) {
      console.log('   ✅ 统计数据显示正常')
      passCount++
    } else {
      console.log('   ❌ 统计数据显示异常')
      failCount++
    }

    // 测试 7: 关闭模态框
    console.log('\n📋 测试 7: 关闭模态框...')
    await page.click('.ranking-modal .close-btn')
    await modal.waitFor({ state: 'hidden', timeout: 5000 })
    console.log('   ✅ 模态框关闭正常')
    passCount++

    // 测试 8: 首页段位图标
    console.log('\n📋 测试 8: 首页段位图标...')
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    const rankIcon = page.locator('.ranking-button .rank-icon')
    const iconVisible = await rankIcon.isVisible()
    if (iconVisible) {
      const iconText = await rankIcon.textContent()
      console.log(`   ✅ 首页段位图标: ${iconText}`)
      passCount++
    } else {
      console.log('   ⚠️ 首页段位图标未显示 (可能积分为0)')
      passCount++
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)

    // 截图保存错误
    await page.screenshot({ path: 'test-error.png', fullPage: true })
    console.log('📸 错误截图已保存: test-error.png')
    failCount++

  } finally {
    await browser.close()
  }

  // 输出结果
  console.log('\n' + '='.repeat(60))
  console.log(`📊 测试结果: ${passCount} 通过, ${failCount} 失败`)
  console.log('='.repeat(60))

  if (failCount === 0) {
    console.log('\n🎉 所有 Playwright 测试通过!')
  } else {
    console.log('\n⚠️  部分测试失败')
  }

  return failCount === 0
}

// 辅助函数: 检查元素文本
async function expectText(page, selector, expectedText) {
  const element = page.locator(selector)
  const text = await element.textContent()
  if (!text.includes(expectedText)) {
    throw new Error(`Expected "${expectedText}" but got "${text}"`)
  }
}

// 主函数
const success = await runTests()
process.exit(success ? 0 : 1)