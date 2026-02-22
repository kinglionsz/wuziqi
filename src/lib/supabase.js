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
    .single()
  
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
