import { DIRECTIONS, BOARD_SIZE, AI_LEVELS } from './constants'

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

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (board[newRow][newCol] === player) count++
        else if (board[newRow][newCol] === null) { openEnds++; break }
        else { break }
      } else { break }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx
      const newCol = col - i * dy
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (board[newRow][newCol] === player) count++
        else if (board[newRow][newCol] === null) { openEnds++; break }
        else { break }
      } else { break }
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
 * Minimax 算法 + Alpha-Beta 剪枝
 * @param {Array} board - 棋盘数据
 * @param {number} depth - 搜索深度
 * @param {number} alpha - 最大值
 * @param {number} beta - 最小值
 * @param {boolean} isMaximizing - 是否最大化玩家
 * @param {string} aiPlayer - AI 玩家颜色
 * @param {string} humanPlayer - 人类玩家颜色
 * @returns {number} - 评分
 */
const minimax = (board, depth, alpha, beta, isMaximizing, aiPlayer, humanPlayer) => {
  // 获取候选位置
  const candidates = getCandidateMoves(board)
  
  // 检查是否有人获胜
  for (const { row, col } of candidates) {
    if (board[row][col]) continue
    
    // 模拟 AI 落子
    board[row][col] = aiPlayer
    const aiWin = checkWinner(board, row, col, aiPlayer)
    board[row][col] = null
    
    if (aiWin) return isMaximizing ? 1000000 + depth : -(1000000 + depth)
    
    // 模拟人类落子
    board[row][col] = humanPlayer
    const humanWin = checkWinner(board, row, col, humanPlayer)
    board[row][col] = null
    
    if (humanWin) return isMaximizing ? -(1000000 + depth) : 1000000 + depth
  }
  
  // 达到搜索深度或平局
  if (depth === 0 || candidates.length === 0) {
    // 评估棋盘状态
    let score = 0
    for (const { row, col } of candidates) {
      if (!board[row][col]) {
        score += evaluatePosition(board, row, col, aiPlayer)
        score -= evaluatePosition(board, row, col, humanPlayer) * 0.8
      }
    }
    return score
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity
    for (const { row, col } of candidates.slice(0, 8)) { // 限制搜索宽度
      if (board[row][col]) continue
      board[row][col] = aiPlayer
      const eval_ = minimax(board, depth - 1, alpha, beta, false, aiPlayer, humanPlayer)
      board[row][col] = null
      maxEval = Math.max(maxEval, eval_)
      alpha = Math.max(alpha, eval_)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const { row, col } of candidates.slice(0, 8)) {
      if (board[row][col]) continue
      board[row][col] = humanPlayer
      const eval_ = minimax(board, depth - 1, alpha, beta, true, aiPlayer, humanPlayer)
      board[row][col] = null
      minEval = Math.min(minEval, eval_)
      beta = Math.min(beta, eval_)
      if (beta <= alpha) break
    }
    return minEval
  }
}

/**
 * 简单难度：随机选择或只考虑进攻
 * @param {Array} board - 棋盘数据
 * @param {string} aiPlayer - AI 玩家颜色
 * @param {string} humanPlayer - 人类玩家颜色（简单难度不使用）
 * @returns {Object} - 落子位置 {row, col}
 */
const findEasyMove = (board, aiPlayer, humanPlayer) => {
  void humanPlayer // 简单难度不使用人类玩家参数
  const candidates = getCandidateMoves(board)
  
  // 30% 概率完全随机（有潜力的位置中）
  if (Math.random() < 0.3 && candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  
  // 70% 概率使用简单评估（只考虑进攻）
  let bestScore = -Infinity
  let bestMove = null
  const center = 7

  for (const { row, col } of candidates) {
    // 只评估进攻分数
    const attackScore = evaluatePosition(board, row, col, aiPlayer)
    const distFromCenter = Math.abs(row - center) + Math.abs(col - center)
    
    // 简单难度只考虑进攻
    let totalScore = attackScore
    
    // 添加一些随机性
    totalScore += Math.random() * 500
    
    // 轻微的位置偏好
    if (distFromCenter <= 2) totalScore *= 1.1

    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMove = { row, col }
    }
  }

  return bestMove || { row: 7, col: 7 }
}

/**
 * 中等难度：现有算法 + 偶尔失误
 * @param {Array} board - 棋盘数据
 * @param {string} aiPlayer - AI 玩家颜色
 * @param {string} humanPlayer - 人类玩家颜色
 * @returns {Object} - 落子位置 {row, col}
 */
const findMediumMove = (board, aiPlayer, humanPlayer) => {
  const candidates = getCandidateMoves(board)
  
  // 15% 概率使用简单难度（模拟"失误"）
  if (Math.random() < 0.15) {
    return findEasyMove(board, aiPlayer, humanPlayer)
  }
  
  // 85% 概率使用标准评估
  let bestScore = -Infinity
  let bestMove = null
  const center = 7

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
 * 困难难度：Minimax + Alpha-Beta 剪枝
 * @param {Array} board - 棋盘数据
 * @param {string} aiPlayer - AI 玩家颜色
 * @param {string} humanPlayer - 人类玩家颜色
 * @returns {Object} - 落子位置 {row, col}
 */
const findHardMove = (board, aiPlayer, humanPlayer) => {
  const candidates = getCandidateMoves(board)
  
  // 首先检查是否可以立即获胜
  for (const { row, col } of candidates) {
    if (board[row][col]) continue
    board[row][col] = aiPlayer
    const win = checkWinner(board, row, col, aiPlayer)
    board[row][col] = null
    if (win) return { row, col }
  }
  
  // 检查是否需要阻止对手获胜
  for (const { row, col } of candidates) {
    if (board[row][col]) continue
    board[row][col] = humanPlayer
    const win = checkWinner(board, row, col, humanPlayer)
    board[row][col] = null
    if (win) return { row, col }
  }
  
  // 使用 Minimax 算法
  let bestScore = -Infinity
  let bestMove = null
  const center = 7
  
  // 按评估分数排序候选位置，提高剪枝效率
  const scoredCandidates = candidates.map(({ row, col }) => {
    const attackScore = evaluatePosition(board, row, col, aiPlayer)
    const defendScore = evaluatePosition(board, row, col, humanPlayer)
    return { row, col, score: attackScore + defendScore }
  }).sort((a, b) => b.score - a.score)
  
  for (const { row, col } of scoredCandidates.slice(0, 12)) {
    if (board[row][col]) continue
    
    board[row][col] = aiPlayer
    const score = minimax(board, 2, -Infinity, Infinity, false, aiPlayer, humanPlayer)
    board[row][col] = null
    
    // 位置偏好
    const distFromCenter = Math.abs(row - center) + Math.abs(col - center)
    let finalScore = score
    if (distFromCenter <= 2) finalScore *= 1.3
    else if (distFromCenter <= 4) finalScore *= 1.1
    
    if (finalScore > bestScore) {
      bestScore = finalScore
      bestMove = { row, col }
    }
  }

  return bestMove || { row: 7, col: 7 }
}

/**
 * 找到 AI 最佳落子位置
 * @param {Array} board - 棋盘数据
 * @param {string} aiPlayer - AI 玩家颜色
 * @param {string} level - AI 难度级别
 * @returns {Object} - 最佳位置 {row, col}
 */
export const findBestMove = (board, aiPlayer, level = AI_LEVELS.MEDIUM) => {
  const humanPlayer = aiPlayer === 'white' ? 'black' : 'white'
  
  // 根据难度选择不同算法
  switch (level) {
    case AI_LEVELS.EASY:
      return findEasyMove(board, aiPlayer, humanPlayer)
    case AI_LEVELS.HARD:
      return findHardMove(board, aiPlayer, humanPlayer)
    case AI_LEVELS.MEDIUM:
    default:
      return findMediumMove(board, aiPlayer, humanPlayer)
  }
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
