import { useState, useEffect, useRef, useCallback } from 'react'
import Board from './components/Board'
import { VictoryModal, RulesModal, ReplayModal, SettingsModal, RoomModal } from './components/Modals'
import { useGameLogic } from './hooks/useGameLogic'
import { useOnlineGame } from './hooks/useOnlineGame'
import { THEMES, GAME_MODES, AI_PLAYER, AI_LEVELS, BOARD_SIZE } from './utils/constants'
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
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [replayIndex, setReplayIndex] = useState(-1)
  
  // 在线游戏状态
  const {
    roomInfo,
    isConnected,
    gameState,
    error: onlineError,
    createRoom: onlineCreateRoom,
    joinRoom: onlineJoinRoom,
    placePiece: onlinePlacePiece,
    restartGame: onlineRestartGame,
    leaveRoom: onlineLeaveRoom,
    clearError: clearOnlineError
  } = useOnlineGame()
  
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

  // 游戏结束检测 - 显示胜利模态框（本地游戏）
  useEffect(() => {
    if (gameOver && !showReplayModal && gameMode !== GAME_MODES.ONLINE) {
      const timer = setTimeout(() => setShowVictoryModal(true), 500)
      return () => clearTimeout(timer)
    }
  }, [gameOver, showReplayModal, gameMode])

  // 在线游戏结束检测 - 显示胜利模态框
  useEffect(() => {
    if (gameMode === GAME_MODES.ONLINE && roomInfo && gameState.gameOver && !showReplayModal) {
      const timer = setTimeout(() => setShowVictoryModal(true), 500)
      return () => clearTimeout(timer)
    }
  }, [gameState.gameOver, showReplayModal, gameMode, roomInfo])

  // 监听离开房间 - 当 roomInfo 变为 null 时，重置为本地游戏
  useEffect(() => {
    // 当从在线模式离开房间后，自动切换到人机对战模式
    if (gameMode === GAME_MODES.ONLINE && !roomInfo && !showRoomModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameMode(GAME_MODES.PVE)
      resetGame()
    }
  }, [roomInfo, gameMode, showRoomModal, resetGame])

  // 处理重新开始
  const handleRestart = useCallback(() => {
    // 在线游戏：调用服务器重新开始
    if (gameMode === GAME_MODES.ONLINE && roomInfo) {
      onlineRestartGame()
    } else {
      saveGameRecord(winner)
      resetGame()
    }
    setShowVictoryModal(false)
  }, [gameMode, roomInfo, winner, resetGame, saveGameRecord, onlineRestartGame])

  // 处理模式切换
  const handleModeChange = useCallback((mode) => {
    // 如果从在线模式切换到其他模式，确保清理在线状态
    if (gameMode === GAME_MODES.ONLINE && roomInfo) {
      // 先离开房间，等待服务器响应后再切换模式
      onlineLeaveRoom()
      // 注意：leaveRoom 内部会清理 roomInfo 和 gameState
      // 模式切换将在 useEffect 中自动处理（当 roomInfo 变为 null 时）
    } else if (mode === GAME_MODES.ONLINE) {
      // 如果切换到在线模式，显示房间模态框
      setShowRoomModal(true)
      setGameMode(mode)
    } else {
      // 本地模式切换直接重置
      setGameMode(mode)
      resetGame()
    }
  }, [resetGame, gameMode, roomInfo, onlineLeaveRoom])

  // 处理在线游戏落子
  const handleOnlineCellClick = useCallback((row, col) => {
    if (gameState?.gameOver) return
    if (gameState?.currentTurn !== roomInfo?.role) {
      return
    }
    onlinePlacePiece(row, col)
  }, [roomInfo, gameState, onlinePlacePiece])

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
    // 在线对战模式下使用 gameState.currentTurn，本地模式使用 currentPlayer
    const activePlayer = gameMode === GAME_MODES.ONLINE && roomInfo
      ? gameState.currentTurn
      : currentPlayer
    return `当前回合：${activePlayer === 'black' ? '黑棋' : '白棋'}`
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
          {gameMode === GAME_MODES.ONLINE && roomInfo ? (
            // 在线对战时间显示
            <div className="time-info">
              <span>游戏时间：{formatTime(gameState.gameTime || 0)}</span>
            </div>
          ) : (
            // 本地游戏时间显示
            <div className="time-info">
              <span>游戏时间：{formatTime(gameTime)}</span>
            </div>
          )}
          <div className="player-times">
            {gameMode === GAME_MODES.ONLINE && roomInfo ? (
              // 在线对战玩家时间
              <>
                <span>黑棋时间：{formatTime(gameState.blackTime || 0)}</span>
                <span>白棋时间：{formatTime(gameState.whiteTime || 0)}</span>
              </>
            ) : (
              // 本地游戏玩家时间
              <>
                <span>黑棋时间：{formatTime(blackTime || 0)}</span>
                <span>白棋时间：{formatTime(whiteTime || 0)}</span>
              </>
            )}
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
          {/* 在线游戏时显示房间管理按钮 */}
          {gameMode === GAME_MODES.ONLINE && roomInfo ? (
            <button onClick={() => setShowRoomModal(true)} className="room-button">房间管理</button>
          ) : (
            <button onClick={() => setShowSettingsModal(true)} className="settings-button">设置</button>
          )}
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
        <button 
          className={gameMode === GAME_MODES.ONLINE ? 'active' : ''} 
          onClick={() => { 
            // 如果已在在线模式且有房间，打开房间管理；否则切换模式
            if (gameMode === GAME_MODES.ONLINE && roomInfo) {
              setShowRoomModal(true)
            } else {
              handleModeChange(GAME_MODES.ONLINE)
            }
            playSound('click', soundEnabled); 
          }}
        >
          在线对战
        </button>
        {moveHistory.length > 0 && (
          <button onClick={startReplay} className="replay-button">回放</button>
        )}
      </div>

      {/* 棋盘 */}
      <div className="game-board">
        <Board 
          board={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.board : board} 
          onCellClick={gameMode === GAME_MODES.ONLINE && roomInfo ? handleOnlineCellClick : handleCellClick} 
          currentPlayer={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.currentTurn : currentPlayer}
          gameOver={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.gameOver : gameOver}
          theme={theme}
          lastMove={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.lastMove : null}
        />
      </div>

      {/* 胜利模态框 */}
      <VictoryModal
        isOpen={showVictoryModal}
        isDraw={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.isDraw : isDraw}
        winner={gameMode === GAME_MODES.ONLINE && roomInfo ? gameState.winner : winner}
        gameTime={gameMode === GAME_MODES.ONLINE && roomInfo ? (gameState.gameTime || 0) : gameTime}
        blackTime={gameMode === GAME_MODES.ONLINE && roomInfo ? (gameState.blackTime || 0) : blackTime}
        whiteTime={gameMode === GAME_MODES.ONLINE && roomInfo ? (gameState.whiteTime || 0) : whiteTime}
        moveCount={gameMode === GAME_MODES.ONLINE && roomInfo ? (gameState.board?.flat().filter(c => c !== null).length || 0) : moveHistory.length}
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

      {/* 房间模态框 */}
      <RoomModal
        isOpen={showRoomModal}
        isConnected={isConnected}
        roomInfo={roomInfo}
        gameState={gameState}
        error={onlineError}
        soundEnabled={soundEnabled}
        onClose={() => setShowRoomModal(false)}
        onCreateRoom={onlineCreateRoom}
        onJoinRoom={onlineJoinRoom}
        onLeaveRoom={onlineLeaveRoom}
        onClearError={clearOnlineError}
      />

      {/* 隐藏的背景音乐音频元素 */}
      <audio ref={bgMusicRef} loop>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>

      <div className="footer">
        <p>©️狮王李 保留所有权利 2026 | 版本 v1.2.1</p>
      </div>
    </div>
  )
}

export default App
