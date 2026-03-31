/**
 * 共享测试工具模块 - 提供五子棋游戏测试所需的辅助函数
 */

// 棋盘常量
export const BOARD_SIZE = 15

// 四个方向：水平、垂直、对角线、反对角线
export const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]

/**
 * 创建空棋盘
 * @returns {Array<Array<string|null>>} 15x15的空棋盘
 */
export const createEmptyBoard = () =>
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))

/**
 * 根据棋子列表创建棋盘
 * @param {Array<{row: number, col: number, player: string}>} pieces - 棋子列表
 * @returns {Array<Array<string|null>>} 填充后的棋盘
 */
export const createBoard = (pieces) => {
  const board = createEmptyBoard()
  pieces.forEach(({ row, col, player }) => {
    board[row][col] = player
  })
  return board
}

/**
 * 检查是否有五子连珠（获胜）
 * @param {Array<Array<string|null>>} board - 棋盘
 * @param {number} row - 最后落子行
 * @param {number} col - 最后落子列
 * @param {string} player - 玩家标识 ('black' 或 'white')
 * @returns {boolean} 是否获胜
 */
export const checkWinner = (board, row, col, player) => {
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++
      } else break
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx
      const newCol = col - i * dy
      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++
      } else break
    }

    if (count >= 5) return true
  }
  return false
}

/**
 * 检查是否平局（棋盘已满）
 * @param {Array<Array<string|null>>} board - 棋盘
 * @returns {boolean} 是否平局
 */
export const checkDraw = (board) =>
  board.every((row) => row.every((cell) => cell !== null))

/**
 * 验证落子是否合法
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {Array<Array<string|null>>} board - 棋盘
 * @returns {{valid: boolean, error: string|null}} 验证结果
 */
export const validateMove = (row, col, board) => {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, error: '位置越界' }
  }
  if (board[row][col] !== null) {
    return { valid: false, error: '该位置已有棋子' }
  }
  return { valid: true, error: null }
}

/**
 * 生成房间ID
 * @param {number} length - 房间ID长度
 * @returns {string} 房间ID
 */
export const generateRoomId = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let roomId = ''
  for (let i = 0; i < length; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return roomId
}
