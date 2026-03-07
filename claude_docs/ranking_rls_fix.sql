-- 排名系统 RLS 修复脚本
-- 解决 HTTP 406 错误

-- 1. 启用 RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all for player_stats" ON player_stats;
DROP POLICY IF EXISTS "Allow public read" ON player_stats;
DROP POLICY IF EXISTS "Allow public insert" ON player_stats;
DROP POLICY IF EXISTS "Allow public update" ON player_stats;

-- 3. 创建允许所有操作的策略
CREATE POLICY "Allow public access" ON player_stats
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. 同时禁用 RLS 作为备选方案（开发环境）
-- ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;

-- 5. 验证
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'player_stats';