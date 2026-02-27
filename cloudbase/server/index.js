/**
 * CloudBase 函数型云托管入口文件
 * 用于导出 main 函数
 */

// 重新导出 server.js 中的逻辑
import http from 'http'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'
import { 
  checkWinner, 
  checkDraw, 
  validateMove, 
  generateRoomId, 
  createRoom,
  BOARD_SIZE 
} from './utils/gameLogic.js'
import { 
  getRoom as dbGetRoom, 
  saveRoom as dbSaveRoom, 
  deleteRoom as dbDeleteRoom,
  initDatabase,
  setSocketEmitter
} from './utils/database.js'

// 创建 Express 应用
const app = express()
app.use(cors())

// 健康检查端点
app.get('/', (req, res) => {
  res.send('五子棋在线对战服务器 running')
})

// 数据库测试端点
app.get('/test-db', async (req, res) => {
  console.log('[测试端点] 开始数据库测试...')
  const results = {
    timestamp: new Date().toISOString(),
    env: {
      TCB_ENV_ID: process.env.TCB_ENV_ID || '(未设置)',
      TCB_FUNCTION_NAME: process.env.TCB_FUNCTION_NAME || '(未设置)',
      PORT: process.env.PORT || 3000
    },
    tests: []
  }
  
  try {
    // 测试1: 检查数据库模块
    results.tests.push({ name: '数据库模块加载', status: 'success', message: 'database.js 模块已加载' })
    
    // 测试2: 尝试初始化数据库
    const initResult = await initDatabase()
    results.tests.push({ 
      name: '数据库初始化', 
      status: initResult ? 'success' : 'warning', 
      message: initResult ? '数据库初始化成功' : '数据库初始化失败，将使用内存存储'
    })
    
    // 测试3: 尝试保存测试房间
    const testRoom = {
      roomId: 'TEST_' + Date.now(),
      players: {},
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentTurn: 'black',
      status: 'testing',
      spectators: [],
      winner: null,
      isDraw: false,
      startTime: null,
      moveHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    try {
      await dbSaveRoom(testRoom)
      results.tests.push({ name: '保存测试房间', status: 'success', message: `房间 ${testRoom.roomId} 保存成功` })
      
      // 测试4: 尝试读取房间
      const loadedRoom = await dbGetRoom(testRoom.roomId)
      if (loadedRoom) {
        results.tests.push({ name: '读取测试房间', status: 'success', message: `成功读取房间 ${loadedRoom.roomId}` })
        
        // 测试5: 删除测试房间
        await dbDeleteRoom(testRoom.roomId)
        results.tests.push({ name: '删除测试房间', status: 'success', message: '测试房间已清理' })
      } else {
        results.tests.push({ name: '读取测试房间', status: 'error', message: '无法读取保存的房间' })
      }
    } catch (saveError) {
      results.tests.push({ name: '保存测试房间', status: 'error', message: saveError.message })
    }
    
    results.overall = results.tests.every(t => t.status !== 'error') ? 'success' : 'partial'
    
  } catch (error) {
    results.tests.push({ name: '整体测试', status: 'error', message: error.message })
    results.overall = 'error'
  }
  
  console.log('[测试端点] 测试结果:', results.overall)
  res.json(results)
})

const httpServer = http.createServer(app)

// 获取端口
const PORT = process.env.PORT || 3000
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

// 创建 Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: ALLOWED_ORIGIN !== '*'
  }
})

console.log(`[配置] CORS origin: ${ALLOWED_ORIGIN}`)

// 设置数据库的 socket 发射器，用于向客户端发送数据库状态
setSocketEmitter(io)

// 房间存储
const rooms = {}
const socketToRoom = {}
const userToSocket = {} // userId -> socket.id 映射
const disconnectedUsers = {} // 断线用户缓冲区: userId -> { roomId, role, disconnectTime, timeoutId }
const disconnectTimeouts = {} // userId -> timeoutId 映射，用于取消清理定时器

const getRoomPlayers = (roomId) => {
  const room = rooms[roomId]
  if (!room) return []
  return Object.entries(room.players).map(([userId, data]) => ({
    userId,
    role: data.role,
    ready: data.ready,
    isDisconnected: data.isDisconnected || false
  }))
}

// 检查用户是否在断线缓冲区中
const getDisconnectedUser = (userId) => {
  const userInfo = disconnectedUsers[userId]
  if (!userInfo) return null
  
  // 检查是否超过60秒缓冲期
  const now = Date.now()
  if (now - userInfo.disconnectTime > 60000) {
    delete disconnectedUsers[userId]
    return null
  }
  return userInfo
}

// 清理断线缓冲区中的用户
const clearDisconnectedUser = (userId) => {
  delete disconnectedUsers[userId]
}

const isRoomFull = (roomId) => {
  const room = rooms[roomId]
  if (!room) return false
  // 只计算未断线的玩家
  return Object.values(room.players).filter(p => !p.isDisconnected).length >= 2
}

const getPlayerRole = (roomId, userId) => {
  const room = rooms[roomId]
  if (!room || !room.players[userId]) return null
  return room.players[userId].role
}

const getPlayerRoleBySocket = (roomId, socketId) => {
  const room = rooms[roomId]
  if (!room) return null
  // 通过 socket 查找对应的 userId
  const userId = Object.keys(room.players).find(uid => {
    const player = room.players[uid]
    return player.socketId === socketId
  })
  return userId ? room.players[userId].role : null
}

function sendError(socket, callback, errorMessage) {
  console.log(`[错误] ${errorMessage}`)
  if (callback) {
    callback({ success: false, error: errorMessage })
  } else {
    socket.emit('error', { error: errorMessage })
  }
}

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`[新连接] socketId: ${socket.id}`)
  
  // 用户身份验证和重连处理
  socket.on('authenticate', async (data, callback) => {
    const { userId, roomId } = data
    
    if (!userId) {
      callback({ success: false, error: '缺少用户ID' })
      return
    }
    
    // 存储 userId 和 socket 的映射
    socket.userId = userId
    userToSocket[userId] = socket.id
    
    console.log(`[用户认证] userId: ${userId}, socketId: ${socket.id}`)
    
    // 检查是否在断线缓冲区中
    const disconnectedInfo = getDisconnectedUser(userId)
    
    if (disconnectedInfo && rooms[disconnectedInfo.roomId]) {
      // 用户正在重连
      const room = rooms[disconnectedInfo.roomId]
      
      // 更新玩家的 socketId
      if (room.players[userId]) {
        room.players[userId].socketId = socket.id
        room.players[userId].isDisconnected = false
        socket.join(disconnectedInfo.roomId)
        socketToRoom[socket.id] = disconnectedInfo.roomId
        
        // 清理断线缓冲区
        clearDisconnectedUser(userId)
        
        // 清除断线清理定时器，防止已重连用户被清理
        if (disconnectTimeouts[userId]) {
          clearTimeout(disconnectTimeouts[userId])
          delete disconnectTimeouts[userId]
          console.log(`[取消清理定时器] userId: ${userId}`)
        }
        
        // 通知房间内其他玩家用户已重连，并发送最新房间状态
        socket.to(disconnectedInfo.roomId).emit('opponent_reconnected', {
          userId,
          role: disconnectedInfo.role,
          room: {
            roomId: room.roomId,
            status: room.status,
            currentTurn: room.currentTurn,
            board: room.board,
            players: getRoomPlayers(disconnectedInfo.roomId),
            winner: room.winner,
            isDraw: room.isDraw
          }
        })
        
        console.log(`[用户重连] userId: ${userId}, roomId: ${disconnectedInfo.roomId}`)
        
        callback({
          success: true,
          reconnected: true,
          roomId: disconnectedInfo.roomId,
          role: disconnectedInfo.role,
          room: {
            roomId: room.roomId,
            status: room.status,
            currentTurn: room.currentTurn,
            board: room.board,
            players: getRoomPlayers(disconnectedInfo.roomId),
            winner: room.winner,
            isDraw: room.isDraw
          }
        })
        return
      }
    }
    
    // 检查是否提供了房间号（尝试重新加入）
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      if (room.players[userId]) {
        // 用户原本就在这个房间中
        room.players[userId].socketId = socket.id
        room.players[userId].isDisconnected = false
        socket.join(roomId)
        socketToRoom[socket.id] = roomId
        
        console.log(`[用户恢复] userId: ${userId}, roomId: ${roomId}`)
        
        callback({
          success: true,
          reconnected: true,
          roomId,
          role: room.players[userId].role,
          room: {
            roomId: room.roomId,
            status: room.status,
            currentTurn: room.currentTurn,
            board: room.board,
            players: getRoomPlayers(roomId),
            winner: room.winner,
            isDraw: room.isDraw
          }
        })
        return
      }
    }
    
    callback({ success: true, reconnected: false })
  })

  socket.on('create_room', (data, callback) => {
    const userId = socket.userId || socket.id
    
    let roomId = generateRoomId(6)
    while (rooms[roomId]) {
      roomId = generateRoomId(6)
    }

    const room = createRoom(roomId, userId)
    rooms[roomId] = room
    
    // 使用 userId 作为 key 存储玩家信息
    room.players[userId] = { 
      role: 'black', 
      ready: true, 
      socketId: socket.id,
      isDisconnected: false
    }
    
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[房间创建] roomId: ${roomId}, 房主: ${userId} (${socket.id})`)

    // 立即返回响应，不等待数据库操作
    callback({ 
      success: true, 
      roomId, 
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn,
      userId
    })
    
    // 数据库保存改为后台异步执行，不阻塞响应
    dbSaveRoom(room).catch(err => {
      console.error('[数据库] 保存房间失败:', err.message)
    })
  })

  socket.on('join_room', (data, callback) => {
    const { roomId } = data
    const userId = socket.userId || socket.id
    const room = rooms[roomId]

    if (!room) {
      callback({ success: false, error: '房间不存在' })
      return
    }

    // 检查用户是否已经在房间中（重连）
    if (room.players[userId]) {
      room.players[userId].socketId = socket.id
      room.players[userId].isDisconnected = false
      socket.join(roomId)
      socketToRoom[socket.id] = roomId
      
      // 清除断线清理定时器
      if (disconnectTimeouts[userId]) {
        clearTimeout(disconnectTimeouts[userId])
        delete disconnectTimeouts[userId]
        console.log(`[取消清理定时器] userId: ${userId}`)
      }
      
      console.log(`[重新加入] userId: ${userId}, roomId: ${roomId}`)
      
      callback({ 
        success: true, 
        roomId, 
        role: room.players[userId].role,
        board: room.board,
        currentTurn: room.currentTurn,
        userId,
        reconnected: true
      })
      return
    }

    if (isRoomFull(roomId)) {
      callback({ success: false, error: '房间已满' })
      return
    }

    room.players[userId] = { 
      role: 'white', 
      ready: true, 
      socketId: socket.id,
      isDisconnected: false
    }
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    room.status = 'playing'
    room.startTime = Date.now()
    room.lastMoveStartTime = Date.now()  // 初始化计时器
    room.blackTime = 0  // 重置黑方时间
    room.whiteTime = 0  // 重置白方时间

    // 立即返回响应
    callback({ 
      success: true, 
      roomId, 
      role: 'white',
      board: room.board,
      currentTurn: room.currentTurn,
      userId
    })
    
    // 数据库保存后台异步执行
    dbSaveRoom(room).catch(err => {
      console.error('[数据库] 保存房间失败:', err.message)
    })

    io.to(roomId).emit('game_start', {
      roomId,
      currentTurn: room.currentTurn,
      players: getRoomPlayers(roomId)
    })
  })

  socket.on('place_piece', (data, callback) => {
    const { roomId, row, col } = data
    const userId = socket.userId || socket.id
    
    console.log(`[落子请求] roomId: ${roomId}, userId: ${userId}, 位置: (${row}, ${col})`)
    
    const room = rooms[roomId]

    const playerRole = getPlayerRole(roomId, userId)
    console.log(`[落子检查] playerRole: ${playerRole}, room.currentTurn: ${room?.currentTurn}, room.status: ${room?.status}`)

    if (!room) {
      sendError(socket, callback, '房间不存在')
      return
    }

    if (room.status !== 'playing') {
      sendError(socket, callback, '游戏未开始或已结束')
      return
    }

    if (!playerRole) {
      sendError(socket, callback, '您不在此房间中')
      return
    }

    if (room.currentTurn !== playerRole) {
      sendError(socket, callback, '还未轮到您落子')
      return
    }

    const validation = validateMove(row, col, room.board)
    if (!validation.valid) {
      sendError(socket, callback, validation.error)
      return
    }

    // 计算本步用时并更新累计时间
    if (room.lastMoveStartTime) {
      const timeSpent = Date.now() - room.lastMoveStartTime
      if (playerRole === 'black') {
        room.blackTime += timeSpent
      } else {
        room.whiteTime += timeSpent
      }
      console.log(`[计时] ${playerRole} 本步用时: ${timeSpent}ms, 黑方累计: ${room.blackTime}ms, 白方累计: ${room.whiteTime}ms`)
    }
    
    room.board[row][col] = playerRole
    room.moveHistory.push({
      player: playerRole,
      position: { row, col },
      timestamp: Date.now()
    })
    
    // 更新计时器起点为当前时间（为下一手准备）
    room.lastMoveStartTime = Date.now()

    console.log(`[落子] roomId: ${roomId}, 玩家: ${socket.id}, 角色: ${playerRole}, 位置: (${row}, ${col})`)

    if (checkWinner(room.board, row, col, playerRole)) {
      room.status = 'finished'
      room.winner = playerRole

      // 广播游戏结束（包含时间数据）
      io.to(roomId).emit('game_over', {
        winner: playerRole,
        lastMove: { row, col },
        board: room.board,
        // 传递最终时间数据（转换为秒）
        blackTime: Math.floor(room.blackTime / 1000),
        whiteTime: Math.floor(room.whiteTime / 1000),
        gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
      })

      if (callback) {
        callback({ success: true, gameOver: true, winner: playerRole })
      }
      
      // 后台异步保存到数据库
      dbSaveRoom(room).catch(err => {
        console.error('[数据库] 保存房间失败:', err.message)
      })
      return
    }

    if (checkDraw(room.board)) {
      room.status = 'finished'

      // 广播游戏结束（平局）
      io.to(roomId).emit('game_over', {
        winner: null,
        isDraw: true,
        board: room.board,
        // 传递最终时间数据（转换为秒）
        blackTime: Math.floor(room.blackTime / 1000),
        whiteTime: Math.floor(room.whiteTime / 1000),
        gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
      })

      if (callback) {
        callback({ success: true, gameOver: true, isDraw: true })
      }
      
      // 后台异步保存到数据库
      dbSaveRoom(room).catch(err => {
        console.error('[数据库] 保存房间失败:', err.message)
      })
      return
    }

    room.currentTurn = playerRole === 'black' ? 'white' : 'black'

    // 广播棋盘更新（不等待数据库，包含时间数据）
    io.to(roomId).emit('sync_board', {
      board: room.board,
      lastMove: { row, col, player: playerRole },
      currentTurn: room.currentTurn,
      // 传递时间数据（转换为秒）
      blackTime: Math.floor(room.blackTime / 1000),
      whiteTime: Math.floor(room.whiteTime / 1000),
      gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
    })

    if (callback) {
      callback({ success: true, gameOver: false })
    }
    
    // 后台异步保存到数据库
    dbSaveRoom(room).catch(err => {
      console.error('[数据库] 保存房间失败:', err.message)
    })
  })

  socket.on('disconnect', async () => {
    const roomId = socketToRoom[socket.id]
    const userId = socket.userId
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      
      // 通过 socket.id 找到对应的 userId
      const actualUserId = userId || Object.keys(room.players).find(uid => {
        return room.players[uid].socketId === socket.id
      })
      
      if (actualUserId && room.players[actualUserId]) {
        const playerRole = room.players[actualUserId].role
        
        // 标记为断线状态，但不立即删除
        room.players[actualUserId].isDisconnected = true
        
        // 存入断线缓冲区（60秒内可以重连）
        disconnectedUsers[actualUserId] = {
          roomId,
          role: playerRole,
          disconnectTime: Date.now()
        }
        
        // 延迟删除（60秒后），存储定时器ID以便取消
        const timeoutId = setTimeout(async () => {
          // 清除定时器记录
          delete disconnectTimeouts[actualUserId]
          
          const userInfo = disconnectedUsers[actualUserId]
          if (userInfo && userInfo.roomId === roomId) {
            // 检查用户是否已经重连（isDisconnected 为 false 表示已重连，不执行清理）
            if (room.players[actualUserId] && room.players[actualUserId].isDisconnected) {
              // 确认删除玩家
              delete room.players[actualUserId]
              delete disconnectedUsers[actualUserId]
              
              console.log(`[断线清理] userId: ${actualUserId}, roomId: ${roomId}`)

              if (room.status === 'playing') {
                io.to(roomId).emit('opponent_disconnected', {
                  role: playerRole,
                  message: '对手已断开连接'
                })
              }

              if (Object.keys(room.players).length === 0) {
                delete rooms[roomId]
                // 从数据库删除
                try {
                  await dbDeleteRoom(roomId)
                } catch (err) {
                  console.error('[数据库] 删除房间失败:', err.message)
                }
              } else {
                // 持久化到数据库
                try {
                  await dbSaveRoom(room)
                } catch (err) {
                  console.error('[数据库] 保存房间失败:', err.message)
                }
              }
            }
          }
        }, 60000) // 60秒缓冲期（给手机端更多重连时间）
        
        // 存储定时器ID，以便重连时取消
        disconnectTimeouts[actualUserId] = timeoutId
        
        // 立即通知对手（但房间仍然保留）
        if (room.status === 'playing') {
          io.to(roomId).emit('opponent_disconnected_pending', {
            role: playerRole,
            message: '对手暂时断开，等待重连...',
            reconnectTimeout: 60000
          })
        }
      }
      
      delete socketToRoom[socket.id]
      if (userId) {
        delete userToSocket[userId]
      }
    }

    console.log(`[断开连接] socketId: ${socket.id}, userId: ${userId}`)
  })

  socket.on('get_room_info', (data, callback) => {
    const { roomId } = data
    const room = rooms[roomId]
    
    if (!room) {
      if (callback) callback({ success: false, error: '房间不存在' })
      return
    }

    if (callback) {
      callback({
        success: true,
        room: {
          roomId: room.roomId,
          status: room.status,
          currentTurn: room.currentTurn,
          board: room.board,
          players: getRoomPlayers(roomId),
          winner: room.winner,
          moveHistory: room.moveHistory
        }
      })
    }
  })

  socket.on('leave_room', (data, callback) => {
    const roomId = socketToRoom[socket.id] || data.roomId
    const userId = socket.userId || socket.id
    
    if (!roomId || !rooms[roomId]) {
      if (callback) callback({ success: false, error: '您不在任何房间中' })
      return
    }

    const room = rooms[roomId]
    const isHost = room.players[userId]?.role === 'black'
    
    // 从断线缓冲区清理
    clearDisconnectedUser(userId)
    
    if (isHost) {
      io.to(roomId).emit('room_closed', { reason: '房主已离开房间' })
      setTimeout(() => {
        if (rooms[roomId]) {
          delete rooms[roomId]
        }
      }, 1000)
    } else {
      delete room.players[userId]
      
      const remainingPlayers = Object.values(room.players).filter(p => !p.isDisconnected)
      if (remainingPlayers.length === 1) {
        room.status = 'waiting'
        io.to(roomId).emit('opponent_left', { message: '对手已离开房间' })
      } else if (remainingPlayers.length === 0) {
        delete rooms[roomId]
      }
    }
    
    socket.leave(roomId)
    delete socketToRoom[socket.id]
    delete userToSocket[userId]
    
    if (callback) callback({ success: true })
  })

  socket.on('restart_game', (data, callback) => {
    const { roomId } = data
    const userId = socket.userId || socket.id
    const room = rooms[roomId]
    
    if (!room) {
      sendError(socket, callback, '房间不存在')
      return
    }

    const playerCount = Object.values(room.players).filter(p => !p.isDisconnected).length
    if (playerCount < 2) {
      sendError(socket, callback, '需要两名玩家才能重新开始')
      return
    }

    if (!room.players[userId]) {
      sendError(socket, callback, '您不在此房间中')
      return
    }

    room.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    room.currentTurn = 'black'
    room.status = 'playing'
    room.winner = null
    room.isDraw = false
    room.startTime = Date.now()
    room.lastMoveStartTime = Date.now()  // 重置计时器起点
    room.blackTime = 0  // 重置黑方时间
    room.whiteTime = 0  // 重置白方时间
    room.moveHistory = []

    io.to(roomId).emit('game_restarted', {
      board: room.board,
      currentTurn: room.currentTurn
    })

    if (callback) {
      callback({ success: true })
    }
  })
})

// 启动服务器
let server = null
let isFunctionMode = false

// CloudBase 函数型入口 (仅在函数型部署时使用)
// 容器型部署会直接执行后面的 httpServer.listen
export async function main(event, context) {
  isFunctionMode = true
  
  // 初始化数据库
  await initDatabase()

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: '五子棋服务器运行中'
  }
}

// 如果不是 CloudBase 函数型环境，则直接启动服务器（容器型部署或本地开发）
if (typeof process.env.TCB_FUNCTION_NAME === 'undefined') {
  httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`🎮 五子棋在线对战服务器已启动`)
    console.log(`📡 监听端口: ${PORT}`)
    
    // 初始化数据库
    await initDatabase()
  })
}

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('[服务器异常]', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[未处理的 Promise 拒绝]', reason)
})
