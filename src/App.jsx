import { useState, useEffect, useRef, useCallback } from 'react'
import Board from './components/Board'
import { VictoryModal, RulesModal, ReplayModal, SettingsModal } from './components/Modals'
import { useGameLogic } from './hooks/useGameLogic'
import { THEMES, GAME_MODES, AI_PLAYER, AI_LEVELS } from './utils/constants'
import { playSound } from './utils/sound'
import './App.css'

function App() {
  // 游戏设置状态
  const [gameMode, setGameMode] = useState(GAME_MODES.PVP)
  const [aiLevel, setAiLevel] = useState(AI_LEVELS.MEDIUM)
  const [theme, setTheme] = useState('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [bgMusicEnabled, setBgMusicEnabled] = useState(false)
  
  // 模态框状态
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [replayIndex, setReplayIndex] = useState(-1)
  
  // 使用游戏逻辑 Hook
  const {
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
    setBoard
  } = useGameLogic({ gameMode, soundEnabled, theme, aiLevel })

  // 背景音乐引用
  const bgMusicRef = useRef(null)

  // 背景音乐控制
  useEffect(() => {
    if (bgMusicEnabled && bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {})
    } else if (bgMusicRef.current) {
      bgMusicRef.current.pause()
    }
  }, [bgMusicEnabled])

  // 游戏结束检测 - 显示胜利模态框
  useEffect(() => {
    if (gameOver && !showReplayModal) {
      const timer = setTimeout(() => setShowVictoryModal(true), 500)
      return () => clearTimeout(timer)
    }
  }, [gameOver, showReplayModal])

  // 处理重新开始
  const handleRestart = useCallback(() => {
    saveGameRecord(winner)
    resetGame()
    setShowVictoryModal(false)
  }, [resetGame, saveGameRecord, winner])

  // 处理模式切换
  const handleModeChange = useCallback((mode) => {
    setGameMode(mode)
    resetGame()
  }, [resetGame])

  // 处理难度切换
  const handleAiLevelChange = useCallback((level) => {
    setAiLevel(level)
    // 切换难度时重置游戏，确保新难度立即生效
    if (gameMode === GAME_MODES.PVE) {
      resetGame()
    }
  }, [gameMode, resetGame])

  // 回放功能
  const startReplay = useCallback(() => {
    if (moveHistory.length === 0) return
    setShowReplayModal(true)
    setReplayIndex(0)
  }, [moveHistory.length])

  const replayStep = useCallback((step) => {
    const { BOARD_SIZE } = require('./utils/constants')
    if (step < 0) {
      setBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
    } else if (step < moveHistory.length) {
      // 重建到该步骤的棋盘
      const history = moveHistory.slice(0, step + 1)
      const newBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null))
      history.forEach(move => {
        newBoard[move.position.row][move.position.col] = move.player
      })
      setBoard(newBoard)
    }
    setReplayIndex(step)
  }, [moveHistory, setBoard])

  const nextReplayStep = useCallback(() => {
    if (replayIndex < moveHistory.length - 1) {
      replayStep(replayIndex + 1)
    }
  }, [replayIndex, moveHistory.length, replayStep])

  const prevReplayStep = useCallback(() => {
    if (replayIndex > 0) {
      replayStep(replayIndex - 1)
    }
  }, [replayIndex, replayStep])

  // 退出回放
  const exitReplay = useCallback(() => {
    setShowReplayModal(false)
    resetGame()
  }, [resetGame])

  // 获取当前主题
  const currentTheme = THEMES[theme]

  // 渲染游戏状态文本
  const renderGameStatus = () => {
    if (gameOver) {
      return isDraw ? '游戏结束！平局！' : `游戏结束！${winner === 'black' ? '黑棋' : '白棋'}获胜！`
    }
    if (gameMode === GAME_MODES.PVE && currentPlayer === AI_PLAYER) {
      return 'AI 思考中...'
    }
    return `当前回合：${currentPlayer === 'black' ? '黑棋' : '白棋'}`
  }

  return (
    <div className="app" style={{ background: currentTheme.background, color: currentTheme.textColor }}>
      <h1>五子棋游戏</h1>
      
      {/* 游戏信息栏 */}
      <div className="game-info">
        <div className="info-section">
          <p className="game-status">{renderGameStatus()}</p>
        </div>
        
        <div className="time-section">
          <div className="time-info">
            <span>游戏时间：{formatTime(gameTime)}</span>
          </div>
          <div className="player-times">
            <span>黑棋时间：{formatTime(blackTime)}</span>
            <span>白棋时间：{formatTime(whiteTime)}</span>
          </div>
        </div>
        
        <div className="button-section">
          <button onClick={resetGame} className="reset-button">重新开始</button>
          <button 
            onClick={undoMove} 
            className="undo-button" 
            disabled={moveHistory.length === 0 || gameOver || (gameMode === GAME_MODES.PVE && moveHistory.length < 2)}
          >
            悔棋
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="settings-button">设置</button>
          <button onClick={() => setShowRulesModal(true)} className="rules-button">规则</button>
        </div>
      </div>

      {/* 游戏模式栏 */}
      <div className="game-mode-bar">
        <button 
          className={gameMode === GAME_MODES.PVP ? 'active' : ''} 
          onClick={() => { handleModeChange(GAME_MODES.PVP); playSound('click', soundEnabled); }}
        >
          双人对战
        </button>
        <button 
          className={gameMode === GAME_MODES.PVE ? 'active' : ''} 
          onClick={() => { handleModeChange(GAME_MODES.PVE); playSound('click', soundEnabled); }}
        >
          人机对战
        </button>
        {moveHistory.length > 0 && (
          <button onClick={startReplay} className="replay-button">回放</button>
        )}
      </div>

      {/* 棋盘 */}
      <div className="game-board">
        <Board 
          board={board} 
          onCellClick={handleCellClick} 
          currentPlayer={currentPlayer}
          gameOver={gameOver}
          theme={theme}
        />
      </div>

      {/* 胜利模态框 */}
      <VictoryModal
        isOpen={showVictoryModal}
        isDraw={isDraw}
        winner={winner}
        gameTime={gameTime}
        blackTime={blackTime}
        whiteTime={whiteTime}
        moveCount={moveHistory.length}
        formatTime={formatTime}
        onRestart={handleRestart}
      />

      {/* 规则模态框 */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* 设置模态框 */}
      <SettingsModal
        isOpen={showSettingsModal}
        gameMode={gameMode}
        aiLevel={aiLevel}
        theme={theme}
        soundEnabled={soundEnabled}
        bgMusicEnabled={bgMusicEnabled}
        onClose={() => setShowSettingsModal(false)}
        onChangeMode={handleModeChange}
        onChangeAiLevel={handleAiLevelChange}
        onChangeTheme={setTheme}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        onToggleBgMusic={() => setBgMusicEnabled(prev => !prev)}
      />

      {/* 回放模态框 */}
      <ReplayModal
        isOpen={showReplayModal}
        moveHistory={moveHistory}
        replayIndex={replayIndex}
        onClose={exitReplay}
        onReplayStep={replayStep}
        onNextStep={nextReplayStep}
        onPrevStep={prevReplayStep}
      />

      {/* 隐藏的背景音乐音频元素 */}
      <audio ref={bgMusicRef} loop>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>

      <div className="footer">
        <p>©️狮王李 保留所有权利 2026 | 版本 v0.5</p>
      </div>
    </div>
  )
}

export default App
