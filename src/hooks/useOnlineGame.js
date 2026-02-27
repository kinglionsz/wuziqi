import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

// Socket.io 服务器地址
// 生产环境使用 VITE_SOCKET_URL 环境变量，开发环境默认 localhost:3000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000')

// 生成或获取唯一用户 ID
const getUserId = () => {
  let userId = localStorage.getItem('wuziqi_user_id')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('wuziqi_user_id', userId)
  }
  return userId
}

/**
 * 在线对战游戏 Hook
 * 处理 Socket.io 连接、房间管理、游戏逻辑
 */
export const useOnlineGame = () => {
  const socketRef = useRef(null)
  const userIdRef = useRef(getUserId())
  const reconnectAttemptsRef = useRef(0)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [roomInfo, setRoomInfo] = useState(null)
  const [error, setError] = useState(null)
  const [gameState, setGameState] = useState({
    board: null,
    currentTurn: 'black',
    gameOver: false,
    winner: null,
    isDraw: false
  })

  // 初始化 Socket 连接
  useEffect(() => {
    const userId = userIdRef.current
    const savedRoomId = localStorage.getItem('wuziqi_current_room')
    
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('[Socket] 已连接到服务器:', SOCKET_URL)
      setIsConnected(true)
      setError(null)
      
      // 连接成功后立即进行身份认证
      socketInstance.emit('authenticate', { 
        userId, 
        roomId: savedRoomId 
      }, (response) => {
        if (response.success && response.reconnected) {
          console.log('[Socket] 成功恢复房间:', response.roomId)
          setIsReconnecting(false)
          
          // 恢复房间信息
          setRoomInfo({
            roomId: response.roomId,
            role: response.role,
            status: response.room.status,
            isHost: response.role === 'black'
          })
          
          // 恢复游戏状态
          setGameState({
            board: response.room.board,
            currentTurn: response.room.currentTurn,
            gameOver: response.room.status === 'finished',
            winner: response.room.winner,
            isDraw: response.room.isDraw || false
          })
          
          // 清除保存的房间（如果游戏已结束）
          if (response.room.status === 'finished') {
            localStorage.removeItem('wuziqi_current_room')
          }
        } else {
          console.log('[Socket] 新连接，无房间需要恢复')
          localStorage.removeItem('wuziqi_current_room')
        }
      })
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] 已断开连接，原因:', reason)
      setIsConnected(false)
      
      // 如果正在游戏中，标记为重连状态
      if (roomInfo && roomInfo.status === 'playing' && !gameState.gameOver) {
        setIsReconnecting(true)
        setError('连接断开，正在尝试重连...')
        
        // 保存当前房间号以便重连
        localStorage.setItem('wuziqi_current_room', roomInfo.roomId)
      }
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[Socket] 重新连接成功，尝试次数:', attemptNumber)
      reconnectAttemptsRef.current = attemptNumber
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] 尝试重连:', attemptNumber)
      setError(`正在重连... (${attemptNumber}/10)`)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('[Socket] 重连失败')
      setIsReconnecting(false)
      setError('无法重新连接到服务器，请刷新页面重试')
      localStorage.removeItem('wuziqi_current_room')
    })

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message)
      if (!isReconnecting) {
        setError('无法连接到服务器，请检查网络连接')
      }
    })

    // 监听房间创建成功
    socketInstance.on('room_created', (data) => {
      console.log('[Socket] 房间创建成功:', data)
      setRoomInfo({
        roomId: data.roomId,
        role: data.role,
        status: 'waiting',
        isHost: true
      })
      setGameState({
        board: data.board,
        currentTurn: data.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false
      })
    })

    // 监听加入成功
    socketInstance.on('join_success', (data) => {
      console.log('[Socket] 加入房间成功:', data)
      setRoomInfo({
        roomId: data.roomId,
        role: data.role,
        status: 'playing',
        isHost: false
      })
      setGameState({
        board: data.board,
        currentTurn: data.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false
      })
    })

    // 监听加入失败
    socketInstance.on('join_error', (data) => {
      console.error('[Socket] 加入房间失败:', data.error)
      setError(data.error)
    })

    // 监听游戏开始
    socketInstance.on('game_start', (data) => {
      console.log('[Socket] 游戏开始:', data)
      setRoomInfo(prev => prev ? { ...prev, status: 'playing' } : null)
    })

    // 监听棋盘同步
    socketInstance.on('sync_board', (data) => {
      console.log('[Socket] 棋盘同步:', data)
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn
      }))
    })

    // 监听游戏结束
    socketInstance.on('game_over', (data) => {
      console.log('[Socket] 游戏结束:', data)
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: data.winner,
        isDraw: data.isDraw || false,
        board: data.board
      }))
    })

    // 监听对手断开连接（等待重连）
    socketInstance.on('opponent_disconnected_pending', (data) => {
      console.log('[Socket] 对手暂时断开，等待重连:', data)
      setError(`对手暂时断开，等待重连... (${data.reconnectTimeout / 1000}秒)`)
      setRoomInfo(prev => prev ? { ...prev, opponentDisconnected: true } : null)
    })

    // 监听对手完全断开连接
    socketInstance.on('opponent_disconnected', (data) => {
      console.log('[Socket] 对手断开连接:', data)
      setError('对手已断开连接')
      setRoomInfo(prev => prev ? { ...prev, status: 'disconnected', opponentDisconnected: false } : null)
      localStorage.removeItem('wuziqi_current_room')
    })

    // 监听对手重连成功
    socketInstance.on('opponent_reconnected', (data) => {
      console.log('[Socket] 对手已重连:', data)
      setError(null)
      setRoomInfo(prev => prev ? { ...prev, opponentDisconnected: false } : null)
    })

    // 监听对手离开房间
    socketInstance.on('opponent_left', (data) => {
      console.log('[Socket] 对手离开房间:', data)
      setError(data.message || '对手已离开房间')
      setRoomInfo(prev => prev ? { ...prev, status: 'waiting' } : null)
    })

    // 监听房间解散
    socketInstance.on('room_closed', (data) => {
      console.log('[Socket] 房间已解散:', data)
      setError(data.reason || '房间已解散')
      setRoomInfo(null)
      setGameState({
        board: null,
        currentTurn: 'black',
        gameOver: false,
        winner: null,
        isDraw: false
      })
    })

    // 监听游戏重新开始
    socketInstance.on('game_restarted', (data) => {
      console.log('[Socket] 游戏重新开始:', data)
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false
      }))
    })

    // 监听错误
    socketInstance.on('error', (data) => {
      console.error('[Socket] 错误:', data.error)
      setError(data.error)
    })

    // 监听数据库状态（用于调试）
    socketInstance.on('db_status', (data) => {
      const { type, message, timestamp } = data
      const time = new Date(timestamp).toLocaleTimeString()
      switch (type) {
        case 'info':
          console.log(`[数据库] 💾 ${time} - ${message}`)
          break
        case 'success':
          console.log(`[数据库] ✅ ${time} - ${message}`)
          break
        case 'error':
          console.error(`[数据库] ❌ ${time} - ${message}`)
          break
        case 'disabled':
          console.warn(`[数据库] ⏭️  ${time} - ${message}`)
          break
        default:
          console.log(`[数据库] ${time} - ${message}`)
      }
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  /**
   * 创建房间
   */
  const createRoom = useCallback(() => {
    if (!socketRef.current) {
      setError('未连接到服务器')
      return
    }
    setError(null)
    socketRef.current.emit('create_room', {}, (response) => {
      console.log('[Socket] 创建房间响应:', response)
      if (!response.success) {
        setError(response.error || '创建房间失败')
        return
      }
      // 保存用户 ID 和房间号
      if (response.userId) {
        userIdRef.current = response.userId
        localStorage.setItem('wuziqi_user_id', response.userId)
      }
      localStorage.setItem('wuziqi_current_room', response.roomId)
      
      // 处理回调返回的数据
      setRoomInfo({
        roomId: response.roomId,
        role: response.role,
        status: 'waiting',
        isHost: true
      })
      setGameState({
        board: response.board,
        currentTurn: response.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false
      })
    })
  }, [])

  /**
   * 加入房间
   */
  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current) {
      setError('未连接到服务器')
      return
    }
    if (!roomId || roomId.length !== 6) {
      setError('请输入有效的6位房间号')
      return
    }
    setError(null)
    socketRef.current.emit('join_room', { roomId: roomId.toUpperCase() }, (response) => {
      console.log('[Socket] 加入房间响应:', response)
      if (!response.success) {
        setError(response.error || '加入房间失败')
        return
      }
      // 保存用户 ID 和房间号
      if (response.userId) {
        userIdRef.current = response.userId
        localStorage.setItem('wuziqi_user_id', response.userId)
      }
      localStorage.setItem('wuziqi_current_room', response.roomId)
      
      // 处理回调返回的数据
      setRoomInfo({
        roomId: response.roomId,
        role: response.role,
        status: 'playing',
        isHost: false
      })
      setGameState({
        board: response.board,
        currentTurn: response.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false
      })
    })
  }, [])

  /**
   * 落子
   */
  const placePiece = useCallback((row, col) => {
    if (!socketRef.current || !roomInfo) {
      setError('未连接到服务器或不在房间中')
      return
    }
    if (gameState.gameOver) {
      return
    }
    if (gameState.currentTurn !== roomInfo.role) {
      setError('还未轮到您落子')
      return
    }
    
    socketRef.current.emit('place_piece', {
      roomId: roomInfo.roomId,
      row,
      col
    }, (response) => {
      if (!response.success) {
        setError(response.error || '落子失败')
      }
    })
  }, [roomInfo, gameState])

  /**
   * 重新开始游戏
   */
  const restartGame = useCallback(() => {
    if (!socketRef.current || !roomInfo) {
      return
    }
    socketRef.current.emit('restart_game', {
      roomId: roomInfo.roomId
    }, (response) => {
      if (!response.success) {
        setError(response.error || '重新开始失败')
      }
    })
  }, [roomInfo])

  /**
   * 离开房间
   */
  const leaveRoom = useCallback(() => {
    // 清除本地存储的房间信息
    localStorage.removeItem('wuziqi_current_room')
    setIsReconnecting(false)
    
    if (socketRef.current && roomInfo) {
      // 添加超时处理
      const timeoutId = setTimeout(() => {
        // 超时后也清理状态
        console.warn('[离开房间超时]，强制清理状态')
        setRoomInfo(null)
        setGameState({
          board: null,
          currentTurn: 'black',
          gameOver: false,
          winner: null,
          isDraw: false
        })
        setError(null)
      }, 5000)

      socketRef.current.emit('leave_room', { roomId: roomInfo.roomId }, (response) => {
        clearTimeout(timeoutId)
        // 无论成功失败都清理状态
        if (response?.success) {
          console.log('[离开房间成功]')
        } else {
          console.error('[离开房间失败]', response?.error)
        }
        setRoomInfo(null)
        setGameState({
          board: null,
          currentTurn: 'black',
          gameOver: false,
          winner: null,
          isDraw: false
        })
        setError(null)
      })
    } else {
      // 如果没有连接，直接清理状态
      setRoomInfo(null)
      setGameState({
        board: null,
        currentTurn: 'black',
        gameOver: false,
        winner: null,
        isDraw: false
      })
      setError(null)
    }
  }, [roomInfo])

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    socket,
    isConnected,
    isReconnecting,
    roomInfo,
    gameState,
    error,
    createRoom,
    joinRoom,
    placePiece,
    restartGame,
    leaveRoom,
    clearError
  }
}
