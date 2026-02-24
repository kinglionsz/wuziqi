/**
 * 五子棋在线对战服务器
 * 使用 Express + Socket.io 实现实时双人对战
 */

import express from 'express'
import { createServer } from 'http'
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

// 创建 Express 应用和 HTTP 服务器
const app = express()
app.use(cors())

const httpServer = createServer(app)

// 创建 Socket.io 服务器
// 生产环境必须设置 ALLOWED_ORIGIN 环境变量
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN 
      || (process.env.NODE_ENV === 'production' ? null : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174']),
    methods: ['GET', 'POST'],
    credentials: !!process.env.ALLOWED_ORIGIN
  }
})

// 生产环境验证
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGIN) {
  console.warn('[警告] 生产环境未设置 ALLOWED_ORIGIN，CORS 已禁用（仅支持同源请求）')
}

// 存储所有房间
const rooms = {}

// 存储 socketId 到 roomId 的映射（用于快速查找）
const socketToRoom = {}

/**
 * 获取房间中的玩家列表
 */
const getRoomPlayers = (roomId) => {
  const room = rooms[roomId]
  if (!room) return []
  return Object.entries(room.players).map(([socketId, data]) => ({
    socketId,
    role: data.role,
    ready: data.ready
  }))
}

/**
 * 检查房间是否已满（2人）
 */
const isRoomFull = (roomId) => {
  const room = rooms[roomId]
  if (!room) return false
  return Object.keys(room.players).length >= 2
}

/**
 * 获取玩家角色
 */
const getPlayerRole = (roomId, socketId) => {
  const room = rooms[roomId]
  if (!room || !room.players[socketId]) return null
  return room.players[socketId].role
}

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`[新连接] socketId: ${socket.id}`)

  // ===== 1. 创建房间 =====
  socket.on('create_room', (data, callback) => {
    // 生成唯一房间号
    let roomId = generateRoomId(6)
    
    // 确保房间号不重复
    while (rooms[roomId]) {
      roomId = generateRoomId(6)
    }

    // 创建房间
    const room = createRoom(roomId, socket.id)
    rooms[roomId] = room
    
    // 将 socket 加入房间
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[房间创建] roomId: ${roomId}, 房主: ${socket.id}`)

    // 通过回调返回结果给客户端
    callback({ 
      success: true, 
      roomId, 
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn
    })
  })

  // ===== 2. 加入房间 =====
  socket.on('join_room', (data, callback) => {
    const { roomId } = data
    const room = rooms[roomId]

    // 校验房间是否存在
    if (!room) {
      const errorMsg = '房间不存在'
      console.log(`[加入失败] ${errorMsg}, roomId: ${roomId}`)
      callback({ success: false, error: errorMsg })
      return
    }

    // 校验房间是否已满
    if (isRoomFull(roomId)) {
      const errorMsg = '房间已满'
      console.log(`[加入失败] ${errorMsg}, roomId: ${roomId}`)
      callback({ success: false, error: errorMsg })
      return
    }

    // 将玩家加入房间（执白棋）
    room.players[socket.id] = { role: 'white', ready: true }
    socket.join(roomId)
    socketToRoom[socket.id] = roomId

    console.log(`[玩家加入] roomId: ${roomId}, 玩家: ${socket.id}, 角色: white`)

    // 更新房间状态为 playing
    room.status = 'playing'
    room.startTime = Date.now()

    // 告诉加入者成功了
    callback({ 
      success: true, 
      roomId, 
      role: 'white',
      board: room.board,
      currentTurn: room.currentTurn
    })

    // 通知房间内所有人游戏开始
    io.to(roomId).emit('game_start', {
      roomId,
      currentTurn: room.currentTurn,
      players: getRoomPlayers(roomId)
    })
  })

  // ===== 3. 落子 =====
  socket.on('place_piece', (data, callback) => {
    const { roomId, row, col } = data
    const room = rooms[roomId]
    const playerRole = getPlayerRole(roomId, socket.id)

    // 基本校验
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

    // 防作弊：校验是否轮到该玩家
    if (room.currentTurn !== playerRole) {
      sendError(socket, callback, '还未轮到您落子')
      return
    }

    // 校验落子位置合法性
    const validation = validateMove(row, col, room.board)
    if (!validation.valid) {
      sendError(socket, callback, validation.error)
      return
    }

    // 更新棋盘
    room.board[row][col] = playerRole
    
    // 记录落子历史
    room.moveHistory.push({
      player: playerRole,
      position: { row, col },
      timestamp: Date.now()
    })

    console.log(`[落子] roomId: ${roomId}, 玩家: ${socket.id}, 角色: ${playerRole}, 位置: (${row}, ${col})`)

    // 判断胜负
    if (checkWinner(room.board, row, col, playerRole)) {
      room.status = 'finished'
      room.winner = playerRole

      console.log(`[游戏结束] roomId: ${roomId}, 获胜者: ${playerRole}`)

      // 广播游戏结束
      io.to(roomId).emit('game_over', {
        winner: playerRole,
        lastMove: { row, col },
        board: room.board
      })

      if (callback) {
        callback({ 
          success: true, 
          gameOver: true, 
          winner: playerRole 
        })
      }
      return
    }

    // 检查平局
    if (checkDraw(room.board)) {
      room.status = 'finished'

      console.log(`[游戏结束] roomId: ${roomId}, 平局`)

      io.to(roomId).emit('game_over', {
        winner: null,
        isDraw: true,
        board: room.board
      })

      if (callback) {
        callback({ 
          success: true, 
          gameOver: true, 
          isDraw: true 
        })
      }
      return
    }

    // 切换回合
    room.currentTurn = playerRole === 'black' ? 'white' : 'black'

    // 广播棋盘更新
    io.to(roomId).emit('sync_board', {
      board: room.board,
      lastMove: { row, col, player: playerRole },
      currentTurn: room.currentTurn
    })

    if (callback) {
      callback({ 
        success: true, 
        gameOver: false 
      })
    }
  })

  // ===== 4. 断开连接 =====
  socket.on('disconnect', () => {
    const roomId = socketToRoom[socket.id]
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId]
      
      // 检查是否是游戏中的玩家
      if (room.players[socket.id]) {
        const playerRole = room.players[socket.id].role
        delete room.players[socket.id]

        console.log(`[玩家离开] roomId: ${roomId}, 角色: ${playerRole}`)

        // 如果游戏进行中，通知对手
        if (room.status === 'playing') {
          io.to(roomId).emit('opponent_disconnected', {
            role: playerRole,
            message: '对手已断开连接'
          })
        }

        // 如果房间没人了，删除房间
        if (Object.keys(room.players).length === 0) {
          console.log(`[房间删除] roomId: ${roomId}, 原因: 房间为空`)
          delete rooms[roomId]
        }
      }
      
      // 清理映射
      delete socketToRoom[socket.id]
    }

    console.log(`[断开连接] socketId: ${socket.id}`)
  })

  // ===== 5. 获取房间信息 =====
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

  // ===== 6. 离开房间 =====
  socket.on('leave_room', (data, callback) => {
    const roomId = socketToRoom[socket.id]
    
    if (!roomId || !rooms[roomId]) {
      if (callback) callback({ success: false, error: '您不在任何房间中' })
      return
    }

    const room = rooms[roomId]
    const isHost = room.players[socket.id]?.role === 'black'
    
    // 如果是房主离开，通知其他玩家后解散房间
    if (isHost) {
      io.to(roomId).emit('room_closed', { reason: '房主已离开房间' })
      // 延迟删除房间，让客户端有时间收到通知
      setTimeout(() => {
        if (rooms[roomId]) {
          delete rooms[roomId]
          console.log(`[房间解散] roomId: ${roomId}, 原因: 房主离开`)
        }
      }, 1000)
    } else {
      // 玩家离开，通知另一方
      delete room.players[socket.id]
      
      // 如果房间还有一人，通知他等待对手
      const remainingPlayers = Object.keys(room.players)
      if (remainingPlayers.length === 1) {
        room.status = 'waiting'
        io.to(roomId).emit('opponent_left', { message: '对手已离开房间' })
      } else if (remainingPlayers.length === 0) {
        delete rooms[roomId]
        console.log(`[房间删除] roomId: ${roomId}, 原因: 房间为空`)
      }
    }
    
    socket.leave(roomId)
    delete socketToRoom[socket.id]
    
    if (callback) callback({ success: true })
  })

  // ===== 6. 重新开始游戏 =====
  socket.on('restart_game', (data, callback) => {
    const { roomId } = data
    const room = rooms[roomId]
    
    if (!room) {
      sendError(socket, callback, '房间不存在')
      return
    }

    // 验证：检查房间内是否有两名玩家
    const playerCount = Object.keys(room.players).length
    if (playerCount < 2) {
      sendError(socket, callback, '需要两名玩家才能重新开始')
      return
    }

    // 验证：确保请求者确实在房间中
    if (!room.players[socket.id]) {
      sendError(socket, callback, '您不在此房间中')
      return
    }

    // 重置棋盘
    room.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    room.currentTurn = 'black'
    room.status = 'playing'
    room.winner = null
    room.startTime = Date.now()
    room.moveHistory = []

    console.log(`[重新开始] roomId: ${roomId}, 请求者: ${socket.id}`)

    io.to(roomId).emit('game_restarted', {
      board: room.board,
      currentTurn: room.currentTurn
    })

    if (callback) {
      callback({ success: true })
    }
  })
})

/**
 * 发送错误信息的辅助函数
 */
function sendError(socket, callback, errorMessage) {
  console.log(`[错误] ${errorMessage}`)
  if (callback) {
    callback({ success: false, error: errorMessage })
  } else {
    socket.emit('error', { error: errorMessage })
  }
}

// 启动服务器
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`========================================`)
  console.log(`🎮 五子棋在线对战服务器已启动`)
  console.log(`📡 监听端口: ${PORT}`)
  console.log(`🌐 前端连接地址: http://localhost:5173`)
  console.log(`========================================`)
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('[服务器异常]', err)
  // 在生产环境中，可以选择退出进程让容器重启
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[未处理的 Promise 拒绝]', reason)
  // 在生产环境中，可以选择退出进程让容器重启  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})
