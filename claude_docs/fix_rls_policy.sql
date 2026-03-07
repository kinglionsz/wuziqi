-- 修复 player_stats 表的 RLS 策略
-- 在 Supabase SQL 编辑器中执行

-- 删除现有策略
DROP POLICY IF EXISTS "player_stats_read" ON player_stats;
DROP POLICY IF EXISTS "player_stats_insert" ON player_stats;
DROP POLICY IF EXISTS "player_stats_update" ON player_stats;

-- 重新创建策略 (允许所有操作)
-- 读取策略 - 允许所有人读取
CREATE POLICY "player_stats_read" ON player_stats FOR SELECT USING (true);

-- 插入策略 - 允许插入
CREATE POLICY "player_stats_insert" ON player_stats FOR INSERT WITH CHECK (true);

-- 更新策略 - 允许更新
CREATE POLICY "player_stats_update" ON player_stats FOR UPDATE USING (true);

-- 删除策略 - 允许删除
CREATE POLICY "player_stats_delete" ON player_stats FOR DELETE USING (true);