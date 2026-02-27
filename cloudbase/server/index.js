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
const disconnectedUsers = {} // 断线用户缓冲区: userId -> { roomId, role, disconnectTime }

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
  
  // 检查是否超过10秒缓冲期
  const now = Date.now()
  if (now - userInfo.disconnectTime > 10000) {
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

  socket.on('create_room', async (data, callback) => {
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

    // 持久化到数据库
    try {
      await dbSaveRoom(room)
    } catch (err) {
      console.error('[数据库] 保存房间失败:', err.message)
    }

    callback({ 
      success: true, 
      roomId, 
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn,
      userId
    })
  })

  socket.on('join_room', async (data, callback) => {
    const { roomId } = data
    const userId = socket.userId || socket.id
    let room = rooms[roomId]

    // 如果内存中没有房间，尝试从数据库加载
    if (!room) {
      console.log(`[数据库] 尝试从数据库加载房间: ${roomId}`)
      const dbRoom = await dbGetRoom(roomId)
      if (dbRoom) {
        room = dbRoom
        rooms[roomId] = room
        console.log(`[数据库] 房间加载成功: ${roomId}`)
      }
    }

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

    // 持久化到数据库
    try {
      await dbSaveRoom(room)
    } catch (err) {
      console.error('[数据库] 保存房间失败:', err.message)
    }

    callback({ 
      success: true, 
      roomId, 
      role: 'white',
      board: room.board,
      currentTurn: room.currentTurn,
      userId
    })

    io.to(roomId).emit('game_start', {
      roomId,
      currentTurn: room.currentTurn,
      players: getRoomPlayers(roomId)
    })
  })

  socket.on('place_piece', async (data, callback) => {
    const { roomId, row, col } = data
    const userId = socket.userId || socket.id
    let room = rooms[roomId]

    // 如果内存中没有房间，尝试从数据库加载
    if (!room) {
      console.log(`[数据库] 尝试从数据库加载房间: ${roomId}`)
      const dbRoom = await dbGetRoom(roomId)
      if (dbRoom) {
        room = dbRoom
        rooms[roomId] = room
      }
    }

    const playerRole = getPlayerRole(roomId, userId)

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

    room.board[row][col] = playerRole
    room.moveHistory.push({
      player: playerRole,
      position: { row, col },
      timestamp: Date.now()
    })

    console.log(`[落子] roomId: ${roomId}, 玩家: ${socket.id}, 角色: ${playerRole}, 位置: (${row}, ${col})`)

    if (checkWinner(room.board, row, col, playerRole)) {
      room.status = 'finished'
      room.winner = playerRole

      // 持久化到数据库
      try {
        await dbSaveRoom(room)
      } catch (err) {
        console.error('[数据库] 保存房间失败:', err.message)
      }

      io.to(roomId).emit('game_over', {
        winner: playerRole,
        lastMove: { row, col },
        board: room.board
      })

      if (callback) {
        callback({ success: true, gameOver: true, winner: playerRole })
      }
      return
    }

    if (checkDraw(room.board)) {
      room.status = 'finished'

      // 持久化到数据库
      try {
        await dbSaveRoom(room)
      } catch (err) {
        console.error('[数据库] 保存房间失败:', err.message)
      }

      io.to(roomId).emit('game_over', {
        winner: null,
        isDraw: true,
        board: room.board
      })

      if (callback) {
        callback({ success: true, gameOver: true, isDraw: true })
      }
      return
    }

    room.currentTurn = playerRole === 'black' ? 'white' : 'black'

    // 持久化到数据库
    try {
      await dbSaveRoom(room)
    } catch (err) {
      console.error('[数据库] 保存房间失败:', err.message)
    }

    io.to(roomId).emit('sync_board', {
      board: room.board,
      lastMove: { row, col, player: playerRole },
      currentTurn: room.currentTurn
    })

    if (callback) {
      callback({ success: true, gameOver: false })
    }
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
        
        // 存入断线缓冲区（10秒内可以重连）
        disconnectedUsers[actualUserId] = {
          roomId,
          role: playerRole,
          disconnectTime: Date.now()
        }
        
        // 延迟删除（10秒后）
        setTimeout(async () => {
          const userInfo = disconnectedUsers[actualUserId]
          if (userInfo && userInfo.roomId === roomId) {
            // 检查用户是否已经重连
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
        }, 10000) // 10秒缓冲期
        
        // 立即通知对手（但房间仍然保留）
        if (room.status === 'playing') {
          io.to(roomId).emit('opponent_disconnected_pending', {
            role: playerRole,
            message: '对手暂时断开，等待重连...',
            reconnectTimeout: 10000
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
    room.startTime = Date.now()
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
