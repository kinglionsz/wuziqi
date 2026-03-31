// 主题配置
export const THEMES = {
  default: {
    name: '默认',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    boardColor: '#DEB887',
    lineColor: '#8B4513',
    textColor: '#333'
  },
  wood: {
    name: '木纹',
    background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
    boardColor: '#DEB887',
    lineColor: '#5D3A1A',
    textColor: '#FFF'
  },
  ocean: {
    name: '海洋',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    boardColor: '#87CEEB',
    lineColor: '#1e3c72',
    textColor: '#FFF'
  },
  forest: {
    name: '森林',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    boardColor: '#90EE90',
    lineColor: '#228B22',
    textColor: '#FFF'
  },
  night: {
    name: '夜空',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    boardColor: '#2C3E50',
    lineColor: '#ECF0F1',
    textColor: '#ECF0F1'
  },
  pink: {
    name: '樱花',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    boardColor: '#FFF0F5',
    lineColor: '#DB7093',
    textColor: '#8B475D'
  }
}

// 游戏常量
export const BOARD_SIZE = 15
export const AI_PLAYER = 'white'
export const HUMAN_PLAYER = 'black'

// 游戏模式
export const GAME_MODES = {
  PVP: 'pvp',
  PVE: 'pve',
  ONLINE: 'online'
}

// AI 难度
export const AI_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

// 方向数组 (用于胜负判定和 AI 评估)
export const DIRECTIONS = [
  [0, 1],   // 水平
  [1, 0],   // 竖直
  [1, 1],   // 对角线 \
  [1, -1]   // 对角线 /
]

// 段位系统
export const RANKS = {
  BRONZE: {
    name: '青铜',
    minRating: 0,
    maxRating: 1199,
    color: '#CD7F32',
    icon: '🥉'
  },
  SILVER: {
    name: '白银',
    minRating: 1200,
    maxRating: 1399,
    color: '#C0C0C0',
    icon: '🥈'
  },
  GOLD: {
    name: '黄金',
    minRating: 1400,
    maxRating: 1599,
    color: '#FFD700',
    icon: '🥇'
  },
  DIAMOND: {
    name: '钻石',
    minRating: 1600,
    maxRating: Infinity,
    color: '#B9F2FF',
    icon: '💎'
  }
}

/**
 * 根据积分获取段位
 * @param {number} rating - 玩家积分
 * @returns {Object} 段位信息
 */
export function getRankByRating(rating) {
  if (rating >= RANKS.DIAMOND.minRating) return RANKS.DIAMOND
  if (rating >= RANKS.GOLD.minRating) return RANKS.GOLD
  if (rating >= RANKS.SILVER.minRating) return RANKS.SILVER
  return RANKS.BRONZE
}
