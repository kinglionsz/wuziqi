import { useState, useEffect, useRef, useCallback } from 'react'
import Board from './components/Board'
import './App.css'

// 主题配置
const THEMES = {
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

// AI 算法 - 评分系统
const AI_PLAYER = 'white'
const HUMAN_PLAYER = 'black'

const evaluatePosition = (board, row, col, player) => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  let score = 0

  for (const [dx, dy] of directions) {
    let count = 1
    let openEnds = 0
    let blocked = 0

    // 正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx
      const newCol = col + i * dy
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        if (board[newRow][newCol] === player) count++
        else if (board[newRow][newCol] === null) { openEnds++; break }
        else { blocked++; break }
      } else { blocked++; break }
    }

    // 反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx
      const newCol = col - i * dy
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
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

const findBestMove = (board, aiPlayer) => {
  let bestScore = -Infinity
  let bestMove = null

  const center = 7

  // 检查棋盘是否为空
  let isEmptyBoard = true
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col]) {
        isEmptyBoard = false
        break
      }
    }
    if (!isEmptyBoard) break
  }

  // 如果是空棋盘，直接返回中心位置
  if (isEmptyBoard) {
    return { row: 7, col: 7 }
  }

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (!board[row][col]) {
        // 检查是否有相邻棋子
        let hasNeighbor = false
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue
            const nr = row + dr
            const nc = col + dc
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc]) {
              hasNeighbor = true
              break
            }
          }
          if (hasNeighbor) break
        }

        const distFromCenter = Math.abs(row - center) + Math.abs(col - center)
        
        // 评估攻和守
        const attackScore = evaluatePosition(board, row, col, aiPlayer)
        const defendScore = evaluatePosition(board, row, col, aiPlayer === AI_PLAYER ? HUMAN_PLAYER : AI_PLAYER)
        
        let totalScore = attackScore + defendScore * 0.9
        
        if (hasNeighbor) {
          if (distFromCenter <= 2) totalScore *= 1.5
          else if (distFromCenter <= 4) totalScore *= 1.2
        } else if (distFromCenter <= 2) {
          totalScore += 5
        }

        if (totalScore > bestScore) {
          bestScore = totalScore
          bestMove = { row, col }
        }
      }
    }
  }

  // 如果没有找到最佳位置（所有位置评分相同为0），返回中心附近
  if (!bestMove) {
    return { row: 7, col: 7 }
  }

  return bestMove
}

function App() {
  const BOARD_SIZE = 15
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null))
  )
  const [currentPlayer, setCurrentPlayer] = useState('black')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [blackTime, setBlackTime] = useState(0)
  const [whiteTime, setWhiteTime] = useState(0)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [moveHistory, setMoveHistory] = useState([])
  
  // 新增功能状态
  const [gameMode, setGameMode] = useState('pvp') // pvp, pve, online
  const [aiLevel, setAiLevel] = useState('medium')
  const [theme, setTheme] = useState('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [bgMusicEnabled, setBgMusicEnabled] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [replayIndex, setReplayIndex] = useState(-1)
  const [gameRecords, setGameRecords] = useState([])
  
  // 在线对战
  const [roomId, setRoomId] = useState('')
  const [playerColor, setPlayerColor] = useState(null)
  const [onlinePlayer, setOnlinePlayer] = useState(null)
  const [isInRoom, setIsInRoom] = useState(false)
  
  const gameStartTime = useRef(null)
  const turnStartTime = useRef(null)
  const audioRef = useRef(null)
  const bgMusicRef = useRef(null)
  const aiMoveRef = useRef(false)

  // 音效播放
  const playSound = useCallback((type) => {
    if (!soundEnabled) return
    
    const sounds = {
      place: () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 800
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
      },
      win: () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const notes = [523, 659, 784, 1047]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3)
          osc.start(ctx.currentTime + i * 0.15)
          osc.stop(ctx.currentTime + i * 0.15 + 0.3)
        })
      },
      click: () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 400
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.05)
      }
    }
    
    sounds[type]?.()
  }, [soundEnabled])

  // 背景音乐
  useEffect(() => {
    if (bgMusicEnabled && bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {})
    } else if (bgMusicRef.current) {
      bgMusicRef.current.pause()
    }
  }, [bgMusicEnabled])

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
  }, [])

  // AI 落子 - 使用 ref 避免依赖循环
  useEffect(() => {
    if (gameMode === 'pve' && currentPlayer === AI_PLAYER && !gameOver && !aiMoveRef.current) {
      aiMoveRef.current = true
      setTimeout(() => {
        const bestMove = findBestMove(board, AI_PLAYER)
        if (bestMove) {
          handleCellClick(bestMove.row, bestMove.col)
        }
        aiMoveRef.current = false
      }, 500)
    }
  }, [currentPlayer, gameMode, gameOver])

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const checkWinner = (row, col, player) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]

    for (const [dx, dy] of directions) {
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

  const handleCellClick = (row, col) => {
    if (gameOver || board[row][col]) return
    
    // 在线对战模式下检查是否轮到正确玩家
    if (gameMode === 'online' && playerColor && currentPlayer !== playerColor) return

    playSound('place')

    if (turnStartTime.current) {
      const turnTime = Math.floor((Date.now() - turnStartTime.current) / 1000)
      if (currentPlayer === 'black') setBlackTime(prev => prev + turnTime)
      else setWhiteTime(prev => prev + turnTime)
    }

    const newBoard = [...board]
    newBoard[row] = [...newBoard[row]]
    newBoard[row][col] = currentPlayer
    setBoard(newBoard)

    setMoveHistory(prev => [...prev, {
      board: JSON.parse(JSON.stringify(board)),
      player: currentPlayer,
      position: { row, col },
      blackTime: currentPlayer === 'black' ? blackTime + Math.floor((Date.now() - turnStartTime.current) / 1000) : blackTime,
      whiteTime: currentPlayer === 'white' ? whiteTime + Math.floor((Date.now() - turnStartTime.current) / 1000) : whiteTime,
      gameTime
    }])

    if (checkWinner(row, col, currentPlayer)) {
      setGameOver(true)
      setWinner(currentPlayer)
      setIsDraw(false)
      playSound('win')
      // 保存游戏记录
      saveGameRecord(currentPlayer)
      setTimeout(() => setShowVictoryModal(true), 500)
    } else {
      const isBoardFull = newBoard.every(row => row.every(cell => cell !== null))
      if (isBoardFull) {
        setGameOver(true)
        setIsDraw(true)
        setWinner(null)
        saveGameRecord(null)
        setTimeout(() => setShowVictoryModal(true), 500)
      } else {
        setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black')
        turnStartTime.current = Date.now()
      }
    }
  }

  const saveGameRecord = (winner) => {
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      winner: winner === 'black' ? '黑棋' : winner === 'white' ? '白棋' : '平局',
      mode: gameMode === 'pvp' ? '双人对战' : gameMode === 'pve' ? '人机对战' : '在线对战',
      moves: moveHistory.length,
      duration: formatTime(gameTime),
      theme: THEMES[theme].name
    }
    setGameRecords(prev => [record, ...prev].slice(0, 50))
    localStorage.setItem('gomoku_records', JSON.stringify([record, ...gameRecords].slice(0, 50)))
  }

  const loadGameRecords = () => {
    const saved = localStorage.getItem('gomoku_records')
    if (saved) setGameRecords(JSON.parse(saved))
  }

  useEffect(() => {
    loadGameRecords()
  }, [])

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
    setCurrentPlayer('black')
    setGameOver(false)
    setWinner(null)
    setIsDraw(false)
    setGameTime(0)
    setBlackTime(0)
    setWhiteTime(0)
    setShowVictoryModal(false)
    setMoveHistory([])
    setReplayIndex(-1)
    aiMoveRef.current = false
    gameStartTime.current = Date.now()
    turnStartTime.current = Date.now()
  }

  const undoMove = () => {
    if (moveHistory.length === 0 || gameOver) return
    
    // 人机模式下只能撤销两步
    if (gameMode === 'pve' && moveHistory.length < 2) return

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
    setShowVictoryModal(false)
    turnStartTime.current = Date.now()
  }

  // 回放功能
  const startReplay = () => {
    if (moveHistory.length === 0) return
    setShowReplayModal(true)
    setReplayIndex(0)
  }

  const replayStep = (step) => {
    if (step < 0) {
      setBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
    } else if (step < moveHistory.length) {
      setBoard(moveHistory[step].board)
    }
    setReplayIndex(step)
  }

  const nextReplayStep = () => {
    if (replayIndex < moveHistory.length - 1) {
      replayStep(replayIndex + 1)
    }
  }

  const prevReplayStep = () => {
    if (replayIndex > 0) {
      replayStep(replayIndex - 1)
    }
  }

  // 加载游戏记录回放
  const loadRecordReplay = (record) => {
    // 这里可以扩展为从服务器加载
    alert('游戏记录回放功能需要保存完整棋谱')
  }

  // 在线对战 - 创建/加入房间
  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    setPlayerColor('black')
    setIsInRoom(true)
    setOnlinePlayer('black')
    resetGame()
    setGameMode('online')
    playSound('click')
  }

  const joinRoom = () => {
    if (!roomId) return
    setPlayerColor('white')
    setIsInRoom(true)
    setOnlinePlayer('white')
    setGameMode('online')
    playSound('click')
  }

  const leaveRoom = () => {
    setRoomId('')
    setPlayerColor(null)
    setIsInRoom(false)
    setOnlinePlayer(null)
    setGameMode('pvp')
    resetGame()
  }

  const currentTheme = THEMES[theme]

  return (
    <div className="app" style={{ background: currentTheme.background, color: currentTheme.textColor }}>
      <h1>五子棋游戏</h1>
      
      <div className="game-info">
        <div className="info-section">
          {gameOver ? (
            isDraw ? <p className="game-status">游戏结束！平局！</p> :
            <p className="game-status">游戏结束！{winner === 'black' ? '黑棋' : '白棋'}获胜！</p>
          ) : (
            <p className="game-status">
              {gameMode === 'pve' && currentPlayer === AI_PLAYER ? 'AI 思考中...' : 
               `当前回合：${currentPlayer === 'black' ? '黑棋' : '白棋'}`}
              {gameMode === 'online' && playerColor && currentPlayer !== playerColor && ' (等待对手)'}
            </p>
          )}
        </div>
        
        <div className="time-section">
          <div className="time-info"><span>游戏时间：{formatTime(gameTime)}</span></div>
          <div className="player-times">
            <span>黑棋时间：{formatTime(blackTime)}</span>
            <span>白棋时间：{formatTime(whiteTime)}</span>
          </div>
        </div>
        
        <div className="button-section">
          <button onClick={resetGame} className="reset-button">重新开始</button>
          <button onClick={undoMove} className="undo-button" 
            disabled={moveHistory.length === 0 || gameOver || (gameMode === 'pve' && moveHistory.length < 2)}>
            悔棋
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="settings-button">设置</button>
          <button onClick={() => setShowRulesModal(true)} className="rules-button">规则</button>
        </div>
      </div>

      <div className="game-mode-bar">
        <button className={gameMode === 'pvp' ? 'active' : ''} onClick={() => { setGameMode('pvp'); resetGame(); playSound('click') }}>
          双人对战
        </button>
        <button className={gameMode === 'pve' ? 'active' : ''} onClick={() => { setGameMode('pve'); resetGame(); playSound('click') }}>
          人机对战
        </button>
        <button className={gameMode === 'online' ? 'active' : ''} onClick={() => setShowSettingsModal(true)}>
          在线对战
        </button>
        {moveHistory.length > 0 && (
          <button onClick={startReplay} className="replay-button">回放</button>
        )}
      </div>

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
      {showVictoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>游戏结束！</h2>
            {isDraw ? <p className="winner-text">平局！</p> :
             <p className="winner-text">{winner === 'black' ? '黑棋' : '白棋'}获胜！</p>}
            <div className="game-stats">
              <p>游戏总时间：{formatTime(gameTime)}</p>
              <p>黑棋用时：{formatTime(blackTime)}</p>
              <p>白棋用时：{formatTime(whiteTime)}</p>
              <p>总步数：{moveHistory.length}</p>
            </div>
            <button onClick={resetGame} className="modal-button">再来一局</button>
          </div>
        </div>
      )}

      {/* 游戏规则模态框 */}
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal-content rules-modal">
            <h2>五子棋游戏规则</h2>
            <div className="rules-content">
              <h3>基本规则</h3>
              <ul>
                <li>黑白双方轮流在棋盘上落子</li>
                <li>黑棋先行</li>
                <li>率先在一条直线连成五子的一方获胜</li>
                <li>棋盘下满无子可落且无一方获胜，则为平局</li>
              </ul>
              <h3>操作说明</h3>
              <ul>
                <li>点击棋盘空白处落子</li>
                <li>鼠标悬停可预览落子位置</li>
                <li>点击「悔棋」撤销上一步</li>
                <li>点击「回放」查看棋局</li>
              </ul>
            </div>
            <button onClick={() => setShowRulesModal(false)} className="modal-button">关闭</button>
          </div>
        </div>
      )}

      {/* 设置模态框 */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content settings-modal">
            <h2>游戏设置</h2>
            
            <div className="settings-section">
              <h3>游戏模式</h3>
              <div className="mode-buttons">
                <button className={gameMode === 'pvp' ? 'active' : ''} onClick={() => { setGameMode('pvp'); resetGame(); playSound('click') }}>
                  双人对战
                </button>
                <button className={gameMode === 'pve' ? 'active' : ''} onClick={() => { setGameMode('pve'); resetGame(); playSound('click') }}>
                  人机对战
                </button>
              </div>
            </div>

            {gameMode === 'pve' && (
              <div className="settings-section">
                <h3>AI 难度</h3>
                <div className="ai-level-buttons">
                  <button className={aiLevel === 'easy' ? 'active' : ''} onClick={() => { setAiLevel('easy'); playSound('click') }}>简单</button>
                  <button className={aiLevel === 'medium' ? 'active' : ''} onClick={() => { setAiLevel('medium'); playSound('click') }}>中等</button>
                  <button className={aiLevel === 'hard' ? 'active' : ''} onClick={() => { setAiLevel('hard'); playSound('click') }}>困难</button>
                </div>
              </div>
            )}

            <div className="settings-section">
              <h3>主题选择</h3>
              <div className="theme-buttons">
                {Object.entries(THEMES).map(([key, value]) => (
                  <button 
                    key={key}
                    className={theme === key ? 'active' : ''} 
                    onClick={() => { setTheme(key); playSound('click') }}
                    style={{ background: value.background }}
                  >
                    {value.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>音效设置</h3>
              <div className="toggle-buttons">
                <button className={soundEnabled ? 'active toggle-on' : 'toggle-off'} onClick={() => { setSoundEnabled(!soundEnabled); playSound('click') }}>
                  音效 {soundEnabled ? '开' : '关'}
                </button>
                <button className={bgMusicEnabled ? 'active toggle-on' : 'toggle-off'} onClick={() => { setBgMusicEnabled(!bgMusicEnabled); playSound('click') }}>
                  背景音乐 {bgMusicEnabled ? '开' : '关'}
                </button>
              </div>
            </div>

            {gameMode === 'online' && (
              <div className="settings-section">
                <h3>在线对战</h3>
                {!isInRoom ? (
                  <div className="online-buttons">
                    <button onClick={createRoom} className="create-room-btn">创建房间</button>
                    <div className="join-room">
                      <input 
                        type="text" 
                        placeholder="输入房间号" 
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        maxLength={6}
                      />
                      <button onClick={joinRoom}>加入</button>
                    </div>
                  </div>
                ) : (
                  <div className="room-info">
                    <p>房间号：<strong>{roomId}</strong></p>
                    <p>你的颜色：{playerColor === 'black' ? '黑棋' : '白棋'}</p>
                    <button onClick={leaveRoom} className="leave-room-btn">离开房间</button>
                  </div>
                )}
              </div>
            )}

            <div className="settings-section">
              <h3>游戏记录</h3>
              <div className="records-list">
                {gameRecords.length === 0 ? (
                  <p className="no-records">暂无游戏记录</p>
                ) : (
                  gameRecords.slice(0, 5).map((record, idx) => (
                    <div key={idx} className="record-item" onClick={() => loadRecordReplay(record)}>
                      <span>{record.date}</span>
                      <span>{record.mode}</span>
                      <span>{record.winner}</span>
                      <span>{record.duration}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button onClick={() => setShowSettingsModal(false)} className="modal-button">关闭</button>
          </div>
        </div>
      )}

      {/* 回放模态框 */}
      {showReplayModal && (
        <div className="modal-overlay">
          <div className="modal-content replay-modal">
            <h2>回放模式</h2>
            <div className="replay-info">
              <p>当前步数：{replayIndex + 1} / {moveHistory.length}</p>
              {replayIndex >= 0 && moveHistory[replayIndex] && (
                <p>落子位置：{moveHistory[replayIndex].position.row + 1}行 {moveHistory[replayIndex].position.col + 1}列 ({moveHistory[replayIndex].player === 'black' ? '黑棋' : '白棋'})</p>
              )}
            </div>
            <div className="replay-controls">
              <button onClick={() => replayStep(-1)} disabled={replayIndex < 0}>开始</button>
              <button onClick={prevReplayStep} disabled={replayIndex <= 0}>上一步</button>
              <button onClick={nextReplayStep} disabled={replayIndex >= moveHistory.length - 1}>下一步</button>
              <button onClick={() => replayStep(moveHistory.length - 1)} disabled={replayIndex >= moveHistory.length - 1}>结束</button>
            </div>
            <button onClick={() => { setShowReplayModal(false); resetGame() }} className="modal-button">退出回放</button>
          </div>
        </div>
      )}

      {/* 隐藏的背景音乐音频元素 */}
      <audio ref={bgMusicRef} loop>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>

      <div className="footer">
        <p>©️狮王李 保留所有权利 2026 | 版本 v0.2</p>
      </div>
    </div>
  )
}

export default App
