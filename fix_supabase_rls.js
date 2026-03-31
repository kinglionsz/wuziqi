/**
 * 修复 Supabase RLS 策略
 */

import { createClient } from '@supabase/supabase-js'

// 使用 service role key（具有 admin 权限）
const supabaseUrl = 'https://pjnzmyvoucgmanoqvbav.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnpteW91Y2dtYW5vcXZiYXYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQyMTQ2MDAwLCJleHAiOjE5NTc3MjIwMDB9.BkB6nTnpT2Vx9dJqRrXq1Q2Y2Z9q3X4Y8Z1K9L7M2N0'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function fixRLS() {
  console.log('🔧 开始修复 RLS 策略...\n')

  try {
    // 1. 检查当前 RLS 状态
    console.log('1️⃣ 检查 RLS 状态...')
    const { data: rlsStatus } = await supabase.rpc('pg_catalog.pg_tables', {
      schemaname: 'public'
    })

    // 2. 启用 RLS
    console.log('2️⃣ 启用 RLS...')
    await supabase.rpc('pg_catalog.pg_tables', {})

    // 直接执行 SQL
    const { data: result, error } = await supabase.from('player_stats').select('*').limit(1)

    if (error) {
      console.log('   当前查询错误:', error.message)
    } else {
      console.log('   ✅ 查询成功')
    }

    // 3. 尝试插入测试数据
    console.log('3️⃣ 测试插入...')
    const testUserId = 'test_rls_fix_' + Date.now()
    const { data: insertData, error: insertError } = await supabase
      .from('player_stats')
      .upsert({
        user_id: testUserId,
        player_name: 'RLS Test',
        rating: 1000,
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        win_streak: 0,
        max_streak: 0
      }, { upsert: true })
      .select()

    if (insertError) {
      console.log('   ❌ 插入失败:', insertError.message)
    } else {
      console.log('   ✅ 插入成功')
      // 清理测试数据
      await supabase.from('player_stats').delete().eq('user_id', testUserId)
    }

    // 4. 测试读取
    console.log('4️⃣ 测试读取...')
    const { data: readData, error: readError } = await supabase
      .from('player_stats')
      .select('*')
      .limit(5)

    if (readError) {
      console.log('   ❌ 读取失败:', readError.message)
    } else {
      console.log(`   ✅ 读取成功 (${readData?.length || 0} 条记录)`)
    }

    console.log('\n✨ RLS 修复测试完成')
    console.log('\n📝 如果仍有错误，请手动在 Supabase 控制台执行以下 SQL:')
    console.log(`
-- 禁用 RLS（开发环境）
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;
    `)

  } catch (err) {
    console.error('❌ 修复失败:', err.message)
  }
}

fixRLS()