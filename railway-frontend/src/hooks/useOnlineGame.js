import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

// Socket.io 服务器地址 - 直接硬编码 Railway 后端
const SOCKET_URL = 'https://wuziqi-railway-production.up.railway.app'

// 获取服务器 token（用于身份验证）
const getServerToken = async () => {
  try {
    const response = await fetch(`${SOCKET_URL}/api/token`)
    const data = await response.json()
    return data.token
  } catch (error) {
    console.warn('[Token] 获取失败，使用空 token:', error)
    return null
  }
}

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
  
  // 前端计时器 refs - 用于实时更新时间显示
  const timerRef = useRef(null)
  const gameStartTimeRef = useRef(null)  // 游戏开始时间
  const turnStartTimeRef = useRef(null)   // 当前回合开始时间
  const accumulatedBlackTimeRef = useRef(0)  // 黑方累计时间
  const accumulatedWhiteTimeRef = useRef(0)   // 白方累计时间
  const prevTurnRef = useRef(null)  // 追踪上一回合，避免竞态条件
  
  // 重置计时器的辅助函数
  const resetTimer = useCallback((serverBlackTime = 0, serverWhiteTime = 0) => {
    gameStartTimeRef.current = Date.now()
    turnStartTimeRef.current = Date.now()
    prevTurnRef.current = 'black'  // 黑方先手
    // 如果有服务端同步过来的初始时间，使用它（转换为毫秒）
    accumulatedBlackTimeRef.current = serverBlackTime * 1000
    accumulatedWhiteTimeRef.current = serverWhiteTime * 1000
  }, [])
  
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
    isDraw: false,
    // 时间相关
    blackTime: 0,
    whiteTime: 0,
    gameTime: 0
  })

  // 使用 refs 存储最新的 roomInfo 和 gameState，避免闭包问题
  const roomInfoRef = useRef(roomInfo)
  const gameStateRef = useRef(gameState)

  // 更新 refs
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

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

    socketInstance.on('connect', async () => {
      console.log('[Socket] 已连接到服务器:', SOCKET_URL)
      setIsConnected(true)
      setError(null)

      // 获取服务器 token 进行身份验证
      const token = await getServerToken()

      // 连接成功后立即进行身份认证
      socketInstance.emit('authenticate', {
        userId,
        roomId: savedRoomId,
        token
      }, (response) => {
        console.log('[Socket] 认证响应:', response)
        if (response.success && response.reconnected) {
          console.log('[Socket] 成功恢复房间:', response.roomId, '角色:', response.role)
          setIsReconnecting(false)
          
          // 恢复房间信息
          const newRoomInfo = {
            roomId: response.roomId,
            role: response.role,
            status: response.room.status,
            isHost: response.role === 'black'
          }
          console.log('[Socket] 设置 roomInfo:', newRoomInfo)
          setRoomInfo(newRoomInfo)
          
          // 恢复游戏状态
          const newGameState = {
            board: response.room.board,
            currentTurn: response.room.currentTurn,
            gameOver: response.room.status === 'finished',
            winner: response.room.winner,
            isDraw: response.room.isDraw || false
          }
          console.log('[Socket] 设置 gameState:', newGameState)
          setGameState(newGameState)
          
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

      // 使用 refs 获取最新状态，避免闭包问题
      const currentRoomInfo = roomInfoRef.current
      const currentGameState = gameStateRef.current

      // 如果正在游戏中，标记为重连状态
      if (currentRoomInfo && currentRoomInfo.status === 'playing' && !currentGameState.gameOver) {
        setIsReconnecting(true)
        setError('连接断开，正在尝试重连...')

        // 保存当前房间号以便重连
        localStorage.setItem('wuziqi_current_room', currentRoomInfo.roomId)
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
      // 重置计时器
      resetTimer()
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
      // 重置计时器
      resetTimer()
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
      // 重置计时器
      resetTimer()
      setRoomInfo(prev => prev ? { ...prev, status: 'playing' } : null)
    })

    // 监听棋盘同步
    socketInstance.on('sync_board', (data) => {
      console.log('[Socket] 棋盘同步:', data)
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn,
        lastMove: data.lastMove || null,
        // 接收时间数据
        blackTime: data.blackTime || 0,
        whiteTime: data.whiteTime || 0,
        gameTime: data.gameTime || 0
      }))
    })

    // 监听游戏结束
    socketInstance.on('game_over', (data) => {
      console.log('[Socket] 游戏结束:', data)
      // 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: data.winner,
        isDraw: data.isDraw || false,
        board: data.board,
        // 接收最终时间数据
        blackTime: data.blackTime || 0,
        whiteTime: data.whiteTime || 0,
        gameTime: data.gameTime || 0
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
      setRoomInfo(prev => prev ? { 
        ...prev, 
        opponentDisconnected: false,
        status: data.room?.status || prev.status
      } : null)
      
      // 更新游戏状态（如果有房间数据）
      if (data.room) {
        setGameState({
          board: data.room.board,
          currentTurn: data.room.currentTurn,
          gameOver: data.room.status === 'finished',
          winner: data.room.winner,
          isDraw: data.room.isDraw || false
        })
      }
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
      // 重置计时器
      resetTimer()
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn,
        gameOver: false,
        winner: null,
        isDraw: false,
        blackTime: 0,
        whiteTime: 0,
        gameTime: 0
      }))
    })

    // 监听观众加入
    socketInstance.on('spectator_joined', (data) => {
      console.log('[Socket] 观众加入:', data)
      setRoomInfo(prev => prev ? {
        ...prev,
        spectators: [...(prev.spectators || []), { userId: data.userId }]
      } : null)
    })

    // 监听观众离开
    socketInstance.on('spectator_left', (data) => {
      console.log('[Socket] 观众离开:', data)
      setRoomInfo(prev => prev ? {
        ...prev,
        spectators: (prev.spectators || []).filter(s => s.userId !== data.userId)
      } : null)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 前端计时器：实时更新游戏时间显示（合并回合切换逻辑，消除竞态条件）
  useEffect(() => {
    // 清理之前的计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // 只有在游戏进行中且房间存在时才启动计时器
    const isPlaying = roomInfo && roomInfo.status === 'playing' && !gameState.gameOver
    
    if (isPlaying) {
      const currentTurn = gameState.currentTurn
      const now = Date.now()
      
      // 处理回合切换（使用 ref 追踪上一回合，避免重复计算）
      if (prevTurnRef.current && prevTurnRef.current !== currentTurn) {
        // 回合已切换，累加上一回合的时间
        const turnDuration = now - turnStartTimeRef.current
        if (prevTurnRef.current === 'black') {
          accumulatedBlackTimeRef.current += turnDuration
        } else if (prevTurnRef.current === 'white') {
          accumulatedWhiteTimeRef.current += turnDuration
        }
        // 更新回合开始时间
        turnStartTimeRef.current = now
      } else if (!prevTurnRef.current) {
        // 首次启动，初始化
        turnStartTimeRef.current = now
      }
      
      // 更新当前回合追踪
      prevTurnRef.current = currentTurn
      
      // 首次启动计时器时，初始化游戏开始时间
      if (!gameStartTimeRef.current) {
        gameStartTimeRef.current = now
        // 如果有服务端同步过来的初始时间，使用它
        if (gameState.blackTime > 0) {
          accumulatedBlackTimeRef.current = gameState.blackTime * 1000
        }
        if (gameState.whiteTime > 0) {
          accumulatedWhiteTimeRef.current = gameState.whiteTime * 1000
        }
      }
      
      // 启动每秒更新计时器
      timerRef.current = setInterval(() => {
        const intervalNow = Date.now()
        const intervalTurn = prevTurnRef.current
        
        // 计算游戏总时长
        const totalGameTime = Math.floor((intervalNow - gameStartTimeRef.current) / 1000)
        
        // 计算当前玩家已用时间（累计时间 + 当前回合已用时间）
        const currentTurnDuration = intervalNow - turnStartTimeRef.current
        let displayBlackTime = accumulatedBlackTimeRef.current
        let displayWhiteTime = accumulatedWhiteTimeRef.current
        
        if (intervalTurn === 'black') {
          displayBlackTime += currentTurnDuration
        } else if (intervalTurn === 'white') {
          displayWhiteTime += currentTurnDuration
        }
        
        // 更新状态显示（转换为秒）
        setGameState(prev => ({
          ...prev,
          gameTime: totalGameTime,
          blackTime: Math.floor(displayBlackTime / 1000),
          whiteTime: Math.floor(displayWhiteTime / 1000)
        }))
      }, 1000)
    }
    
    // 组件卸载或游戏结束时清理计时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  // 注意：不要添加 gameState.blackTime 和 gameState.whiteTime 到依赖数组
  // 它们每秒都会被更新，会导致计时器不断被重置，影响计时精度
  // 使用 refs 来追踪时间，避免不必要的 effect 重新执行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomInfo?.status, gameState.gameOver, gameState.currentTurn])

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
    console.log('[落子尝试]', { row, col, roomInfo, gameState })
    if (!socketRef.current || !roomInfo) {
      setError('未连接到服务器或不在房间中')
      return
    }
    if (gameState.gameOver) {
      console.log('[落子失败] 游戏已结束')
      return
    }
    if (gameState.currentTurn !== roomInfo.role) {
      console.log('[落子失败] 未轮到您', { currentTurn: gameState.currentTurn, myRole: roomInfo.role })
      setError('还未轮到您落子')
      return
    }
    
    // 乐观更新：使用函数式更新获取最新状态
    setGameState(prev => {
      const newBoard = prev.board.map((r, i) => 
        i === row ? r.map((c, j) => j === col ? roomInfo.role : c) : r
      )
      return {
        ...prev,
        board: newBoard,
        currentTurn: roomInfo.role === 'black' ? 'white' : 'black',
        lastMove: { row, col, player: roomInfo.role }
      }
    })
    
    socketRef.current.emit('place_piece', {
      roomId: roomInfo.roomId,
      row,
      col
    }, (response) => {
      if (!response.success) {
        // 服务端拒绝，回滚状态（重新获取最新状态）
        setGameState(prev => {
          // 移除刚才的落子
          const rolledBackBoard = prev.board.map((r, i) => 
            i === row ? r.map((c, j) => j === col ? null : c) : r
          )
          return {
            ...prev,
            board: rolledBackBoard,
            currentTurn: roomInfo.role, // 恢复为当前玩家回合
            lastMove: null // 清除高亮
          }
        })
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
    // 清除计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // 重置计时器 refs
    gameStartTimeRef.current = null
    turnStartTimeRef.current = null
    accumulatedBlackTimeRef.current = 0
    accumulatedWhiteTimeRef.current = 0
    
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

  /**
   * 以观众身份加入房间
   */
  const joinSpectator = useCallback((roomId) => {
    if (!socketRef.current) {
      setError('未连接到服务器')
      return
    }
    if (!roomId || roomId.length !== 6) {
      setError('请输入有效的 6 位房间号')
      return
    }
    setError(null)
    socketRef.current.emit('join_spectator', { roomId: roomId.toUpperCase() }, (response) => {
      console.log('[Socket] 加入观战响应:', response)
      if (!response.success) {
        setError(response.error || '加入观战失败')
        return
      }
      // 保存房间号
      localStorage.setItem('wuziqi_current_room', response.roomId)

      // 处理回调返回的数据
      setRoomInfo({
        roomId: response.roomId,
        role: 'spectator',
        status: response.room.status,
        isHost: false,
        spectators: response.room.spectators || []
      })
      setGameState({
        board: response.room.board,
        currentTurn: response.room.currentTurn,
        gameOver: response.room.status === 'finished',
        winner: response.room.winner,
        isDraw: response.room.isDraw || false,
        blackTime: response.room.blackTime || 0,
        whiteTime: response.room.whiteTime || 0,
        gameTime: response.room.gameTime || 0
      })
    })
  }, [])

  /**
   * 离开观众身份
   */
  const leaveSpectator = useCallback(() => {
    if (!socketRef.current || !roomInfo) {
      return
    }
    socketRef.current.emit('leave_spectator', { roomId: roomInfo.roomId }, (response) => {
      console.log('[Socket] 离开观战响应:', response)
      localStorage.removeItem('wuziqi_current_room')
      setRoomInfo(null)
      setGameState({
        board: null,
        currentTurn: 'black',
        gameOver: false,
        winner: null,
        isDraw: false,
        blackTime: 0,
        whiteTime: 0,
        gameTime: 0
      })
      setError(null)
    })
  }, [roomInfo])

  return {
    socket,
    isConnected,
    isReconnecting,
    roomInfo,
    gameState,
    error,
    createRoom,
    joinRoom,
    joinSpectator,
    leaveSpectator,
    placePiece,
    restartGame,
    leaveRoom,
    clearError
  }
}
