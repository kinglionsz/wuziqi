/**
 * CloudBase 数据库存储模块
 * 用于持久化房间数据，防止容器重启导致数据丢失
 * 
 * 注意：可以通过 DISABLE_DB 环境变量禁用数据库功能
 */

import cloudbase from '@cloudbase/node-sdk'

// 是否启用数据库
const DB_ENABLED = true  // 启用数据库

let app, db
let dbInitFailed = false  // 数据库初始化失败标记
let io = null  // Socket.io 实例，用于向客户端发送数据库状态
const COLLECTION_NAME = 'wuziqi_rooms'

/**
 * 设置 Socket.io 实例，用于向客户端发送数据库状态
 */
export function setSocketEmitter(socketIO) {
  io = socketIO
  console.log('[数据库] Socket.io 实例已设置')
}

// 发送数据库状态到客户端
function emitDbStatus(type, message, data = {}) {
  if (io) {
    io.emit('db_status', { type, message, data, timestamp: Date.now() })
  }
}

/**
 * 后台保存房间（fire-and-forget）- 不阻塞游戏流程
 */
export function saveRoomBackground(room) {
  if (!DB_ENABLED) return
  
  // 不等待，直接在后台保存
  saveRoom(room).catch(err => {
    console.log('[数据库] 后台保存失败（已忽略）:', err.message)
  })
}

// 打印环境变量信息
function printEnvInfo() {
  console.log('[数据库] ========== 环境变量信息 ==========')
  console.log('[数据库] TCB_FUNCTION_NAME:', process.env.TCB_FUNCTION_NAME || '(未设置)')
  console.log('[数据库] TCB_ENV_ID:', process.env.TCB_ENV_ID || '(未设置)')
  console.log('[数据库] TCB_REGION:', process.env.TCB_REGION || '(未设置)')
  console.log('[数据库] DISABLE_DB:', process.env.DISABLE_DB || '(未设置，默认启用数据库)')
  console.log('[数据库] DB_ENABLED:', DB_ENABLED)
  console.log('[数据库] =================================')
}

// 延迟初始化 CloudBase
function getDb() {
  // 如果初始化已经失败过，直接返回 null
  if (dbInitFailed) {
    return null
  }
  
  if (!db && DB_ENABLED) {
    console.log('[数据库] 正在初始化 CloudBase SDK...')
    console.log('[数据库] 环境变量检查:')
    printEnvInfo()
    
    try {
      // 强制使用环境变量 TCB_ENV_ID，不再提供默认值
      // 在 CloudRun 环境中，环境变量会自动提供 TCB_ENV_ID 等信息
      const envId = process.env.TCB_ENV_ID

      if (!envId) {
        console.warn('[数据库] 警告：TCB_ENV_ID 未设置，将尝试使用内存存储')
        // 不初始化数据库，使用内存存储作为后备
        dbInitFailed = true
        return null
      }

      console.log('[数据库] 使用 envId:', envId)

      // 在 CloudBase 环境中，不需要传入 secretId/secretKey
      // SDK 会自动从环境变量 TCB_SECRET_ID, TCB_SECRET_KEY 获取凭证
      app = cloudbase.init({
        env: envId
      })
      db = app.database()
      console.log('[数据库] ✅ CloudBase SDK 初始化成功')
    } catch (e) {
      console.error('[数据库] ❌ CloudBase SDK 初始化失败!')
      console.error('[数据库] 错误:', e.message)
      if (e.message.includes('ENV_ID')) {
        console.error('[数据库] 💡 提示: 请在 CloudBase 控制台设置环境变量 TCB_ENV_ID')
      }
      // 标记初始化失败
      dbInitFailed = true
    }
  } else if (!DB_ENABLED) {
    console.log('[数据库] ⏭️  数据库功能已禁用（DISABLE_DB=true）')
  }
  return db
}

/**
 * 初始化数据库集合
 */
export async function initDatabase() {
  console.log('[数据库] ========== 开始初始化数据库 ==========')
  printEnvInfo()
  emitDbStatus('info', '开始初始化数据库...')
  
  if (!DB_ENABLED) {
    console.log('[数据库] ⏭️  数据库功能已禁用')
    emitDbStatus('disabled', '数据库功能已禁用')
    return true
  }
  
  const database = getDb()
  if (!database) {
    console.error('[数据库] ❌ 无法获取数据库实例!')
    console.error('[数据库] 可能原因:')
    console.error('[数据库]   1. CloudBase 环境变量未正确配置')
    console.error('[数据库]   2. 网络连接问题')
    console.error('[数据库]   3. SDK 初始化失败')
    console.log('[数据库] 💡 将使用内存存储（注意：容器重启后数据会丢失!）')
    return true
  }
  
  console.log('[数据库] 正在检查集合 wuziqi_rooms...')
  
  // 检查集合是否存在
  try {
    console.log('[数据库] 执行: 查询集合 (timeout: 10s)...')
    await database.collection(COLLECTION_NAME).limit(1).get()
    console.log('[数据库] ✅ 集合 wuziqi_rooms 已存在')
    return true
  } catch (error) {
    console.log('[数据库] ⚠️  集合不存在或查询失败，尝试创建...')
    console.log('[数据库] 错误信息:', error.message)
    
    // 检查是否是超时错误
    if (error.message.includes('longer than')) {
      console.log('[数据库] ⏰ 检测到超时错误，可能是:')
      console.log('[数据库]   - 冷启动导致首次请求慢')
      console.log('[数据库]   - 网络延迟')
      console.log('[数据库]   - CloudBase 服务端负载高')
    }
    
    // 检查是否是连接超时
    if (error.message.includes('ETIMEDOUT') || error.message.includes('connect')) {
      console.log('[数据库] 🌐 检测到连接错误!')
      console.log('[数据库] 可能原因:')
      console.log('[数据库]   1. 容器网络无法访问 CloudBase 服务')
      console.log('[数据库]   2. 防火墙/安全组阻止了出站连接')
      console.log('[数据库]   3. CloudBase 服务暂时不可用')
      console.log('[数据库] 💡 建议: 检查容器网络配置或稍后重试')
    }
    
    // 尝试创建集合
    try {
      console.log('[数据库] 执行: 创建集合 (timeout: 10s)...')
      await database.createCollection(COLLECTION_NAME)
      console.log('[数据库] ✅ 集合 wuziqi_rooms 创建成功!')
    } catch (createError) {
      console.error('[数据库] ❌ 创建集合失败!')
      console.error('[数据库] 错误:', createError.message)
      
      // 更详细的错误处理
      if (createError.message.includes('exists')) {
        console.log('[数据库] ℹ️  集合可能已存在，忽略此错误')
      } else if (createError.message.includes('longer than')) {
        console.log('[数据库] ⏰ 创建集合超时，可能是冷启动')
        console.log('[数据库] 💡 建议: 容器首次启动时可能需要预热')
      } else if (createError.message.includes('ETIMEDOUT') || createError.message.includes('connect')) {
        console.log('[数据库] 🌐 检测到连接超时!')
        console.log('[数据库] 可能原因:')
        console.log('[数据库]   1. 容器网络无法访问 CloudBase 服务')
        console.log('[数据库]   2. 防火墙/安全组阻止了出站连接')
        console.log('[数据库]   3. CloudBase 服务暂时不可用')
        console.log('[数据库] 💡 建议: 检查容器网络配置或稍后重试')
      } else if (createError.message.includes('permission') || createError.message.includes('权限')) {
        console.error('[数据库] 🔒 权限不足!')
        console.error('[数据库] 💡 提示: 请在 CloudBase 控制台检查数据库权限设置')
      } else {
        console.error('[数据库] 💡 未知错误，请检查 CloudBase 配置')
      }
      
      console.log('[数据库] 💡 将使用内存存储（注意：容器重启后数据会丢失!）')
    }
    
    // 标记数据库初始化失败，后续直接使用内存
    dbInitFailed = true
    return true
  }
}

/**
 * 从数据库获取房间
 */
export async function getRoom(roomId) {
  // 如果数据库初始化已失败，直接返回 null
  if (!DB_ENABLED || dbInitFailed) return null
  
  emitDbStatus('info', `正在查询房间: ${roomId}`)
  
  const database = getDb()
  if (!database) {
    emitDbStatus('error', '无法获取数据库实例')
    return null
  }
  
  try {
    const result = await database.collection(COLLECTION_NAME)
      .where({ roomId })
      .get()
    
    if (result.data && result.data.length > 0) {
      emitDbStatus('success', `找到房间: ${roomId}`)
      return result.data[0]
    }
    emitDbStatus('info', `房间不存在: ${roomId}`)
    return null
  } catch (error) {
    // 静默失败，但记录日志
    if (error.message.includes('longer than')) {
      console.log('[数据库] ⏰ 获取房间超时:', roomId)
      emitDbStatus('error', `获取房间超时: ${roomId}`)
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('connect')) {
      console.log('[数据库] 🌐 获取房间连接错误:', roomId)
      emitDbStatus('error', `连接数据库失败: ${roomId}`)
    }
    return null
  }
}

/**
 * 保存房间到数据库
 */
export async function saveRoom(room) {
  // 如果数据库初始化已失败，直接返回
  if (!DB_ENABLED || dbInitFailed) return true
  
  emitDbStatus('info', `正在保存房间: ${room.roomId}`)
  
  const database = getDb()
  if (!database) {
    emitDbStatus('error', '无法获取数据库实例')
    return true
  }
  
  const startTime = Date.now()
  
  try {
    console.log(`[数据库] 正在保存房间: ${room.roomId}...`)
    
    // 先删除旧记录
    const removeStart = Date.now()
    await database.collection(COLLECTION_NAME)
      .where({ roomId: room.roomId })
      .remove()
    console.log(`[数据库] 删除耗时: ${Date.now() - removeStart}ms`)
    
    // 插入新记录
    const addStart = Date.now()
    await database.collection(COLLECTION_NAME).add({
      ...room,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    console.log(`[数据库] 添加耗时: ${Date.now() - addStart}ms`)
    console.log(`[数据库] ✅ 保存房间成功: ${room.roomId}, 总耗时: ${Date.now() - startTime}ms`)
    emitDbStatus('success', `保存房间成功: ${room.roomId}, 耗时: ${Date.now() - startTime}ms`)
    return true
  } catch (error) {
    console.log(`[数据库] ❌ 保存房间失败: ${room.roomId}, 耗时: ${Date.now() - startTime}ms`)
    emitDbStatus('error', `保存房间失败: ${room.roomId}, 错误: ${error.message}`)
    // 静默失败
    if (error.message.includes('longer than')) {
      console.log('[数据库] ⏰ 保存房间超时:', room.roomId)
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('connect')) {
      console.log('[数据库] 🌐 保存房间连接错误:', room.roomId)
    }
    return true
  }
}

/**
 * 从数据库删除房间
 */
export async function deleteRoom(roomId) {
  // 如果数据库初始化已失败，直接返回
  if (!DB_ENABLED || dbInitFailed) return true
  
  emitDbStatus('info', `正在删除房间: ${roomId}`)
  
  const database = getDb()
  if (!database) {
    emitDbStatus('error', '无法获取数据库实例')
    return true
  }
  try {
    await database.collection(COLLECTION_NAME)
      .where({ roomId })
      .remove()
    return true
  } catch (error) {
    if (error.message.includes('longer than')) {
      console.log('[数据库] ⏰ 删除房间超时:', roomId)
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('connect')) {
      console.log('[数据库] 🌐 删除房间连接错误:', roomId)
    }
    return true
  }
}

/**
 * 获取所有房间
 */
export async function getAllRooms() {
  if (!DB_ENABLED) return []
  
  const database = getDb()
  if (!database) return []
  
  try {
    const result = await database.collection(COLLECTION_NAME).get()
    return result.data || []
  } catch (error) {
    return []
  }
}

/**
 * 清理过期房间
 */
export async function cleanExpiredRooms() {
  return 0
}
