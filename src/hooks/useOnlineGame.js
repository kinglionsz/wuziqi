import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

// Socket.io 服务器地址
// 生产环境使用 VITE_SOCKET_URL 环境变量，开发环境默认 localhost:3001
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')

/**
 * 在线对战游戏 Hook
 * 处理 Socket.io 连接、房间管理、游戏逻辑
 */
export const useOnlineGame = () => {
  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
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
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('[Socket] 已连接到服务器')
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on('disconnect', () => {
      console.log('[Socket] 已断开连接')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message)
      setError('无法连接到服务器，请检查网络连接')
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

    // 监听对手断开连接
    socketInstance.on('opponent_disconnected', (data) => {
      console.log('[Socket] 对手断开连接:', data)
      setError('对手已断开连接')
      setRoomInfo(prev => prev ? { ...prev, status: 'disconnected' } : null)
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
    if (socketRef.current && roomInfo) {
      socketRef.current.emit('leave_room', { roomId: roomInfo.roomId }, (response) => {
        // 只有在服务器确认成功后才清理状态
        if (response?.success) {
          setRoomInfo(null)
          setGameState({
            board: null,
            currentTurn: 'black',
            gameOver: false,
            winner: null,
            isDraw: false
          })
          setError(null)
        } else {
          console.error('[离开房间失败]', response?.error)
          // 失败时也清理状态，避免卡在房间中
          setRoomInfo(null)
          setGameState({
            board: null,
            currentTurn: 'black',
            gameOver: false,
            winner: null,
            isDraw: false
          })
        }
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
