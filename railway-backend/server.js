/**
 * 五子棋在线对战服务器 - Railway 版本
 * 完整功能版本（断线重连、观众、计时器、排名）
 * 
 * 与 CloudBase 版本的区别：
 * - 移除 @cloudbase/node-sdk 依赖
 * - 仅使用内存存储（适合 Railway 容器部署）
 * - 保留所有游戏功能
 */

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

// 创建 Express 应用
const app = express()
app.use(cors())
app.use(express.json())

// 服务器启动时生成一个随机 token（用于简单的连接验证）
const SERVER_TOKEN = process.env.SERVER_TOKEN || `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 健康检查端点
app.get('/', (req, res) => {
  res.send('五子棋在线对战服务器 (Railway) 运行中')
})

// 健康检查端点（用于 Railway 健康检查）
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime()
  })
})

// 提供 token 给授权客户端
app.get('/api/token', (req, res) => {
  res.json({ token: SERVER_TOKEN, timestamp: Date.now() })
})

// 排名系统 API 端点
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

// 排行榜端点
app.get('/api/rankings', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: '排名服务未配置' })
  }

  try {
    const limit = parseInt(req.query.limit) || 100
    const response = await fetch(`${SUPABASE_URL}/rest/v1/player_stats?select=*&order=rating.desc&limit=${limit}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('[排名API] 获取排行榜失败:', error)
    res.status(500).json({ error: '获取排行榜失败' })
  }
})

// 获取玩家积分
app.get('/api/players/:userId/stats', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: '排名服务未配置' })
  }

  const { userId } = req.params

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/player_stats?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    )
    const data = await response.json()

    if (!data || data.length === 0) {
      return res.status(404).json({ error: '玩家不存在' })
    }

    res.json(data[0])
  } catch (error) {
    console.error('[排名API] 获取玩家积分失败:', error)
    res.status(500).json({ error: '获取玩家积分失败' })
  }
})

// 创建或更新玩家
app.post('/api/players', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: '排名服务未配置' })
  }

  const { userId, playerName } = req.body

  if (!userId) {
    return res.status(400).json({ error: '缺少 userId' })
  }

  try {
    const getResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/player_stats?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    )
    const existing = await getResponse.json()

    if (existing && existing.length > 0) {
      return res.json(existing[0])
    }

    const name = playerName || `玩家_${userId.slice(0, 6)}`
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/player_stats`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        player_name: name,
        rating: 1000,
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        win_streak: 0,
        max_streak: 0
      })
    })

    const newPlayer = await createResponse.json()
    res.status(201).json(newPlayer[0] || newPlayer)
  } catch (error) {
    console.error('[排名API] 创建玩家失败:', error)
    res.status(500).json({ error: '创建玩家失败' })
  }
})

// 更新玩家战绩
app.put('/api/players/:userId/result', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: '排名服务未配置' })
  }

  const { userId } = req.params
  const { result, ratingChange } = req.body

  if (!result || ratingChange === undefined) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  try {
    const getResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/player_stats?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    )
    const player = await getResponse.json()

    if (!player || player.length === 0) {
      return res.status(404).json({ error: '玩家不存在' })
    }

    const p = player[0]
    const updates = {
      rating: (p.rating || 1000) + ratingChange,
      games_played: (p.games_played || 0) + 1,
      updated_at: new Date().toISOString()
    }

    if (result === 'win') {
      updates.wins = (p.wins || 0) + 1
      updates.win_streak = (p.win_streak || 0) + 1
      updates.max_streak = Math.max(p.max_streak || 0, updates.win_streak)
    } else if (result === 'loss') {
      updates.losses = (p.losses || 0) + 1
      updates.win_streak = 0
    } else if (result === 'draw') {
      updates.draws = (p.draws || 0) + 1
    }

    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/player_stats?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      }
    )

    const updated = await updateResponse.json()
    res.json(updated[0] || updated)
  } catch (error) {
    console.error('[排名API] 更新战绩失败:', error)
    res.status(500).json({ error: '更新战绩失败' })
  }
})

const httpServer = http.createServer(app)

// 获取端口
const PORT = process.env.PORT || 3000

// CORS 配置
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : '')

if (process.env.NODE_ENV !== 'development' && !process.env.ALLOWED_ORIGIN) {
  console.warn('[安全警告] 未配置 ALLOWED_ORIGIN，CORS 将禁止所有跨域请求。')
}

// 创建 Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN || false,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

console.log(`[配置] CORS origin: ${ALLOWED_ORIGIN || '(禁止跨域)'}`)

// ============================================
// 内存存储（Railway 容器版本）
// ============================================
const rooms = {}
const socketToRoom = {}
const userToSocket = {}
const disconnectedUsers = {}
const disconnectTimeouts = {}

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

const getDisconnectedUser = (userId) => {
  const userInfo = disconnectedUsers[userId]
  if (!userInfo) return null
  
  const now = Date.now()
  if (now - userInfo.disconnectTime > 60000) {
    delete disconnectedUsers[userId]
    return null
  }
  return userInfo
}

const clearDisconnectedUser = (userId) => {
  delete disconnectedUsers[userId]
}

const isRoomFull = (roomId) => {
  const room = rooms[roomId]
  if (!room) return false
  return Object.values(room.players).filter(p => !p.isDisconnected).length >= 2
}

const getPlayerRole = (roomId, userId) => {
  const room = rooms[roomId]
  if (!room || !room.players[userId]) return null
  return room.players[userId].role
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
    const { userId, roomId, token } = data

    if (!userId) {
      callback({ success: false, error: '缺少用户 ID' })
      return
    }

    if (token && token !== SERVER_TOKEN) {
      console.warn(`[安全警告] Token 验证失败：${socket.id}`)
      callback({ success: false, error: '身份验证失败' })
      return
    }

    socket.userId = userId
    userToSocket[userId] = socket.id

    console.log(`[用户认证] userId: ${userId}, socketId: ${socket.id}`)

    const disconnectedInfo = getDisconnectedUser(userId)
    
    if (disconnectedInfo && rooms[disconnectedInfo.roomId]) {
      const room = rooms[disconnectedInfo.roomId]
      
      if (room.players[userId]) {
        room.players[userId].socketId = socket.id
        room.players[userId].isDisconnected = false
        socket.join(disconnectedInfo.roomId)
        socketToRoom[socket.id] = disconnectedInfo.roomId
        
        clearDisconnectedUser(userId)
        
        if (disconnectTimeouts[userId]) {
          clearTimeout(disconnectTimeouts[userId])
          delete disconnectTimeouts[userId]
        }

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
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      if (room.players[userId]) {
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
    
    room.players[userId] = { 
      role: 'black', 
      ready: true, 
      socketId: socket.id,
      isDisconnected: false
    }
    
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[房间创建] roomId: ${roomId}, 房主: ${userId}`)

    callback({ 
      success: true, 
      roomId, 
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn,
      userId
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

    if (room.players[userId]) {
      room.players[userId].socketId = socket.id
      room.players[userId].isDisconnected = false
      socket.join(roomId)
      socketToRoom[socket.id] = roomId
      
      if (disconnectTimeouts[userId]) {
        clearTimeout(disconnectTimeouts[userId])
        delete disconnectTimeouts[userId]
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
    room.lastMoveStartTime = Date.now()
    room.blackTime = 0
    room.whiteTime = 0

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

  // 观众加入房间
  socket.on('join_spectator', (data, callback) => {
    const { roomId } = data
    const userId = socket.userId || socket.id
    const room = rooms[roomId]

    if (!room) {
      if (callback) callback({ success: false, error: '房间不存在' })
      return
    }

    if (room.players[userId]) {
      if (callback) callback({ success: false, error: '您已经是玩家，无法以观众身份加入' })
      return
    }

    const existingSpectator = room.spectators.find(s => s.userId === userId)
    if (existingSpectator) {
      existingSpectator.socketId = socket.id
      socket.join(roomId)
      socketToRoom[socket.id] = roomId

      if (callback) callback({
        success: true,
        roomId,
        role: 'spectator',
        room: {
          roomId: room.roomId,
          status: room.status,
          currentTurn: room.currentTurn,
          board: room.board,
          players: getRoomPlayers(roomId),
          spectators: room.spectators,
          winner: room.winner,
          isDraw: room.isDraw,
          blackTime: Math.floor(room.blackTime / 1000),
          whiteTime: Math.floor(room.whiteTime / 1000),
          gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
        }
      })
      return
    }

    room.spectators.push({
      userId,
      socketId: socket.id,
      joinTime: Date.now()
    })

    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[观众加入] roomId: ${roomId}, 观众: ${userId}, 当前观众数: ${room.spectators.length}`)

    if (callback) callback({
      success: true,
      roomId,
      role: 'spectator',
      room: {
        roomId: room.roomId,
        status: room.status,
        currentTurn: room.currentTurn,
        board: room.board,
        players: getRoomPlayers(roomId),
        spectators: room.spectators,
        winner: room.winner,
        isDraw: room.isDraw,
        blackTime: Math.floor(room.blackTime / 1000),
        whiteTime: Math.floor(room.whiteTime / 1000),
        gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
      }
    })

    io.to(roomId).emit('spectator_joined', {
      userId,
      spectatorCount: room.spectators.length
    })
  })

  // 观众离开房间
  socket.on('leave_spectator', (data, callback) => {
    const { roomId } = data
    const userId = socket.userId || socket.id
    const room = rooms[roomId]

    if (!room) {
      if (callback) callback({ success: false, error: '房间不存在' })
      return
    }

    const spectatorIndex = room.spectators.findIndex(s => s.userId === userId)
    if (spectatorIndex === -1) {
      if (callback) callback({ success: false, error: '您不是该房间的观众' })
      return
    }

    room.spectators.splice(spectatorIndex, 1)
    socket.leave(roomId)
    delete socketToRoom[socket.id]

    console.log(`[观众离开] roomId: ${roomId}, 观众: ${userId}, 剩余观众数: ${room.spectators.length}`)

    if (callback) callback({ success: true })

    io.to(roomId).emit('spectator_left', {
      userId,
      spectatorCount: room.spectators.length
    })
  })

  socket.on('place_piece', (data, callback) => {
    const { roomId, row, col } = data
    const userId = socket.userId || socket.id
    
    console.log(`[落子请求] roomId: ${roomId}, userId: ${userId}, 位置: (${row}, ${col})`)

    const room = rooms[roomId]
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

    // 计时器逻辑
    if (room.lastMoveStartTime) {
      const timeSpent = Date.now() - room.lastMoveStartTime
      if (playerRole === 'black') {
        room.blackTime += timeSpent
      } else {
        room.whiteTime += timeSpent
      }
    }

    room.board[row][col] = playerRole
    room.moveHistory.push({
      player: playerRole,
      position: { row, col },
      timestamp: Date.now()
    })
    
    room.lastMoveStartTime = Date.now()

    console.log(`[落子] roomId: ${roomId}, 玩家: ${userId}, 角色: ${playerRole}, 位置: (${row}, ${col})`)

    if (checkWinner(room.board, row, col, playerRole)) {
      room.status = 'finished'
      room.winner = playerRole

      io.to(roomId).emit('game_over', {
        winner: playerRole,
        lastMove: { row, col },
        board: room.board,
        blackTime: Math.floor(room.blackTime / 1000),
        whiteTime: Math.floor(room.whiteTime / 1000),
        gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
      })

      if (callback) {
        callback({ success: true, gameOver: true, winner: playerRole })
      }
      return
    }

    if (checkDraw(room.board)) {
      room.status = 'finished'

      io.to(roomId).emit('game_over', {
        winner: null,
        isDraw: true,
        board: room.board,
        blackTime: Math.floor(room.blackTime / 1000),
        whiteTime: Math.floor(room.whiteTime / 1000),
        gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
      })

      if (callback) {
        callback({ success: true, gameOver: true, isDraw: true })
      }
      return
    }

    room.currentTurn = playerRole === 'black' ? 'white' : 'black'

    io.to(roomId).emit('sync_board', {
      board: room.board,
      lastMove: { row, col, player: playerRole },
      currentTurn: room.currentTurn,
      blackTime: Math.floor(room.blackTime / 1000),
      whiteTime: Math.floor(room.whiteTime / 1000),
      gameTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
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
      
      const actualUserId = userId || Object.keys(room.players).find(uid => {
        return room.players[uid].socketId === socket.id
      })
      
      if (actualUserId && room.players[actualUserId]) {
        const playerRole = room.players[actualUserId].role
        
        room.players[actualUserId].isDisconnected = true
        
        disconnectedUsers[actualUserId] = {
          roomId,
          role: playerRole,
          disconnectTime: Date.now()
        }
        
        const timeoutId = setTimeout(async () => {
          delete disconnectTimeouts[actualUserId]
          
          const userInfo = disconnectedUsers[actualUserId]
          if (userInfo && userInfo.roomId === roomId) {
            if (room.players[actualUserId] && room.players[actualUserId].isDisconnected) {
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
              }
            }
          }
        }, 60000)
        
        disconnectTimeouts[actualUserId] = timeoutId
        
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
          spectators: room.spectators,
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
    room.lastMoveStartTime = Date.now()
    room.blackTime = 0
    room.whiteTime = 0
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
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 五子棋在线对战服务器 (Railway) v2.1.0 已启动`)
  console.log(`📡 监听端口: ${PORT}`)
  console.log(`💾 存储模式: 内存存储（适合 Railway 容器部署）`)
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('[服务器异常]', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[未处理的 Promise 拒绝]', reason)
})
