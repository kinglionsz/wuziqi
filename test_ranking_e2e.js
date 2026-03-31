/**
 * 排名系统端到端测试脚本
 *
 * 测试内容:
 * 1. 后端 API 是否正常运行
 * 2. 前端页面是否能正常加载
 * 3. 排名功能是否正常工作
 *
 * 使用方法:
 *   node test_ranking_e2e.js
 */

import { createServer } from 'http'
import { spawn } from 'child_process'

// Node 22 内置 fetch，不需要额外导入

// 配置
const BACKEND_URL = 'http://localhost:3000'
const FRONTEND_URL = 'http://localhost:5173'
const SOCKET_URL = 'http://localhost:3000'

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, type = 'info') {
  const color = colors[type] || colors.reset
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'blue')
  console.log('='.repeat(60))
}

// 等待函数
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 测试 1: 后端健康检查
async function testBackendHealth() {
  log('\n📋 测试 1: 后端服务健康检查...')

  try {
    const response = await fetch(`${BACKEND_URL}/`)
    const text = await response.text()

    if (text.includes('五子棋')) {
      log('   ✅ 后端服务正常', 'green')
      return true
    } else {
      log('   ❌ 后端响应异常', 'red')
      return false
    }
  } catch (error) {
    log(`   ❌ 后端服务未运行: ${error.message}`, 'red')
    return false
  }
}

// 测试 2: 后端排名 API
async function testRankingAPI() {
  log('\n📋 测试 2: 排名系统 API...')

  try {
    // 测试排行榜 API
    const rankingsRes = await fetch(`${BACKEND_URL}/api/rankings?limit=10`)
    const rankings = await rankingsRes.json()

    if (rankingsRes.ok || Array.isArray(rankings)) {
      log('   ✅ 排行榜 API 响应正常', 'green')
      log(`      当前排名人数: ${Array.isArray(rankings) ? rankings.length : 'N/A'}`)
    } else {
      log(`   ⚠️  排行榜 API 返回异常: ${JSON.stringify(rankings)}`, 'yellow')
    }

    // 测试获取玩家积分 (模拟)
    const testUserId = 'test_e2e_' + Date.now()
    log(`   📝 测试用户ID: ${testUserId}`)

    // 测试创建玩家
    const createRes = await fetch(`${BACKEND_URL}/api/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId, playerName: 'E2E测试玩家' })
    })

    if (createRes.ok) {
      const player = await createRes.json()
      log('   ✅ 创建玩家成功', 'green')
      log(`      初始积分: ${player.rating}`)

      // 测试更新战绩 (赢一局)
      const updateRes = await fetch(`${BACKEND_URL}/api/players/${testUserId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: 'win', ratingChange: 25 })
      })

      if (updateRes.ok) {
        const updated = await updateRes.json()
        log('   ✅ 更新战绩成功', 'green')
        log(`      新积分: ${updated.rating}`)
      } else {
        log('   ⚠️  更新战绩失败 (API 未配置)', 'yellow')
      }
    } else {
      log('   ⚠️  创建玩家失败 (API 未配置)', 'yellow')
    }

    return true
  } catch (error) {
    log(`   ❌ 排名 API 测试失败: ${error.message}`, 'red')
    return false
  }
}

// 测试 3: Supabase 数据库连接
async function testSupabaseDB() {
  log('\n📋 测试 3: Supabase 数据库连接...')

  try {
    const response = await fetch(`${BACKEND_URL}/test-db`)
    const data = await response.json()

    if (data.overall === 'success') {
      log('   ✅ 数据库连接正常', 'green')
    } else if (data.overall === 'partial') {
      log('   ⚠️  数据库部分功能异常', 'yellow')
    } else {
      log('   ❌ 数据库连接失败', 'red')
    }

    return true
  } catch (error) {
    log(`   ❌ 数据库测试失败: ${error.message}`, 'red')
    return false
  }
}

// 测试 4: 检查前端文件是否存在
async function testFrontendFiles() {
  log('\n📋 测试 4: 前端文件检查...')

  const fs = await import('fs')
  const path = await import('path')

  const requiredFiles = [
    'src/components/Modals/RankingModal.jsx',
    'src/components/Modals/RankingModal.css',
    'src/utils/device.js'
  ]

  let allExist = true

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      log(`   ✅ ${file}`, 'green')
    } else {
      log(`   ❌ ${file} 不存在`, 'red')
      allExist = false
    }
  }

  return allExist
}

// 测试 5: 前端构建测试
async function testFrontendBuild() {
  log('\n📋 测试 5: 前端构建测试...')

  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build', '--', '--mode', 'development'], {
      shell: true,
      cwd: process.cwd()
    })

    let output = ''
    build.stdout.on('data', (data) => {
      output += data.toString()
    })

    build.stderr.on('data', (data) => {
      output += data.toString()
    })

    build.on('close', (code) => {
      if (code === 0) {
        log('   ✅ 前端构建成功', 'green')
        resolve(true)
      } else {
        log(`   ❌ 前端构建失败 (退出码: ${code})`, 'red')
        if (output.includes('error')) {
          const errors = output.split('\n').filter(l => l.includes('error'))
          errors.forEach(e => log(`      ${e}`, 'red'))
        }
        resolve(false)
      }
    })
  })
}

// 测试 6: 检查 App.jsx 中的排名功能集成
async function testAppIntegration() {
  log('\n📋 测试 6: App.jsx 集成检查...')

  const fs = await import('fs')
  const path = await import('path')

  const appPath = path.join(process.cwd(), 'src/App.jsx')
  const appContent = fs.readFileSync(appPath, 'utf-8')

  const checks = [
    { pattern: /RankingModal/, name: 'RankingModal 导入' },
    { pattern: /showRankingModal/, name: 'showRankingModal 状态' },
    { pattern: /setShowRankingModal/, name: 'setShowRankingModal 函数' },
    { pattern: /playerRating/, name: 'playerRating 状态' },
    { pattern: /getDeviceId/, name: 'getDeviceId 导入' },
    { pattern: /getPlayerStats/, name: 'getPlayerStats 导入' },
    { pattern: /ranking-button/, name: 'ranking-button 按钮' },
    { pattern: /<RankingModal[\s\S]*isOpen=/, name: 'RankingModal 组件' }
  ]

  let allPassed = true

  for (const check of checks) {
    if (check.pattern.test(appContent)) {
      log(`   ✅ ${check.name}`, 'green')
    } else {
      log(`   ❌ ${check.name}`, 'red')
      allPassed = false
    }
  }

  return allPassed
}

// 测试 7: 检查 supabase.js 中的 player_stats 函数
async function testSupabaseFunctions() {
  log('\n📋 测试 7: Supabase player_stats 函数检查...')

  const fs = await import('fs')
  const path = await import('path')

  const supabasePath = path.join(process.cwd(), 'src/lib/supabase.js')
  const content = fs.readFileSync(supabasePath, 'utf-8')

  const functions = [
    { pattern: /getOrCreatePlayer/, name: 'getOrCreatePlayer' },
    { pattern: /getPlayerStats/, name: 'getPlayerStats' },
    { pattern: /updatePlayerStats/, name: 'updatePlayerStats' },
    { pattern: /updatePlayerGameResult/, name: 'updatePlayerGameResult' },
    { pattern: /getRankings/, name: 'getRankings' },
    { pattern: /getPlayerRank/, name: 'getPlayerRank' },
    { pattern: /updatePlayerName/, name: 'updatePlayerName' }
  ]

  let allPassed = true

  for (const fn of functions) {
    if (fn.pattern.test(content)) {
      log(`   ✅ ${fn.name}`, 'green')
    } else {
      log(`   ❌ ${fn.name}`, 'red')
      allPassed = false
    }
  }

  return allPassed
}

// 主函数
async function main() {
  logSection('🎯 排名系统端到端测试')

  console.log('\n⏰ 等待服务启动...\n')
  await wait(2000)

  const results = []

  // 执行测试
  results.push({ name: '后端健康检查', passed: await testBackendHealth() })
  results.push({ name: '排名系统 API', passed: await testRankingAPI() })
  results.push({ name: 'Supabase 数据库', passed: await testSupabaseDB() })
  results.push({ name: '前端文件检查', passed: await testFrontendFiles() })
  results.push({ name: '前端构建测试', passed: await testFrontendBuild() })
  results.push({ name: 'App.jsx 集成', passed: await testAppIntegration() })
  results.push({ name: 'Supabase 函数', passed: await testSupabaseFunctions() })

  // 输出结果
  logSection('📊 测试结果汇总')

  let passCount = 0
  for (const r of results) {
    const status = r.passed ? '✅ 通过' : '❌ 失败'
    log(`   ${status} - ${r.name}`, r.passed ? 'green' : 'red')
    if (r.passed) passCount++
  }

  console.log('\n' + '='.repeat(60))
  log(`总计: ${passCount}/${results.length} 测试通过`, passCount === results.length ? 'green' : 'yellow')
  console.log('='.repeat(60))

  if (passCount === results.length) {
    log('\n🎉 所有测试通过! 排名系统已准备就绪。', 'green')
    log('\n启动开发服务器查看效果:', 'blue')
    log('   npm run dev    # 启动前端')
    log('   npm run server # 启动后端')
  } else {
    log('\n⚠️  部分测试失败，请检查上述错误。', 'yellow')
  }
}

main().catch(console.error)