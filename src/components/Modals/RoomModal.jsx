import React, { useState, useEffect } from 'react'
import { playSound } from '../../utils/sound'
import './RoomModal.css'

/**
 * 房间模态框 - 创建/加入在线对战房间
 */
export const RoomModal = ({
  isOpen,
  isConnected,
  roomInfo,
  gameState,
  error,
  soundEnabled = true,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onClearError
}) => {
  const [joinRoomId, setJoinRoomId] = useState('')
  const [activeTab, setActiveTab] = useState('create')

  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setJoinRoomId('')
      setActiveTab('create')
      /* eslint-enable react-hooks/set-state-in-effect */
      onClearError()
    }
  }, [isOpen, onClearError])

  if (!isOpen) return null

  const handleCreateRoom = () => {
    playSound('click', soundEnabled)
    onCreateRoom()
  }

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) return
    playSound('click', soundEnabled)
    onJoinRoom(joinRoomId.trim())
  }

  const handleLeaveRoom = () => {
    playSound('click', soundEnabled)
    onLeaveRoom()
    // 离开房间后关闭模态框
    onClose()
  }

  const handleClose = () => {
    playSound('click', soundEnabled)
    onClose()
  }

  // 已连接但未加入房间
  const isInRoom = roomInfo !== null && roomInfo.roomId !== undefined
  const isWaiting = roomInfo?.status === 'waiting'
  const isPlaying = roomInfo?.status === 'playing'

  return (
    <div className="modal-overlay">
      <div className="modal-content room-modal">
        <h2>在线对战</h2>
        
        {/* 连接状态 */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● 已连接到服务器' : '○ 未连接服务器'}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 房间内状态 */}
        {isInRoom ? (
          <div className="room-info">
            <div className="room-id-display">
              <span className="label">房间号：</span>
              <span className="room-id">{roomInfo.roomId}</span>
            </div>
            
            <div className="player-role">
              <span className="label">您的角色：</span>
              <span className={`role ${roomInfo.role}`}>
                {roomInfo.role === 'black' ? '黑棋' : '白棋'}
              </span>
              {roomInfo.isHost && <span className="host-badge">房主</span>}
            </div>

            <div className="room-status">
              {isWaiting && <p className="waiting-text">等待对手加入...</p>}
              {isPlaying && <p className="playing-text">游戏进行中</p>}
              {roomInfo.status === 'disconnected' && <p className="disconnected-text">对手已断开连接</p>}
            </div>

            {gameState.board && (
              <div className="game-preview">
                <p>当前回合：{gameState.currentTurn === 'black' ? '黑棋' : '白棋'}</p>
                {gameState.gameOver && (
                  <p className="game-over">
                    {gameState.isDraw 
                      ? '平局！' 
                      : `${gameState.winner === 'black' ? '黑棋' : '白棋'}获胜！`}
                  </p>
                )}
              </div>
            )}

            <button onClick={handleLeaveRoom} className="leave-room-button">
              离开房间
            </button>
          </div>
        ) : (
          /* 未加入房间 - 创建/加入界面 */
          <div className="room-actions">
            {/* Tab 切换 */}
            <div className="room-tabs">
              <button 
                className={activeTab === 'create' ? 'active' : ''}
                onClick={() => setActiveTab('create')}
              >
                创建房间
              </button>
              <button 
                className={activeTab === 'join' ? 'active' : ''}
                onClick={() => setActiveTab('join')}
              >
                加入房间
              </button>
            </div>

            {/* 创建房间 */}
            {activeTab === 'create' && (
              <div className="create-room-section">
                <p>创建一个新房间，邀请朋友加入对战</p>
                <button 
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                  className="create-room-button"
                >
                  创建房间
                </button>
              </div>
            )}

            {/* 加入房间 */}
            {activeTab === 'join' && (
              <div className="join-room-section">
                <p>输入房间号加入对战</p>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="请输入6位房间号"
                  maxLength={6}
                  className="room-input"
                />
                <button 
                  onClick={handleJoinRoom}
                  disabled={!isConnected || joinRoomId.length !== 6}
                  className="join-room-button"
                >
                  加入房间
                </button>
              </div>
            )}
          </div>
        )}

        <button onClick={handleClose} className="modal-button">
          {isInRoom ? '返回游戏' : '关闭'}
        </button>
      </div>
    </div>
  )
}
