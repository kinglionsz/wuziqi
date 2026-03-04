import { useState, useEffect, useRef, useCallback } from 'react'
import { BOARD_SIZE, AI_PLAYER, GAME_MODES, THEMES, AI_LEVELS } from '../utils/constants'
import { checkWinner, checkDraw, findBestMove } from '../utils/ai'
import { playSound } from '../utils/sound'
import { saveGameRecord as saveToSupabase } from '../lib/supabase'

/**
 * 游戏逻辑 Hook - 简化版，修复 AI 落子问题
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

  // 保存游戏记录
  const saveGameRecord = useCallback(async (winnerValue) => {
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
    
    try {
      await saveToSupabase({
        winner: winnerValue || 'draw',
        gameMode,
        moves: moveHistory.length,
        durationSeconds: gameTime,
        theme,
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

  // 处理落子 - 用户点击
  const handleCellClick = useCallback((row, col) => {
    if (gameOver || board[row][col]) return

    // 【关键修复】人机模式下，阻止用户在 AI 回合落子
    // 使用 currentPlayer 状态，而不是 ref
    if (gameMode === GAME_MODES.PVE && currentPlayer === AI_PLAYER) {
      return
    }

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

    const moveRecord = {
      board: board.map(row => [...row]),
      player: currentPlayer,
      position: { row, col },
      blackTime: currentPlayer === 'black' ? blackTime + currentTurnTime : blackTime,
      whiteTime: currentPlayer === 'white' ? whiteTime + currentTurnTime : whiteTime,
      gameTime
    }
    setMoveHistory(prev => [...prev, moveRecord])

    // 检查胜负
    if (checkWinner(newBoard, row, col, currentPlayer)) {
      setGameOver(true)
      setWinner(currentPlayer)
      setIsDraw(false)
      playSound('win', soundEnabled)
    } else if (checkDraw(newBoard)) {
      setGameOver(true)
      setIsDraw(true)
      setWinner(null)
    } else {
      // 切换玩家
      setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black')
      turnStartTime.current = Date.now()
      // 【关键】重置 AI 落子标记，允许 AI 落子
      aiMoveRef.current = false
    }
  }, [board, currentPlayer, gameOver, blackTime, whiteTime, gameTime, soundEnabled, gameMode])

  // 【关键修复】AI 落子 - 只依赖 currentPlayer 变化，不依赖 board
  // 使用 useRef 追踪最新状态，避免闭包问题
  const boardRef = useRef(board)
  const gameOverRef = useRef(gameOver)
  const gameModeRef = useRef(gameMode)
  const aiLevelRef = useRef(aiLevel)
  const soundEnabledRef = useRef(soundEnabled)

  // 同步 ref
  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { gameModeRef.current = gameMode }, [gameMode])
  useEffect(() => { aiLevelRef.current = aiLevel }, [aiLevel])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  useEffect(() => {
    // 使用 ref 获取最新状态
    const currentGameMode = gameModeRef.current
    const currentGameOver = gameOverRef.current
    const currentAiLevel = aiLevelRef.current
    const currentSoundEnabled = soundEnabledRef.current

    // 条件检查 - 使用 currentPlayer 状态
    if (currentGameMode !== GAME_MODES.PVE) return
    if (currentPlayer !== AI_PLAYER) return
    if (currentGameOver) return
    if (aiMoveRef.current) return // 防止重复触发

    aiMoveRef.current = true

    // 使用 ref 获取最新 board
    const currentBoard = boardRef.current

    // 计算最佳落子
    const bestMove = findBestMove(currentBoard, AI_PLAYER, currentAiLevel)

    if (bestMove) {
      playSound('place', currentSoundEnabled)

      // 更新棋盘
      const newBoard = currentBoard.map((r, i) =>
        i === bestMove.row ? r.map((c, j) => j === bestMove.col ? AI_PLAYER : c) : r
      )
      setBoard(newBoard)

      // 保存历史
      const currentTurnTime = turnStartTime.current
        ? Math.floor((Date.now() - turnStartTime.current) / 1000)
        : 0

      const aiMoveRecord = {
        board: currentBoard.map(row => [...row]),
        player: AI_PLAYER,
        position: { row: bestMove.row, col: bestMove.col },
        blackTime,
        whiteTime: whiteTime + currentTurnTime,
        gameTime
      }
      setMoveHistory(prev => [...prev, aiMoveRecord])

      // 检查胜负
      if (checkWinner(newBoard, bestMove.row, bestMove.col, AI_PLAYER)) {
        setGameOver(true)
        setWinner(AI_PLAYER)
        setIsDraw(false)
        playSound('win', currentSoundEnabled)
      } else if (checkDraw(newBoard)) {
        setGameOver(true)
        setIsDraw(true)
        setWinner(null)
      } else {
        // 切换到黑棋
        setCurrentPlayer('black')
        turnStartTime.current = Date.now()
      }
    }

  }, [currentPlayer]) // 只依赖 currentPlayer 变化

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
    aiMoveRef.current = false
    
    return true
  }, [moveHistory, gameOver, gameMode])

  // 重置 AI 移动状态（用于退出回放等场景）
  const resetAiMove = useCallback(() => {
    aiMoveRef.current = false
  }, [])

  // 触发 AI 落子（用于退出回放等场景）
  const triggerAiMove = useCallback(() => {
    aiMoveRef.current = false
    // 强制更新 currentPlayer 触发 useEffect
    setCurrentPlayer(prev => prev)
  }, [])

  return {
    board,
    currentPlayer,
    gameOver,
    winner,
    isDraw,
    gameTime,
    blackTime,
    whiteTime,
    moveHistory,
    handleCellClick,
    resetGame,
    undoMove,
    saveGameRecord,
    formatTime,
    resetAiMove,
    triggerAiMove,
    setBoard,
    setCurrentPlayer,
    setBlackTime,
    setWhiteTime,
    setGameTime,
    setGameOver,
    setWinner,
    setIsDraw
  }
}
