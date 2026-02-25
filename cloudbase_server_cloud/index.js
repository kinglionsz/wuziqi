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

// 房间存储
const rooms = {}
const socketToRoom = {}

const getRoomPlayers = (roomId) => {
  const room = rooms[roomId]
  if (!room) return []
  return Object.entries(room.players).map(([socketId, data]) => ({
    socketId,
    role: data.role,
    ready: data.ready
  }))
}

const isRoomFull = (roomId) => {
  const room = rooms[roomId]
  if (!room) return false
  return Object.keys(room.players).length >= 2
}

const getPlayerRole = (roomId, socketId) => {
  const room = rooms[roomId]
  if (!room || !room.players[socketId]) return null
  return room.players[socketId].role
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

  socket.on('create_room', (data, callback) => {
    let roomId = generateRoomId(6)
    while (rooms[roomId]) {
      roomId = generateRoomId(6)
    }

    const room = createRoom(roomId, socket.id)
    rooms[roomId] = room
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[房间创建] roomId: ${roomId}, 房主: ${socket.id}`)

    callback({ 
      success: true, 
      roomId, 
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn
    })
  })

  socket.on('join_room', (data, callback) => {
    const { roomId } = data
    const room = rooms[roomId]

    if (!room) {
      callback({ success: false, error: '房间不存在' })
      return
    }

    if (isRoomFull(roomId)) {
      callback({ success: false, error: '房间已满' })
      return
    }

    room.players[socket.id] = { role: 'white', ready: true }
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    room.status = 'playing'
    room.startTime = Date.now()

    callback({ 
      success: true, 
      roomId, 
      role: 'white',
      board: room.board,
      currentTurn: room.currentTurn
    })

    io.to(roomId).emit('game_start', {
      roomId,
      currentTurn: room.currentTurn,
      players: getRoomPlayers(roomId)
    })
  })

  socket.on('place_piece', (data, callback) => {
    const { roomId, row, col } = data
    const room = rooms[roomId]
    const playerRole = getPlayerRole(roomId, socket.id)

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

    io.to(roomId).emit('sync_board', {
      board: room.board,
      lastMove: { row, col, player: playerRole },
      currentTurn: room.currentTurn
    })

    if (callback) {
      callback({ success: true, gameOver: false })
    }
  })

  socket.on('disconnect', () => {
    const roomId = socketToRoom[socket.id]
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      
      if (room.players[socket.id]) {
        const playerRole = room.players[socket.id].role
        delete room.players[socket.id]

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
      
      delete socketToRoom[socket.id]
    }

    console.log(`[断开连接] socketId: ${socket.id}`)
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
    const roomId = socketToRoom[socket.id]
    
    if (!roomId || !rooms[roomId]) {
      if (callback) callback({ success: false, error: '您不在任何房间中' })
      return
    }

    const room = rooms[roomId]
    const isHost = room.players[socket.id]?.role === 'black'
    
    if (isHost) {
      io.to(roomId).emit('room_closed', { reason: '房主已离开房间' })
      setTimeout(() => {
        if (rooms[roomId]) {
          delete rooms[roomId]
        }
      }, 1000)
    } else {
      delete room.players[socket.id]
      
      const remainingPlayers = Object.keys(room.players)
      if (remainingPlayers.length === 1) {
        room.status = 'waiting'
        io.to(roomId).emit('opponent_left', { message: '对手已离开房间' })
      } else if (remainingPlayers.length === 0) {
        delete rooms[roomId]
      }
    }
    
    socket.leave(roomId)
    delete socketToRoom[socket.id]
    
    if (callback) callback({ success: true })
  })

  socket.on('restart_game', (data, callback) => {
    const { roomId } = data
    const room = rooms[roomId]
    
    if (!room) {
      sendError(socket, callback, '房间不存在')
      return
    }

    const playerCount = Object.keys(room.players).length
    if (playerCount < 2) {
      sendError(socket, callback, '需要两名玩家才能重新开始')
      return
    }

    if (!room.players[socket.id]) {
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

// CloudBase 函数型入口
export async function main(event, context) {
  if (!server) {
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🎮 五子棋在线对战服务器已启动`)
      console.log(`📡 监听端口: ${PORT}`)
    })
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: '五子棋服务器运行中'
  }
}

// 普通模式启动
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 五子棋在线对战服务器已启动`)
  console.log(`📡 监听端口: ${PORT}`)
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('[服务器异常]', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[未处理的 Promise 拒绝]', reason)
})
