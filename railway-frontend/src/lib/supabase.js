import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端（单例模式）
let supabaseInstance = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// 导出默认客户端
export const supabase = getSupabaseClient()

/**
 * 保存游戏记录
 * @param {Object} record - 游戏记录
 * @returns {Promise<{data, error}>}
 */
export const saveGameRecord = async (record) => {
  const { data, error } = await supabase
    .from('game_records')
    .insert([{
      winner: record.winner,
      game_mode: record.gameMode,
      moves: record.moves,
      duration_seconds: record.durationSeconds,
      theme: record.theme,
      player_black: record.playerBlack,
      player_white: record.playerWhite,
      move_history: record.moveHistory
    }])
    .select()
  
  return { data, error }
}

/**
 * 获取游戏记录列表
 * @param {number} limit - 限制数量
 * @returns {Promise<{data, error}>}
 */
export const getGameRecords = async (limit = 50) => {
  const { data, error } = await supabase
    .from('game_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return { data, error }
}

/**
 * 创建在线对战房间
 * @param {string} roomCode - 房间代码
 * @returns {Promise<{data, error}>}
 */
export const createGameRoom = async (roomCode) => {
  const { data, error } = await supabase
    .from('game_rooms')
    .insert([{
      room_code: roomCode,
      status: 'waiting'
    }])
    .select()
  
  return { data, error }
}

/**
 * 根据房间代码获取房间信息
 * @param {string} roomCode - 房间代码
 * @returns {Promise<{data, error}>}
 */
export const getGameRoom = async (roomCode) => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .maybeSingle()
  
  return { data, error }
}

/**
 * 更新房间状态
 * @param {string} roomId - 房间ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<{data, error}>}
 */
export const updateGameRoom = async (roomId, updates) => {
  const { data, error } = await supabase
    .from('game_rooms')
    .update({
      ...updates,
      last_activity: new Date().toISOString()
    })
    .eq('id', roomId)
    .select()
  
  return { data, error }
}

/**
 * 订阅房间更新（实时功能）
 * @param {string} roomCode - 房间代码
 * @param {Function} callback - 回调函数
 * @returns {Object} - 订阅对象
 */
export const subscribeToRoom = (roomCode, callback) => {
  return supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `room_code=eq.${roomCode}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()
}

/**
 * 删除房间
 * @param {string} roomId - 房间ID
 * @returns {Promise<{error}>}
 */
export const deleteGameRoom = async (roomId) => {
  const { error } = await supabase
    .from('game_rooms')
    .delete()
    .eq('id', roomId)

  return { error }
}

// ============================================
// 排名系统 - Player Stats
// ============================================

/**
 * 获取或创建玩家
 * @param {string} userId - 用户ID (设备ID)
 * @param {string} playerName - 玩家名称
 * @returns {Promise<{data, error}>}
 */
export const getOrCreatePlayer = async (userId, playerName = null) => {
  // 先尝试获取现有玩家
  const { data: existing, error: getError } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return { data: existing, error: null }
  }

  // 如果不存在，创建新玩家
  const { data, error } = await supabase
    .from('player_stats')
    .insert([{
      user_id: userId,
      player_name: playerName || `玩家_${userId.slice(0, 6)}`,
      rating: 1000,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      win_streak: 0,
      max_streak: 0
    }])
    .select()
    .maybeSingle()

  return { data, error }
}

/**
 * 获取玩家积分信息
 * @param {string} userId - 用户ID
 * @returns {Promise<{data, error}>}
 */
export const getPlayerStats = async (userId) => {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle() // 使用 maybeSingle 替代 single，避免无数据时返回 406

  return { data, error }
}

/**
 * 更新玩家积分
 * @param {string} userId - 用户ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<{data, error}>}
 */
export const updatePlayerStats = async (userId, updates) => {
  const { data, error } = await supabase
    .from('player_stats')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle()

  return { data, error }
}

/**
 * 更新玩家战绩 (胜/负/平)
 * @param {string} userId - 用户ID
 * @param {string} result - 结果 ('win', 'loss', 'draw')
 * @param {number} ratingChange - 积分变化
 * @returns {Promise<{data, error}>}
 */
export const updatePlayerGameResult = async (userId, result, ratingChange) => {
  // 先获取当前数据
  const { data: current, error: getError } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (getError) return { data: null, error: getError }

  const updates = {
    rating: (current.rating || 1000) + ratingChange,
    games_played: (current.games_played || 0) + 1
  }

  if (result === 'win') {
    updates.wins = (current.wins || 0) + 1
    updates.win_streak = (current.win_streak || 0) + 1
    updates.max_streak = Math.max(current.max_streak || 0, updates.win_streak)
  } else if (result === 'loss') {
    updates.losses = (current.losses || 0) + 1
    updates.win_streak = 0
  } else if (result === 'draw') {
    updates.draws = (current.draws || 0) + 1
  }

  return updatePlayerStats(userId, updates)
}

/**
 * 获取排行榜
 * @param {number} limit - 返回数量
 * @returns {Promise<{data, error}>}
 */
export const getRankings = async (limit = 100) => {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit)

  return { data, error }
}

/**
 * 获取玩家排名
 * @param {string} userId - 用户ID
 * @returns {Promise<{rank, error}>}
 */
export const getPlayerRank = async (userId) => {
  // 获取所有高于当前玩家积分的玩家数量
  const { data: player, error: playerError } = await supabase
    .from('player_stats')
    .select('rating')
    .eq('user_id', userId)
    .maybeSingle()

  if (playerError || !player) {
    return { rank: null, error: playerError }
  }

  const { count, error: countError } = await supabase
    .from('player_stats')
    .select('*', { count: 'exact', head: true })
    .gt('rating', player.rating)

  if (countError) {
    return { rank: null, error: countError }
  }

  return { rank: count + 1, error: null }
}

/**
 * 更新玩家名称
 * @param {string} userId - 用户ID
 * @param {string} playerName - 新名称
 * @returns {Promise<{data, error}>}
 */
export const updatePlayerName = async (userId, playerName) => {
  return updatePlayerStats(userId, { player_name: playerName })
}
