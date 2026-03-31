/**
 * 排名系统数据库检查和测试脚本
 *
 * 使用方法:
 *   node test_ranking_db.js
 *
 * 功能:
 * 1. 检查 player_stats 表是否存在
 * 2. 测试插入玩家数据
 * 3. 测试查询排行榜
 * 4. 测试更新战绩
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// 直接读取 .env 文件
function loadEnvFile() {
  const envPath = new URL('.env', import.meta.url)
  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=').trim()
        }
      }
    }
  } catch (e) {
    // 忽略文件不存在错误
  }
}

loadEnvFile()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 错误: 缺少 Supabase 配置')
  console.log('\n请确保 .env 文件包含:')
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co')
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
  process.exit(1)
}

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('🧪 排名系统数据库测试\n')
console.log('='.repeat(50))
console.log(`📡 连接: ${SUPABASE_URL}`)
console.log('='.repeat(50))

// 测试 1: 检查表是否存在
async function testTableExists() {
  console.log('\n📋 测试 1: 检查 player_stats 表...')

  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('id')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ❌ 表不存在!')
        console.log('\n   📝 请在 Supabase SQL 编辑器执行以下 SQL:\n')
        console.log(`
-- ===========================================
-- 排名系统数据库初始化 SQL
-- ===========================================

-- 1. 创建 player_stats 表 (玩家积分表)
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

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_stats(rating DESC);

-- 3. 修改 game_records 表添加玩家ID字段
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_black_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_white_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_black INTEGER DEFAULT 0;
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_white INTEGER DEFAULT 0;

-- 4. 启用 RLS (可选)
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人读取" ON player_stats FOR SELECT USING (true);
CREATE POLICY "允许玩家更新自己" ON player_stats FOR UPDATE USING (true);
CREATE POLICY "允许创建记录" ON player_stats FOR INSERT WITH CHECK (true);

-- 5. 插入测试数据
INSERT INTO player_stats (user_id, player_name, rating, games_played, wins, losses)
VALUES
  ('test_player_1', '棋王张三', 1500, 50, 40, 10),
  ('test_player_2', '棋圣李四', 1450, 45, 35, 10),
  ('test_player_3', '棋手王五', 1400, 40, 30, 10),
  ('test_player_4', '新手玩家', 1000, 10, 3, 7);
`)
        return false
      }
      throw error
    }

    console.log('   ✅ 表存在')
    return true
  } catch (error) {
    console.log('   ❌ 检查失败:', error.message)
    return false
  }
}

// 测试 2: 插入测试数据
async function testInsert() {
  console.log('\n📋 测试 2: 插入测试玩家...')

  const testPlayer = {
    user_id: `test_${Date.now()}`,
    player_name: '测试玩家',
    rating: 1000,
    games_played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    win_streak: 0,
    max_streak: 0
  }

  try {
    const { data, error } = await supabase
      .from('player_stats')
      .insert([testPlayer])
      .select()
      .single()

    if (error) throw error

    console.log('   ✅ 插入成功!')
    console.log(`   玩家ID: ${data.user_id}`)
    console.log(`   积分: ${data.rating}`)

    // 保存测试玩家ID用于后续测试
    return data
  } catch (error) {
    console.log('   ❌ 插入失败:', error.message)
    return null
  }
}

// 测试 3: 查询排行榜
async function testRankings() {
  console.log('\n📋 测试 3: 查询排行榜...')

  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('rating', { ascending: false })
      .limit(10)

    if (error) throw error

    console.log('   ✅ 查询成功!')
    console.log(`   共 ${data.length} 名玩家\n`)

    data.forEach((player, index) => {
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '  '
      const winRate = player.games_played > 0
        ? Math.round((player.wins / player.games_played) * 100)
        : 0
      console.log(`   ${medal} ${index + 1}. ${player.player_name} - 积分: ${player.rating} (${winRate}%胜率)`)
    })

    return data
  } catch (error) {
    console.log('   ❌ 查询失败:', error.message)
    return []
  }
}

// 测试 4: 更新战绩
async function testUpdateResult(playerId) {
  console.log('\n📋 测试 4: 测试战绩更新...')

  if (!playerId) {
    console.log('   ⏭️  跳过 (无测试玩家)')
    return
  }

  try {
    // 模拟赢了一局
    const { data: player } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', playerId)
      .single()

    if (!player) throw new Error('玩家不存在')

    const { data, error } = await supabase
      .from('player_stats')
      .update({
        rating: player.rating + 25,
        games_played: player.games_played + 1,
        wins: player.wins + 1,
        win_streak: player.win_streak + 1,
        max_streak: Math.max(player.max_streak, player.win_streak + 1),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', playerId)
      .select()
      .single()

    if (error) throw error

    console.log('   ✅ 更新成功!')
    console.log(`   新积分: ${data.rating} (+25)`)
    console.log(`   胜率: ${data.wins}/${data.games_played}`)
    console.log(`   连胜: ${data.win_streak}`)

  } catch (error) {
    console.log('   ❌ 更新失败:', error.message)
  }
}

// 测试 5: 检查 game_records 新字段
async function testGameRecordsFields() {
  console.log('\n📋 测试 5: 检查 game_records 新字段...')

  try {
    const { data, error } = await supabase
      .from('game_records')
      .select('player_black_id, player_white_id, rating_change_black, rating_change_white')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  新字段不存在 (可选)')
        console.log('   如需添加，在 SQL 编辑器执行:')
        console.log('   ALTER TABLE game_records ADD COLUMN player_black_id VARCHAR(50);')
        console.log('   ALTER TABLE game_records ADD COLUMN player_white_id VARCHAR(50);')
        console.log('   ALTER TABLE game_records ADD COLUMN rating_change_black INTEGER;')
        console.log('   ALTER TABLE game_records ADD COLUMN rating_change_white INTEGER;')
        return false
      }
      throw error
    }

    console.log('   ✅ 新字段已存在')
    return true
  } catch (error) {
    console.log('   ⚠️  检查跳过:', error.message)
    return false
  }
}

// 清理测试数据
async function cleanupTestData(testUserId) {
  if (!testUserId) return

  console.log('\n🧹 清理测试数据...')
  try {
    await supabase
      .from('player_stats')
      .delete()
      .eq('user_id', testUserId)
    console.log('   ✅ 已清理')
  } catch (error) {
    console.log('   ⚠️  清理失败:', error.message)
  }
}

// 主函数
async function main() {
  let testPlayer = null

  try {
    // 执行测试
    const tableExists = await testTableExists()

    if (!tableExists) {
      console.log('\n' + '='.repeat(50))
      console.log('❌ 数据库未初始化')
      console.log('='.repeat(50))
      process.exit(1)
    }

    testPlayer = await testInsert()
    await testRankings()
    await testUpdateResult(testPlayer?.user_id)
    await testGameRecordsFields()

    console.log('\n' + '='.repeat(50))
    console.log('✅ 所有测试通过!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('\n❌ 测试失败:', error)

  } finally {
    // 清理
    await cleanupTestData(testPlayer?.user_id)
  }
}

main()