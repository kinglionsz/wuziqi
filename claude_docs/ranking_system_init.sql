-- ===========================================
-- 排名系统数据库初始化 SQL
-- 在 Supabase SQL 编辑器中执行
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

-- 2. 创建索引 (加快查询)
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_stats(rating DESC);

-- 3. 修改 game_records 表添加玩家ID字段
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_black_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_white_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_black INTEGER DEFAULT 0;
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_white INTEGER DEFAULT 0;

-- 4. 启用 RLS (可选，生产环境建议启用)
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略 (简化版：允许所有人读取和写入)
-- 读取策略
CREATE POLICY "player_stats_read_all" ON player_stats FOR SELECT USING (true);
-- 插入策略
CREATE POLICY "player_stats_insert_all" ON player_stats FOR INSERT WITH CHECK (true);
-- 更新策略 (允许更新自己的记录)
CREATE POLICY "player_stats_update_all" ON player_stats FOR UPDATE USING (true);

-- 6. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_stats_timestamp ON player_stats;
CREATE TRIGGER trigger_update_player_stats_timestamp
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_timestamp();

-- 7. 插入测试数据 (可选)
INSERT INTO player_stats (user_id, player_name, rating, games_played, wins, losses)
VALUES
  ('test_player_1', '棋王张三', 1500, 50, 40, 10),
  ('test_player_2', '棋圣李四', 1450, 45, 35, 10),
  ('test_player_3', '棋手王五', 1400, 40, 30, 10),
  ('test_player_4', '新手玩家', 1000, 10, 3, 7)
ON CONFLICT (user_id) DO NOTHING;