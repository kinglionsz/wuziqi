/**
 * 排名系统数据库初始化脚本
 * 执行 SQL 创建 player_stats 表和相关字段
 *
 * 使用方法:
 *   node init_ranking_db.js
 *
 * 注意: 需要在 .env 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 错误: 缺少环境变量')
  console.log('请在项目根目录创建 .env 文件，内容如下:')
  console.log('SUPABASE_URL=https://your-project.supabase.co')
  console.log('SUPABASE_SERVICE_KEY=your-service-role-key')
  process.exit(1)
}

// 创建 Supabase 客户端 (使用 service role key)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 读取 SQL 文件
const sqlFilePath = path.join(__dirname, '..', 'claude_docs', 'ranking_system.sql')
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')

// 分割 SQL 语句 (按分号分割，但保留分号)
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

async function executeSQL() {
  console.log('🚀 开始初始化排名系统数据库...\n')
  console.log('📋 SQL 文件:', sqlFilePath)
  console.log('📊 语句数量:', statements.length, '\n')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i]

    // 获取语句描述 (第一行注释)
    let description = sql.split('\n')[0].replace('--', '').trim() || `语句 ${i + 1}`

    try {
      // 使用 rpc 调用执行原始 SQL
      const { data, error } = await supabase.rpc('exec_sql', { query: sql })

      if (error) {
        // 如果 rpc 不存在，尝试直接执行
        console.log(`   尝试直接执行...`)
        const { error: directError } = await supabase.from('_exec').select('*')

        // 另一种方式：检查是否是特定错误
        if (error.message.includes('does not exist') && error.message.includes('rpc')) {
          console.log(`   ⚠️  RPC 不支持，将使用备选方案`)
        }

        console.log(`   ❌ ${description}`)
        console.log(`      错误: ${error.message}`)
        failCount++
      } else {
        console.log(`   ✅ ${description}`)
        successCount++
      }
    } catch (err) {
      console.log(`   ❌ ${description}`)
      console.log(`      异常: ${err.message}`)
      failCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 执行完成: 成功 ${successCount} 条, 失败 ${failCount} 条`)
  console.log('='.repeat(50))

  if (failCount > 0) {
    console.log('\n⚠️  部分语句执行失败，可能是权限问题或 RPC 未启用')
    console.log('请在 Supabase 控制台的 SQL 编辑器中手动执行以下 SQL:\n')
    console.log(sqlContent)
  }
}

// 备选方案：使用 fetch 直接调用 Supabase REST API
async function executeSQLViaREST() {
  console.log('🚀 开始初始化排名系统数据库...\n')
  console.log('📋 使用 REST API 直接执行 SQL\n')

  try {
    // 1. 创建 player_stats 表
    console.log('📝 创建 player_stats 表...')
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS player_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(50) UNIQUE NOT NULL,
        player_name VARCHAR(50),
        rating INTEGER DEFAULT 1000,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        win_streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: createTableSQL })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`   状态: ${response.status}`)
      console.log(`   响应: ${errorText}`)

      // 如果 RPC 不可用，使用表创建方式
      console.log('\n📝 使用直接表创建方式...')

      // 尝试通过 POST /rest/v1/player_stats 创建表 (这会失败但可以测试)
      const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/player_stats`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })

      if (testResponse.status === 404) {
        console.log('   表不存在，需要在 Supabase 控制台执行 SQL')
        console.log('\n❌ 无法自动创建表，请执行以下步骤:')
        console.log('1. 打开 Supabase 控制台 -> SQL 编辑器')
        console.log('2. 复制并执行 claude_docs/ranking_system.sql 文件内容')
        console.log('\n或使用以下简化 SQL:\n')
        console.log(sqlContent)
      } else {
        console.log('   ✅ 表已存在')
      }
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    console.log('\n⚠️  请在 Supabase 控制台手动执行 SQL:')
    console.log(sqlContent)
  }
}

// 简化的创建方式：逐个检查和创建
async function initTables() {
  console.log('🚀 排名系统数据库初始化\n')
  console.log('='.repeat(50))

  // 检查 player_stats 表是否存在
  console.log('\n1️⃣ 检查 player_stats 表...')
  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/player_stats?select=id&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  )

  if (checkResponse.status === 200) {
    console.log('   ✅ player_stats 表已存在')
  } else if (checkResponse.status === 404) {
    console.log('   ❌ player_stats 表不存在')
    console.log('   📝 请在 Supabase SQL 编辑器执行以下 SQL:\n')
    console.log(sqlContent)
    return false
  } else {
    console.log(`   ⚠️  检查失败: ${checkResponse.status}`)
    return false
  }

  // 检查 game_records 是否有新字段
  console.log('\n2️⃣ 检查 game_records 新字段...')
  const gameRecordsCheck = await fetch(
    `${SUPABASE_URL}/rest/v1/game_records?select=player_black_id&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  )

  if (gameRecordsCheck.status === 200) {
    console.log('   ✅ 新字段已存在')
  } else {
    console.log('   ❌ 需要添加新字段')
    console.log('   📝 请在 Supabase SQL 编辑器执行:\n')
    console.log(`
-- 添加玩家ID字段
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_black_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_white_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_black INTEGER DEFAULT 0;
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_white INTEGER DEFAULT 0;
`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✨ 检查完成')
  console.log('\n如需完整初始化，请复制以下 SQL 到 Supabase SQL 编辑器执行:\n')
  console.log('文件位置: claude_docs/ranking_system.sql')
  console.log('\n' + '='.repeat(50))

  return true
}

// 主函数
async function main() {
  console.log('🎯 Supabase 排名系统初始化工具\n')

  const result = await initTables()

  if (!result) {
    process.exit(1)
  }
}

main()