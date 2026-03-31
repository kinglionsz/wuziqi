/**
 * 五子棋游戏逻辑 - 后端版本
 * 包含胜负判定等核心算法
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
 * @param {Array} board - 棋盘数据 (15x15 二维数组)
 * @param {number} row - 落子行
 * @param {number} col - 落子列
 * @param {string} player - 玩家颜色 ('black' | 'white')
 * @returns {boolean}
 */
export const checkWinner = (board, row, col, player) => {
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
 * @param {Array} board - 棋盘数据
 * @returns {boolean}
 */
export const checkDraw = (board) => {
  return board.every(row => row.every(cell => cell !== null))
}

/**
 * 创建空棋盘
 * @returns {Array}
 */
export const createEmptyBoard = () => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
}

/**
 * 校验落子位置是否合法
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {Array} board - 棋盘
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateMove = (row, col, board) => {
  // 检查是否越界
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, error: '位置越界' }
  }
  
  // 检查是否已有棋子
  if (board[row][col] !== null) {
    return { valid: false, error: '该位置已有棋子' }
  }
  
  return { valid: true, error: null }
}

/**
 * 生成随机房间号
 * @param {number} length - 房间号长度
 * @returns {string}
 */
export const generateRoomId = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 避免易混淆字符
  let roomId = ''
  for (let i = 0; i < length; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return roomId
}

/**
 * 创建房间对象
 * @param {string} roomId - 房间号
 * @param {string} hostId - 创建者用户 ID
 * @returns {Object}
 */
export const createRoom = (roomId, hostId) => {
  return {
    roomId,
    players: {
      [hostId]: { role: 'black', ready: true, socketId: null, isDisconnected: false }
    },
    board: createEmptyBoard(),
    currentTurn: 'black',
    status: 'waiting', // waiting | ready | playing | finished
    spectators: [],
    winner: null,
    isDraw: false,
    startTime: null,
    moveHistory: [],
    // 计时器相关
    blackTime: 0,     // 黑方累计耗时（毫秒）
    whiteTime: 0,     // 白方累计耗时（毫秒）
    lastMoveStartTime: null  // 当前玩家开始计时的时刻
  }
}

export { BOARD_SIZE }
