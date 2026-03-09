/**
 * 五子棋在线对战服务器
 * 部署平台: Railway / Render
 */

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

// ===== 游戏逻辑 =====
const BOARD_SIZE = 15
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]

function checkWinner(board, row, col, player) {
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + i * dx, c = col + i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }
    for (let i = 1; i < 5; i++) {
      const r = row - i * dx, c = col - i * dy
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++
      else break
    }
    if (count >= 5) return true
  }
  return false
}

function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== null))
}

function validateMove(row, col, board) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE)
    return { valid: false, error: '位置越界' }
  if (board[row][col] !== null)
    return { valid: false, error: '该位置已有棋子' }
  return { valid: true }
}

function generateRoomId(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function createRoom(roomId, socketId) {
  return {
    roomId,
    players: { [socketId]: { role: 'black', ready: false } },
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentTurn: 'black',
    status: 'waiting',
    moveHistory: []
  }
}

// ===== Express + Socket.io =====
const app = express()
app.use(cors())

// 健康检查
app.get('/', (req, res) => res.send('OK'))
app.get('/health', (req, res) => res.json({ status: 'ok' }))

const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

console.log(`[配置] 端口: ${PORT}`)

// ===== 房间存储 =====
const rooms = {}
const socketToRoom = {}

// ===== Socket.io 处理 =====
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`)

  socket.on('create_room', (data, callback) => {
    let roomId = generateRoomId(6)
    while (rooms[roomId]) roomId = generateRoomId(6)

    const room = createRoom(roomId, socket.id)
    rooms[roomId] = room
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[创建房间] ${roomId}`)
    callback?.({ success: true, roomId, role: 'black', board: room.board, currentTurn: 'black' })
  })

  socket.on('join_room', ({ roomId }, callback) => {
    const room = rooms[roomId]
    if (!room) return callback?.({ success: false, error: '房间不存在' })
    if (Object.keys(room.players).length >= 2) return callback?.({ success: false, error: '房间已满' })

    room.players[socket.id] = { role: 'white', ready: true }
    room.status = 'playing'
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[加入房间] ${roomId}`)
    callback?.({ success: true, roomId, role: 'white', board: room.board, currentTurn: room.currentTurn })
    io.to(roomId).emit('game_start', { currentTurn: 'black' })
  })

  socket.on('place_piece', ({ roomId, row, col }, callback) => {
    const room = rooms[roomId]
    const role = room?.players[socket.id]?.role

    if (!room) return callback?.({ success: false, error: '房间不存在' })
    if (room.status !== 'playing') return callback?.({ success: false, error: '游戏未开始' })
    if (!role) return callback?.({ success: false, error: '您不在此房间' })
    if (room.currentTurn !== role) return callback?.({ success: false, error: '还未轮到您' })

    const validation = validateMove(row, col, room.board)
    if (!validation.valid) return callback?.({ success: false, error: validation.error })

    room.board[row][col] = role
    room.moveHistory.push({ player: role, position: { row, col }, timestamp: Date.now() })

    if (checkWinner(room.board, row, col, role)) {
      room.status = 'finished'
      io.to(roomId).emit('game_over', { winner: role, board: room.board })
      return callback?.({ success: true, gameOver: true, winner: role })
    }

    if (checkDraw(room.board)) {
      room.status = 'finished'
      io.to(roomId).emit('game_over', { isDraw: true, board: room.board })
      return callback?.({ success: true, gameOver: true, isDraw: true })
    }

    room.currentTurn = role === 'black' ? 'white' : 'black'
    io.to(roomId).emit('sync_board', { board: room.board, currentTurn: room.currentTurn })
    callback?.({ success: true, gameOver: false })
  })

  socket.on('leave_room', ({ roomId }, callback) => {
    const room = rooms[roomId]
    if (room) {
      const isHost = room.players[socket.id]?.role === 'black'
      delete room.players[socket.id]
      if (isHost) {
        io.to(roomId).emit('room_closed', { reason: '房主离开' })
        delete rooms[roomId]
      } else if (Object.keys(room.players).length === 1) {
        room.status = 'waiting'
        io.to(roomId).emit('opponent_left', { message: '对手离开' })
      }
    }
    delete socketToRoom[socket.id]
    socket.leave(roomId)
    callback?.({ success: true })
  })

  socket.on('restart_game', ({ roomId }, callback) => {
    const room = rooms[roomId]
    if (!room || Object.keys(room.players).length < 2) {
      return callback?.({ success: false, error: '需要两名玩家' })
    }
    room.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    room.currentTurn = 'black'
    room.status = 'playing'
    room.moveHistory = []
    io.to(roomId).emit('game_restarted', { board: room.board, currentTurn: 'black' })
    callback?.({ success: true })
  })

  socket.on('disconnect', () => {
    const roomId = socketToRoom[socket.id]
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      if (room.players[socket.id]) {
        delete room.players[socket.id]
        if (room.status === 'playing') {
          io.to(roomId).emit('opponent_disconnected', { message: '对手断开连接' })
        }
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId]
        }
      }
      delete socketToRoom[socket.id]
    }
    console.log(`[断开] ${socket.id}`)
  })
})

// ===== 启动 =====
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('🎮 五子棋在线对战服务器已启动')
  console.log(`📡 端口: ${PORT}`)
  console.log('========================================')
})