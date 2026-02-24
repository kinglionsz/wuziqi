/**
 * 五子棋游戏逻辑 - 云函数版本
 * 使用 CommonJS 模块格式
 */

// 棋盘大小
const BOARD_SIZE = 15

// 方向数组 (用于胜负判定)
const DIRECTIONS = [
  [0, 1],   // 水平
  [1, 0],   // 竖直
  [1, 1],   // 对角线 \
  [1, -1]   // 对角线 /
]

/**
 * 检查是否获胜
 */
function checkWinner(board, row, col, player) {
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    
    // 正方向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === player) {
        count++
      } else break
    }
    
    // 反方向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx
      const newCol = col - i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === player) {
        count++
      } else break
    }
    
    if (count >= 5) return true
  }
  return false
}

/**
 * 检查是否平局
 */
function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== null))
}

/**
 * 创建空棋盘
 */
function createEmptyBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
}

/**
 * 校验落子位置是否合法
 */
function validateMove(row, col, board) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, error: '位置越界' }
  }
  
  if (board[row][col] !== null) {
    return { valid: false, error: '该位置已有棋子' }
  }
  
  return { valid: true, error: null }
}

/**
 * 生成随机房间号
 */
function generateRoomId(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let roomId = ''
  for (let i = 0; i < length; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return roomId
}

/**
 * 创建房间对象
 */
function createRoom(roomId, socketId) {
  return {
    roomId,
    players: {
      [socketId]: { role: 'black', ready: false }
    },
    board: createEmptyBoard(),
    currentTurn: 'black',
    status: 'waiting',
    spectators: [],
    winner: null,
    startTime: null,
    moveHistory: []
  }
}

module.exports = {
  checkWinner,
  checkDraw,
  validateMove,
  generateRoomId,
  createRoom,
  createEmptyBoard,
  BOARD_SIZE
}
