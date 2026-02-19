import { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import './App.css'

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
  const gameStartTime = useRef(null)
  const turnStartTime = useRef(null)

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

  // 格式化时间为 MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const checkWinner = (row, col, player) => {
    const directions = [
      [0, 1],  // 水平
      [1, 0],  // 垂直
      [1, 1],  // 对角线
      [1, -1]  // 反对角线
    ]

    for (const [dx, dy] of directions) {
      let count = 1
      
      // 向正方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx
        const newCol = col + i * dy
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }
      
      // 向反方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx
        const newCol = col - i * dy
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }
      
      if (count >= 5) {
        return true
      }
    }
    return false
  }

  const handleCellClick = (row, col) => {
    if (gameOver || board[row][col]) return

    // 记录当前玩家的落子时间
    if (turnStartTime.current) {
      const turnTime = Math.floor((Date.now() - turnStartTime.current) / 1000)
      if (currentPlayer === 'black') {
        setBlackTime(prev => prev + turnTime)
      } else {
        setWhiteTime(prev => prev + turnTime)
      }
    }

    const newBoard = [...board]
    newBoard[row] = [...newBoard[row]]
    newBoard[row][col] = currentPlayer
    setBoard(newBoard)

    // 记录棋步历史
    setMoveHistory(prev => [...prev, {
      board: JSON.parse(JSON.stringify(board)),
      player: currentPlayer,
      position: { row, col },
      blackTime,
      whiteTime,
      gameTime
    }])

    if (checkWinner(row, col, currentPlayer)) {
      setGameOver(true)
      setWinner(currentPlayer)
      setIsDraw(false)
      // 显示胜利模态框
      setTimeout(() => {
        setShowVictoryModal(true)
      }, 500)
    } else {
      // 检查是否平局（棋盘已满）
      const isBoardFull = newBoard.every(row => row.every(cell => cell !== null))
      if (isBoardFull) {
        setGameOver(true)
        setIsDraw(true)
        setWinner(null)
        // 显示平局模态框
        setTimeout(() => {
          setShowVictoryModal(true)
        }, 500)
      } else {
        setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black')
        // 重置回合开始时间
        turnStartTime.current = Date.now()
      }
    }
  }

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
    gameStartTime.current = Date.now()
    turnStartTime.current = Date.now()
  }

  const undoMove = () => {
    if (moveHistory.length === 0 || gameOver) return

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
    // 重置回合开始时间
    turnStartTime.current = Date.now()
  }

  return (
    <div className="app">
      <h1>五子棋游戏</h1>
      <div className="game-info">
        <div className="info-section">
          {gameOver ? (
            isDraw ? (
              <p className="game-status">游戏结束！平局！</p>
            ) : (
              <p className="game-status">游戏结束！{winner === 'black' ? '黑棋' : '白棋'}获胜！</p>
            )
          ) : (
            <p className="game-status">当前回合：{currentPlayer === 'black' ? '黑棋' : '白棋'}</p>
          )}
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
          <button onClick={resetGame} className="reset-button">
            重新开始
          </button>
          <button onClick={undoMove} className="undo-button" disabled={moveHistory.length === 0 || gameOver}>
            悔棋
          </button>
          <button onClick={() => setShowRulesModal(true)} className="rules-button">
            游戏规则
          </button>
        </div>
      </div>
      <div className="game-board">
        <Board 
          board={board} 
          onCellClick={handleCellClick} 
          currentPlayer={currentPlayer}
          gameOver={gameOver}
        />
      </div>

      {/* 游戏结束模态框 */}
      {showVictoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>游戏结束！</h2>
            {isDraw ? (
              <p className="winner-text">平局！</p>
            ) : (
              <p className="winner-text">{winner === 'black' ? '黑棋' : '白棋'}获胜！</p>
            )}
            <div className="game-stats">
              <p>游戏总时间：{formatTime(gameTime)}</p>
              <p>黑棋用时：{formatTime(blackTime)}</p>
              <p>白棋用时：{formatTime(whiteTime)}</p>
            </div>
            <button onClick={resetGame} className="modal-button">
              再来一局
            </button>
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
                <li>率先在一条直线（横、竖、斜）上连成五子的一方获胜</li>
                <li>如果棋盘下满无子可落且无一方获胜，则为平局</li>
              </ul>
              <h3>操作说明</h3>
              <ul>
                <li>点击棋盘空白处落子</li>
                <li>鼠标悬停在空白处可预览落子位置</li>
                <li>点击「悔棋」按钮可撤销上一步操作</li>
                <li>点击「重新开始」按钮可开始新游戏</li>
              </ul>
              <h3>胜负判定</h3>
              <ul>
                <li>横向：同一行连续五个同色棋子</li>
                <li>纵向：同一列连续五个同色棋子</li>
                <li>斜向：同一斜线连续五个同色棋子</li>
              </ul>
            </div>
            <button onClick={() => setShowRulesModal(false)} className="modal-button">
              关闭
            </button>
          </div>
        </div>
      )}
      
      {/* 作者信息 */}
      <div className="footer">
        <p>©️狮王李 保留所有权利 2026</p>
      </div>
    </div>
  )
}

export default App
