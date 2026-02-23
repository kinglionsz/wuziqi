import { useState, useEffect, useRef, useCallback } from 'react'
import { BOARD_SIZE, AI_PLAYER, GAME_MODES, THEMES, AI_LEVELS } from '../utils/constants'
import { checkWinner, checkDraw, findBestMove } from '../utils/ai'
import { playSound } from '../utils/sound'
import { saveGameRecord as saveToSupabase } from '../lib/supabase'

/**
 * 游戏逻辑 Hook
 * @param {Object} options - 配置选项
 * @returns {Object} 游戏状态和操作函数
 */
export const useGameLogic = ({ 
  gameMode, 
  soundEnabled, 
  theme,
  aiLevel = AI_LEVELS.MEDIUM
}) => {
  // 游戏状态
  const [board, setBoard] = useState(() => 
    Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null))
  )
  const [currentPlayer, setCurrentPlayer] = useState('black')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [isDraw, setIsDraw] = useState(false)
  
  // 计时状态
  const [gameTime, setGameTime] = useState(0)
  const [blackTime, setBlackTime] = useState(0)
  const [whiteTime, setWhiteTime] = useState(0)
  
  // 历史记录
  const [moveHistory, setMoveHistory] = useState([])
  
  // Refs
  const gameStartTime = useRef(null)
  const turnStartTime = useRef(null)
  const aiMoveRef = useRef(false)

  // 格式化时间
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 游戏计时器
  useEffect(() => {
    if (!gameOver && gameStartTime.current) {
      const timer = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime.current) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameOver])

  // 初始化游戏开始时间
  useEffect(() => {
    if (!gameStartTime.current && !gameOver) {
      gameStartTime.current = Date.now()
      turnStartTime.current = Date.now()
    }
  }, [gameOver])

  // AI 落子
  useEffect(() => {
    if (gameMode === GAME_MODES.PVE && currentPlayer === AI_PLAYER && !gameOver && !aiMoveRef.current) {
      aiMoveRef.current = true
      const timer = setTimeout(() => {
        const bestMove = findBestMove(board, AI_PLAYER, aiLevel)
        if (bestMove) {
          handleCellClick(bestMove.row, bestMove.col)
        }
        aiMoveRef.current = false
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameMode, gameOver, board, aiLevel])

  // 保存游戏记录
  const saveGameRecord = useCallback(async (winnerValue) => {
    // 本地存储记录
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      winner: winnerValue === 'black' ? '黑棋' : winnerValue === 'white' ? '白棋' : '平局',
      mode: gameMode === GAME_MODES.PVP ? '双人对战' : gameMode === GAME_MODES.PVE ? '人机对战' : '在线对战',
      moves: moveHistory.length,
      duration: formatTime(gameTime),
      theme: THEMES[theme]?.name || '默认'
    }
    
    const saved = localStorage.getItem('gomoku_records')
    const records = saved ? JSON.parse(saved) : []
    const newRecords = [record, ...records].slice(0, 50)
    localStorage.setItem('gomoku_records', JSON.stringify(newRecords))
    
    // 保存到 Supabase
    try {
      await saveToSupabase({
        winner: winnerValue || 'draw',
        gameMode: gameMode,
        moves: moveHistory.length,
        durationSeconds: gameTime,
        theme: theme,
        playerBlack: '玩家1',
        playerWhite: gameMode === GAME_MODES.PVE ? 'AI' : '玩家2',
        moveHistory: moveHistory.map(m => ({
          player: m.player,
          position: m.position,
          time: Date.now()
        }))
      })
    } catch (error) {
      console.error('保存到 Supabase 失败:', error)
    }
    
    return newRecords
  }, [gameMode, gameTime, moveHistory, theme, formatTime])

  // 处理落子
  const handleCellClick = useCallback((row, col) => {
    if (gameOver || board[row][col]) return

    playSound('place', soundEnabled)

    // 更新计时
    if (turnStartTime.current) {
      const turnTime = Math.floor((Date.now() - turnStartTime.current) / 1000)
      if (currentPlayer === 'black') {
        setBlackTime(prev => prev + turnTime)
      } else {
        setWhiteTime(prev => prev + turnTime)
      }
    }

    // 更新棋盘
    const newBoard = board.map((r, i) => 
      i === row ? r.map((c, j) => j === col ? currentPlayer : c) : r
    )
    setBoard(newBoard)

    // 保存历史
    const currentTurnTime = turnStartTime.current 
      ? Math.floor((Date.now() - turnStartTime.current) / 1000) 
      : 0
      
    setMoveHistory(prev => [...prev, {
      board: board.map(row => [...row]), // 深拷贝当前棋盘
      player: currentPlayer,
      position: { row, col },
      blackTime: currentPlayer === 'black' ? blackTime + currentTurnTime : blackTime,
      whiteTime: currentPlayer === 'white' ? whiteTime + currentTurnTime : whiteTime,
      gameTime
    }])

    // 检查胜负
    if (checkWinner(newBoard, row, col, currentPlayer)) {
      setGameOver(true)
      setWinner(currentPlayer)
      setIsDraw(false)
      playSound('win', soundEnabled)
      return { gameOver: true, winner: currentPlayer, isDraw: false }
    } 
    
    // 检查平局
    if (checkDraw(newBoard)) {
      setGameOver(true)
      setIsDraw(true)
      setWinner(null)
      return { gameOver: true, winner: null, isDraw: true }
    }

    // 切换玩家
    setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black')
    turnStartTime.current = Date.now()
    
    return { gameOver: false }
  }, [board, currentPlayer, gameOver, blackTime, whiteTime, gameTime, soundEnabled])

  // 重置游戏
  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
    setCurrentPlayer('black')
    setGameOver(false)
    setWinner(null)
    setIsDraw(false)
    setGameTime(0)
    setBlackTime(0)
    setWhiteTime(0)
    setMoveHistory([])
    aiMoveRef.current = false
    gameStartTime.current = Date.now()
    turnStartTime.current = Date.now()
  }, [])

  // 悔棋
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0 || gameOver) return false
    
    // 人机模式下只能撤销两步
    if (gameMode === GAME_MODES.PVE && moveHistory.length < 2) return false

    const lastMove = moveHistory[moveHistory.length - 1]
    setBoard(lastMove.board)
    setCurrentPlayer(lastMove.player)
    setBlackTime(lastMove.blackTime)
    setWhiteTime(lastMove.whiteTime)
    setGameTime(lastMove.gameTime)
    setMoveHistory(prev => prev.slice(0, -1))
    setGameOver(false)
    setWinner(null)
    setIsDraw(false)
    turnStartTime.current = Date.now()
    
    return true
  }, [moveHistory, gameOver, gameMode])

  return {
    // 状态
    board,
    currentPlayer,
    gameOver,
    winner,
    isDraw,
    gameTime,
    blackTime,
    whiteTime,
    moveHistory,
    
    // 操作
    handleCellClick,
    resetGame,
    undoMove,
    saveGameRecord,
    formatTime,
    
    // 用于回放的设置函数
    setBoard,
    setCurrentPlayer,
    setBlackTime,
    setWhiteTime,
    setGameTime
  }
}
