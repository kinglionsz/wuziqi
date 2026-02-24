/**
 * 五子棋在线对战服务器 - 云函数版本
 * 使用腾讯云函数 (SCF) + API 网关
 * 
 * 部署说明：
 * 1. 将此文件夹上传到腾讯云函数
 * 2. 配置 API 网关触发器
 * 3. 设置环境变量 (如果需要)
 */

const { 
  checkWinner, 
  checkDraw, 
  validateMove, 
  generateRoomId, 
  createRoom,
  BOARD_SIZE 
} = require('./gameLogic')

// 全局存储 (云函数冷启动后会重置，建议使用 Redis 或数据库)
// 注意：云函数是无状态的，每次调用可能是不同实例
const rooms = {}
const socketToRoom = {}

// 简单的内存存储版本（生产环境需要使用 Redis/数据库）
let memoryStorage = {
  rooms: {},
  socketToRoom: {}
}

// 获取存储的辅助函数
function getStorage() {
  // 尝试从环境变量获取持久化数据（可选）
  return memoryStorage
}

/**
 * 云函数入口
 * @param {Object} event - API Gateway 事件
 * @param {Object} context - 云函数上下文
 * @returns {Object} HTTP 响应
 */
exports.main = async (event, context) => {
  // 处理 CORS 预检请求
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // 解析路径和请求体
  const path = event.path || '/'
  const body = event.body ? JSON.parse(event.body) : {}
  const query = event.queryStringParameters || {}

  try {
    // 路由处理
    if (path.endsWith('/socket.io/') || path.includes('socket.io')) {
      // WebSocket 连接请求 - 云函数不支持，需要使用专门的 WebSocket 服务
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'WebSocket not supported in SCF, use CloudBase instead' })
      }
    }

    // API 路由
    switch (path) {
      case '/health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ status: 'ok', message: '五子棋服务器运行中' })
        }

      case '/api/create_room':
        return handleCreateRoom(body, headers)

      case '/api/join_room':
        return handleJoinRoom(body, headers)

      case '/api/place_piece':
        return handlePlacePiece(body, headers)

      case '/api/leave_room':
        return handleLeaveRoom(body, headers)

      case '/api/restart_game':
        return handleRestartGame(body, headers)

      case '/api/room_info':
        return handleGetRoomInfo(query, headers)

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' })
        }
    }
  } catch (error) {
    console.error('[Error]', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

/**
 * 创建房间
 */
function handleCreateRoom(body, headers) {
  const socketId = body.socketId || generateSocketId()
  let roomId = generateRoomId(6)
  
  while (memoryStorage.rooms[roomId]) {
    roomId = generateRoomId(6)
  }

  const room = createRoom(roomId, socketId)
  memoryStorage.rooms[roomId] = room
  memoryStorage.socketToRoom[socketId] = roomId

  console.log(`[房间创建] roomId: ${roomId}, 房主: ${socketId}`)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      roomId,
      role: 'black',
      board: room.board,
      currentTurn: room.currentTurn
    })
  }
}

/**
 * 加入房间
 */
function handleJoinRoom(body, headers) {
  const { roomId, socketId } = body
  const socketIdFinal = socketId || generateSocketId()
  
  const room = memoryStorage.rooms[roomId]

  if (!room) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间不存在' })
    }
  }

  const playerCount = Object.keys(room.players).length
  if (playerCount >= 2) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间已满' })
    }
  }

  room.players[socketIdFinal] = { role: 'white', ready: true }
  room.status = 'playing'
  room.startTime = Date.now()
  memoryStorage.socketToRoom[socketIdFinal] = roomId

  console.log(`[玩家加入] roomId: ${roomId}, 玩家: ${socketIdFinal}, 角色: white`)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      roomId,
      role: 'white',
      board: room.board,
      currentTurn: room.currentTurn
    })
  }
}

/**
 * 落子
 */
function handlePlacePiece(body, headers) {
  const { roomId, row, col, socketId, playerRole } = body
  const room = memoryStorage.rooms[roomId]

  if (!room) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间不存在' })
    }
  }

  if (room.status !== 'playing') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '游戏未开始或已结束' })
    }
  }

  const role = playerRole || room.players[socketId]?.role
  if (!role) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '您不在此房间中' })
    }
  }

  if (room.currentTurn !== role) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '还未轮到您落子' })
    }
  }

  const validation = validateMove(row, col, room.board)
  if (!validation.valid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: validation.error })
    }
  }

  room.board[row][col] = role
  room.moveHistory.push({
    player: role,
    position: { row, col },
    timestamp: Date.now()
  })

  console.log(`[落子] roomId: ${roomId}, 玩家: ${socketId}, 角色: ${role}, 位置: (${row}, ${col})`)

  // 检查胜负
  if (checkWinner(room.board, row, col, role)) {
    room.status = 'finished'
    room.winner = role

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        gameOver: true,
        winner: role,
        board: room.board
      })
    }
  }

  // 检查平局
  if (checkDraw(room.board)) {
    room.status = 'finished'

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        gameOver: true,
        isDraw: true,
        board: room.board
      })
    }
  }

  // 切换回合
  room.currentTurn = role === 'black' ? 'white' : 'black'

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      gameOver: false,
      board: room.board,
      currentTurn: room.currentTurn,
      lastMove: { row, col, player: role }
    })
  }
}

/**
 * 离开房间
 */
function handleLeaveRoom(body, headers) {
  const { roomId, socketId } = body
  
  if (!roomId || !memoryStorage.rooms[roomId]) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间不存在' })
    }
  }

  const room = memoryStorage.rooms[roomId]
  const isHost = room.players[socketId]?.role === 'black'
  
  if (isHost) {
    delete memoryStorage.rooms[roomId]
    console.log(`[房间解散] roomId: ${roomId}, 原因: 房主离开`)
  } else {
    delete room.players[socketId]
    const remainingPlayers = Object.keys(room.players)
    if (remainingPlayers.length === 1) {
      room.status = 'waiting'
    } else if (remainingPlayers.length === 0) {
      delete memoryStorage.rooms[roomId]
    }
  }
  
  delete memoryStorage.socketToRoom[socketId]

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  }
}

/**
 * 重新开始游戏
 */
function handleRestartGame(body, headers) {
  const { roomId } = body
  const room = memoryStorage.rooms[roomId]

  if (!room) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间不存在' })
    }
  }

  const playerCount = Object.keys(room.players).length
  if (playerCount < 2) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '需要两名玩家才能重新开始' })
    }
  }

  // 重置棋盘
  room.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  room.currentTurn = 'black'
  room.status = 'playing'
  room.winner = null
  room.startTime = Date.now()
  room.moveHistory = []

  console.log(`[重新开始] roomId: ${roomId}`)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      board: room.board,
      currentTurn: room.currentTurn
    })
  }
}

/**
 * 获取房间信息
 */
function handleGetRoomInfo(query, headers) {
  const { roomId } = query
  const room = memoryStorage.rooms[roomId]

  if (!room) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: '房间不存在' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      room: {
        roomId: room.roomId,
        status: room.status,
        currentTurn: room.currentTurn,
        board: room.board,
        players: Object.entries(room.players).map(([socketId, data]) => ({
          socketId,
          role: data.role,
          ready: data.ready
        })),
        winner: room.winner,
        moveHistory: room.moveHistory
      }
    })
  }
}

/**
 * 生成简单的 socket ID
 */
function generateSocketId() {
  return 'socket_' + Math.random().toString(36).substr(2, 9)
}
