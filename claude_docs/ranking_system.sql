-- 排名系统数据库脚本
-- 在 Supabase SQL 编辑器中执行

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

-- 2. 为 user_id 添加索引 (加快查询)
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_stats(rating DESC);

-- 3. 修改 game_records 表添加玩家ID字段
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_black_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS player_white_id VARCHAR(50);
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_black INTEGER DEFAULT 0;
ALTER TABLE game_records ADD COLUMN IF NOT EXISTS rating_change_white INTEGER DEFAULT 0;

-- 4. 启用 RLS (行级安全策略)
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略 (允许所有用户读取，玩家只能更新自己的数据)
CREATE POLICY "允许所有人读取玩家数据" ON player_stats FOR SELECT USING (true);
CREATE POLICY "允许玩家更新自己的数据" ON player_stats FOR UPDATE USING (auth.uid()::text = user_id);

-- 6. 创建一个函数用于更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 为 player_stats 添加自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_player_stats_updated_at ON player_stats;
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();