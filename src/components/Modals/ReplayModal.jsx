import React from 'react'

/**
 * 回放模式模态框
 */
export const ReplayModal = ({ 
  isOpen, 
  moveHistory, 
  replayIndex,
  onClose,
  onReplayStep,
  onNextStep,
  onPrevStep
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content replay-modal">
        <h2>回放模式</h2>
        <div className="replay-info">
          <p>当前步数：{replayIndex + 1} / {moveHistory.length}</p>
          {replayIndex >= 0 && moveHistory[replayIndex] && (
            <p>
              落子位置：{moveHistory[replayIndex].position.row + 1}行 {moveHistory[replayIndex].position.col + 1}列 
              ({moveHistory[replayIndex].player === 'black' ? '黑棋' : '白棋'})
            </p>
          )}
        </div>
        <div className="replay-controls">
          <button onClick={() => onReplayStep(-1)} disabled={replayIndex < 0}>
            开始
          </button>
          <button onClick={onPrevStep} disabled={replayIndex <= 0}>
            上一步
          </button>
          <button onClick={onNextStep} disabled={replayIndex >= moveHistory.length - 1}>
            下一步
          </button>
          <button onClick={() => onReplayStep(moveHistory.length - 1)} disabled={replayIndex >= moveHistory.length - 1}>
            结束
          </button>
        </div>
        <button onClick={onClose} className="modal-button">退出回放</button>
      </div>
    </div>
  )
}
