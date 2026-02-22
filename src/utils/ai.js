import { DIRECTIONS, BOARD_SIZE } from './constants'

/**
 * 评估某个位置对指定玩家的价值
 * @param {Array} board - 棋盘数据
 * @param {number} row - 行坐标
 * @param {number} col - 列坐标
 * @param {string} player - 玩家颜色 ('black' | 'white')
 * @returns {number} - 评分分数
 */
export const evaluatePosition = (board, row, col, player) => {
  let score = 0

  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    let openEnds = 0
    let blocked = 0

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (board[newRow][newCol] === player) count++
        else if (board[newRow][newCol] === null) { openEnds++; break }
        else { blocked++; break }
      } else { blocked++; break }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx
      const newCol = col - i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (board[newRow][newCol] === player) count++
        else if (board[newRow][newCol] === null) { openEnds++; break }
        else { blocked++; break }
      } else { blocked++; break }
    }

    // 评分
    if (count >= 5) score += 100000
    else if (count === 4) {
      if (openEnds === 2) score += 10000
      else if (openEnds === 1) score += 1000
    } else if (count === 3) {
      if (openEnds === 2) score += 1000
      else if (openEnds === 1) score += 100
    } else if (count === 2) {
      if (openEnds === 2) score += 100
      else if (openEnds === 1) score += 10
    }
  }

  return score
}

/**
 * 检查位置是否有相邻棋子
 * @param {Array} board - 棋盘数据
 * @param {number} row - 行坐标
 * @param {number} col - 列坐标
 * @param {number} range - 搜索范围
 * @returns {boolean}
 */
const hasNeighbor = (board, row, col, range = 2) => {
  for (let dr = -range; dr <= range; dr++) {
    for (let dc = -range; dc <= range; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc]) {
        return true
      }
    }
  }
  return false
}

/**
 * 获取候选落子位置（优化：只返回有潜力的位置）
 * @param {Array} board - 棋盘数据
 * @returns {Array} - 候选位置数组
 */
const getCandidateMoves = (board) => {
  const candidates = []
  
  // 检查棋盘是否为空
  let isEmptyBoard = true
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        isEmptyBoard = false
        break
      }
    }
    if (!isEmptyBoard) break
  }
  
  // 空棋盘返回中心
  if (isEmptyBoard) {
    return [{ row: 7, col: 7 }]
  }
  
  // 只收集已有棋子周围 2 格内的空位
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col] && hasNeighbor(board, row, col, 2)) {
        candidates.push({ row, col })
      }
    }
  }
  
  return candidates.length > 0 ? candidates : [{ row: 7, col: 7 }]
}

/**
 * 找到 AI 最佳落子位置
 * @param {Array} board - 棋盘数据
 * @param {string} aiPlayer - AI 玩家颜色
 * @returns {Object} - 最佳位置 {row, col}
 */
export const findBestMove = (board, aiPlayer) => {
  const humanPlayer = aiPlayer === 'white' ? 'black' : 'white'
  const center = 7
  
  // 获取候选位置（已优化，只考虑有潜力的位置）
  const candidates = getCandidateMoves(board)
  
  let bestScore = -Infinity
  let bestMove = null

  for (const { row, col } of candidates) {
    const distFromCenter = Math.abs(row - center) + Math.abs(col - center)
    
    // 评估攻和守
    const attackScore = evaluatePosition(board, row, col, aiPlayer)
    const defendScore = evaluatePosition(board, row, col, humanPlayer)
    
    let totalScore = attackScore + defendScore * 0.9
    
    // 位置偏好
    if (distFromCenter <= 2) totalScore *= 1.5
    else if (distFromCenter <= 4) totalScore *= 1.2

    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMove = { row, col }
    }
  }

  return bestMove || { row: 7, col: 7 }
}

/**
 * 检查是否获胜
 * @param {Array} board - 棋盘数据
 * @param {number} row - 落子行
 * @param {number} col - 落子列
 * @param {string} player - 玩家颜色
 * @returns {boolean}
 */
export const checkWinner = (board, row, col, player) => {
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === player) {
        count++
      } else break
    }
    
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
