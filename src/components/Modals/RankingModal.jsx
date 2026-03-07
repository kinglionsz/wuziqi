import React, { useState, useEffect } from 'react'
import { getRankings, getPlayerStats, updatePlayerName, getPlayerRank } from '../../lib/supabase'
import { getDeviceId, getPlayerName, setPlayerName } from '../../utils/device'
import { RANKS, getRankByRating } from '../../utils/constants'
import './RankingModal.css'

/**
 * 排名模态框
 */
export const RankingModal = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('ranking')
  const [rankings, setRankings] = useState([])
  const [playerStats, setPlayerStats] = useState(null)
  const [playerRank, setPlayerRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    const deviceId = getDeviceId()

    try {
      // 并行加载排行榜和玩家数据
      const [rankingsRes, statsRes, rankRes] = await Promise.all([
        getRankings(50),
        getPlayerStats(deviceId),
        getPlayerRank(deviceId)
      ])

      if (rankingsRes.data) {
        setRankings(rankingsRes.data)
      }

      if (statsRes.data) {
        setPlayerStats(statsRes.data)
        setNewName(statsRes.data.player_name || '')
      } else {
        // 如果没有玩家数据，创建新玩家
        const playerName = getPlayerName() || `玩家_${deviceId.slice(0, 6)}`
        const { data: newPlayer } = await import('../../lib/supabase').then(m =>
          m.getOrCreatePlayer(deviceId, playerName)
        )
        if (newPlayer) {
          setPlayerStats(newPlayer)
          setPlayerName(newPlayer.player_name)
          setNewName(newPlayer.player_name)
        }
      }

      if (rankRes.rank) {
        setPlayerRank(rankRes.rank)
      }
    } catch (error) {
      console.error('加载排名数据失败:', error)
    }

    setLoading(false)
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return

    try {
      const deviceId = getDeviceId()
      const { data } = await updatePlayerName(deviceId, newName.trim())
      if (data) {
        setPlayerStats(data)
        setPlayerName(newName.trim())
      }
      setEditingName(false)
    } catch (error) {
      console.error('更新名称失败:', error)
    }
  }

  const calculateWinRate = (stats) => {
    if (!stats || !stats.games_played) return 0
    return Math.round((stats.wins / stats.games_played) * 100)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ranking-modal" onClick={e => e.stopPropagation()}>
        <div className="ranking-header">
          <h2>排行榜 & 战绩</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ranking-tabs">
          <button
            className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            排行榜
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            我的战绩
          </button>
        </div>

        <div className="ranking-content">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              {activeTab === 'ranking' && (
                <div className="ranking-list">
                  <div className="ranking-title-bar">
                    <span className="rank-num">排名</span>
                    <span className="player-name-col">玩家</span>
                    <span className="rating-col">积分</span>
                    <span className="win-rate-col">胜率</span>
                  </div>
                  {rankings.map((player, index) => (
                    <div
                      key={player.user_id}
                      className={`ranking-item ${player.user_id === getDeviceId() ? 'current-player' : ''}`}
                    >
                      <span className="rank-num">
                        {index + 1 <= 3 ? (
                          <span className={`medal medal-${index + 1}`}>
                            {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : index + 1}
                      </span>
                      <span className="player-name-col">{player.player_name}</span>
                      <span className="rating-col">{player.rating}</span>
                      <span className="win-rate-col">
                        {player.games_played > 0
                          ? Math.round((player.wins / player.games_played) * 100)
                          : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'stats' && playerStats && (
                <div className="stats-panel">
                  <div className="player-header">
                    <div className="player-avatar">
                      {playerStats.player_name?.charAt(0) || '?'}
                    </div>
                    <div className="player-info">
                      {editingName ? (
                        <div className="name-edit">
                          <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            maxLength={12}
                            autoFocus
                          />
                          <button onClick={handleSaveName}>保存</button>
                          <button onClick={() => setEditingName(false)}>取消</button>
                        </div>
                      ) : (
                        <>
                          <h3
                            className="player-name"
                            onClick={() => setEditingName(true)}
                            title="点击修改名称"
                          >
                            {playerStats.player_name}
                          </h3>
                          <span className="edit-hint">点击修改名称</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="stats-summary">
                    <div className="stat-card main-stat">
                      <span className="stat-value">{playerStats.rating}</span>
                      <span className="stat-label">当前积分</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-value">#{playerRank || '-'}</span>
                      <span className="stat-label">排名</span>
                    </div>
                  </div>

                  {/* 段位显示 */}
                  <div className="rank-display" style={{ background: getRankByRating(playerStats.rating).color }}>
                    <span className="rank-icon">{getRankByRating(playerStats.rating).icon}</span>
                    <span className="rank-name">{getRankByRating(playerStats.rating).name}</span>
                    <span className="rank-range">
                      {getRankByRating(playerStats.rating).minRating} - {getRankByRating(playerStats.rating).maxRating === Infinity ? '∞' : getRankByRating(playerStats.rating).maxRating}
                    </span>
                  </div>

                  <div className="stats-details">
                    <div className="stat-row">
                      <span className="stat-name">总对局</span>
                      <span className="stat-value">{playerStats.games_played}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">胜利</span>
                      <span className="stat-value win">{playerStats.wins}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">失败</span>
                      <span className="stat-value loss">{playerStats.losses}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">平局</span>
                      <span className="stat-value draw">{playerStats.draws}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">胜率</span>
                      <span className="stat-value">{calculateWinRate(playerStats)}%</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">当前连胜</span>
                      <span className="stat-value streak">{playerStats.win_streak}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-name">最高连胜</span>
                      <span className="stat-value streak">{playerStats.max_streak}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}