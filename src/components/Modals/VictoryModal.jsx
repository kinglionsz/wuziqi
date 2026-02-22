import React from 'react'

/**
 * 胜利/结束模态框
 */
export const VictoryModal = ({ 
  isOpen, 
  isDraw, 
  winner, 
  gameTime, 
  blackTime, 
  whiteTime, 
  moveCount,
  formatTime,
  onRestart 
}) => {
  if (!isOpen) return null

  return (
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
          <p>总步数：{moveCount}</p>
        </div>
        <button onClick={onRestart} className="modal-button">再来一局</button>
      </div>
    </div>
  )
}
