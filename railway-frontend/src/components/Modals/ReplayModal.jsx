import React, { useState, useEffect, useRef } from 'react'

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
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const modalRef = useRef(null)

  // 获取触摸或鼠标位置
  const getClientPosition = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  // 鼠标/触摸移动事件处理
  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        const { x, y } = getClientPosition(e)
        setPosition({
          x: x - dragOffset.x,
          y: y - dragOffset.y
        })
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      // 鼠标事件
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
      // 触摸事件
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      document.addEventListener('touchcancel', handleEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    }
  }, [isDragging, dragOffset])

  // 开始拖拽（鼠标+触摸）
  const handleStart = (e) => {
    // 防止触摸时触发滚动
    if (e.type === 'touchstart') {
      e.preventDefault()
    }
    const { x, y } = getClientPosition(e)
    setIsDragging(true)
    setDragOffset({
      x: x - position.x,
      y: y - position.y
    })
  }

  // 模态框打开时重置位置
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div 
        ref={modalRef}
        className="modal-content replay-modal"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          touchAction: 'none'
        }}
      >
        <div 
          className="modal-drag-handle" 
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <h2>回放模式</h2>
        </div>
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
