import React, { useState, useEffect } from 'react'
import { THEMES, GAME_MODES, AI_LEVELS } from '../../utils/constants'
import { playSound } from '../../utils/sound'
import { getGameRecords } from '../../lib/supabase'

/**
 * 设置模态框
 */
export const SettingsModal = ({
  isOpen,
  gameMode,
  aiLevel,
  theme,
  soundEnabled,
  bgMusicEnabled,
  onClose,
  onChangeMode,
  onChangeAiLevel,
  onChangeTheme,
  onToggleSound,
  onToggleBgMusic
}) => {
  const [localRecords, setLocalRecords] = useState([])
  const [supabaseRecords, setSupabaseRecords] = useState([])
  const [activeTab, setActiveTab] = useState('local')

  useEffect(() => {
    if (isOpen) {
      // 加载本地记录
      const saved = localStorage.getItem('gomoku_records')
      if (saved) {
        setLocalRecords(JSON.parse(saved))
      }
      
      // 加载 Supabase 记录
      const loadSupabaseRecords = async () => {
        const { data, error } = await getGameRecords(10)
        if (data && !error) {
          setSupabaseRecords(data.map(r => ({
            date: new Date(r.created_at).toLocaleString(),
            mode: r.game_mode === 'pvp' ? '双人对战' : r.game_mode === 'pve' ? '人机对战' : '在线对战',
            winner: r.winner === 'black' ? '黑棋' : r.winner === 'white' ? '白棋' : '平局',
            duration: `${Math.floor(r.duration_seconds / 60)}:${(r.duration_seconds % 60).toString().padStart(2, '0')}`,
            moves: r.moves
          })))
        }
      }
      loadSupabaseRecords()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleModeChange = (mode) => {
    onChangeMode(mode)
    playSound('click', soundEnabled)
  }

  const handleAiLevelChange = (level) => {
    onChangeAiLevel(level)
    playSound('click', soundEnabled)
  }

  const handleThemeChange = (newTheme) => {
    onChangeTheme(newTheme)
    playSound('click', soundEnabled)
  }

  const handleToggleSound = () => {
    onToggleSound()
    playSound('click', soundEnabled)
  }

  const handleToggleBgMusic = () => {
    onToggleBgMusic()
    playSound('click', soundEnabled)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <h2>游戏设置</h2>
        
        <div className="settings-section">
          <h3>游戏模式</h3>
          <div className="mode-buttons">
            <button 
              className={gameMode === GAME_MODES.PVP ? 'active' : ''} 
              onClick={() => handleModeChange(GAME_MODES.PVP)}
            >
              双人对战
            </button>
            <button 
              className={gameMode === GAME_MODES.PVE ? 'active' : ''} 
              onClick={() => handleModeChange(GAME_MODES.PVE)}
            >
              人机对战
            </button>
          </div>
        </div>

        {gameMode === GAME_MODES.PVE && (
          <div className="settings-section">
            <h3>AI 难度</h3>
            <div className="ai-level-buttons">
              <button 
                className={aiLevel === AI_LEVELS.EASY ? 'active' : ''} 
                onClick={() => handleAiLevelChange(AI_LEVELS.EASY)}
              >
                简单
              </button>
              <button 
                className={aiLevel === AI_LEVELS.MEDIUM ? 'active' : ''} 
                onClick={() => handleAiLevelChange(AI_LEVELS.MEDIUM)}
              >
                中等
              </button>
              <button 
                className={aiLevel === AI_LEVELS.HARD ? 'active' : ''} 
                onClick={() => handleAiLevelChange(AI_LEVELS.HARD)}
              >
                困难
              </button>
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
                onClick={() => handleThemeChange(key)}
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
            <button 
              className={soundEnabled ? 'active toggle-on' : 'toggle-off'} 
              onClick={handleToggleSound}
            >
              音效 {soundEnabled ? '开' : '关'}
            </button>
            <button 
              className={bgMusicEnabled ? 'active toggle-on' : 'toggle-off'} 
              onClick={handleToggleBgMusic}
            >
              背景音乐 {bgMusicEnabled ? '开' : '关'}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>游戏记录</h3>
          <div className="record-tabs">
            <button 
              className={activeTab === 'local' ? 'active' : ''}
              onClick={() => setActiveTab('local')}
            >
              本地记录
            </button>
            <button 
              className={activeTab === 'cloud' ? 'active' : ''}
              onClick={() => setActiveTab('cloud')}
            >
              云端记录
            </button>
          </div>
          <div className="records-list">
            {activeTab === 'local' ? (
              localRecords.length === 0 ? (
                <p className="no-records">暂无本地游戏记录</p>
              ) : (
                localRecords.slice(0, 5).map((record, idx) => (
                  <div key={idx} className="record-item">
                    <span>{record.date}</span>
                    <span>{record.mode}</span>
                    <span>{record.winner}</span>
                    <span>{record.duration}</span>
                  </div>
                ))
              )
            ) : (
              supabaseRecords.length === 0 ? (
                <p className="no-records">暂无云端游戏记录</p>
              ) : (
                supabaseRecords.map((record, idx) => (
                  <div key={idx} className="record-item">
                    <span>{record.date}</span>
                    <span>{record.mode}</span>
                    <span>{record.winner}</span>
                    <span>{record.duration}</span>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <button onClick={onClose} className="modal-button">关闭</button>
      </div>
    </div>
  )
}
