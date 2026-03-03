import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '@/hooks/useGameLogic'
import { GAME_MODES } from '@/utils/constants'

describe('回放功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useGameLogic 状态 setters', () => {
    it('应该导出 setGameOver, setWinner, setIsDraw', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 验证导出了必要的 setter 函数
      expect(result.current.setGameOver).toBeDefined()
      expect(result.current.setWinner).toBeDefined()
      expect(result.current.setIsDraw).toBeDefined()
    })

    it('应该能够设置 gameOver 状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 初始状态 gameOver 为 false
      expect(result.current.gameOver).toBe(false)

      // 设置 gameOver 为 true
      act(() => {
        result.current.setGameOver(true)
      })

      expect(result.current.gameOver).toBe(true)
    })

    it('应该能够设置 winner 状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 初始状态 winner 为 null
      expect(result.current.winner).toBe(null)

      // 设置 winner
      act(() => {
        result.current.setWinner('black')
      })

      expect(result.current.winner).toBe('black')
    })

    it('应该能够设置 isDraw 状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 初始状态 isDraw 为 false
      expect(result.current.isDraw).toBe(false)

      // 设置 isDraw 为 true
      act(() => {
        result.current.setIsDraw(true)
      })

      expect(result.current.isDraw).toBe(true)
    })
  })

  describe('回放状态恢复逻辑测试', () => {
    it('重置 gameOver 后应该允许落子', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 模拟游戏结束
      act(() => {
        result.current.setGameOver(true)
        result.current.setWinner('black')
      })

      expect(result.current.gameOver).toBe(true)

      // 重置游戏状态
      act(() => {
        result.current.setGameOver(false)
        result.current.setWinner(null)
        result.current.setIsDraw(false)
      })

      expect(result.current.gameOver).toBe(false)
      expect(result.current.winner).toBe(null)
    })

    it('应该能够恢复棋盘状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 模拟恢复回放结束时的棋盘
      act(() => {
        // 设置一个自定义棋盘
        const testBoard = Array(15).fill(null).map(() => Array(15).fill(null))
        testBoard[7][7] = 'black'
        testBoard[7][8] = 'white'
        result.current.setBoard(testBoard)
      })

      // 验证棋盘已更新
      expect(result.current.board[7][7]).toBe('black')
      expect(result.current.board[7][8]).toBe('white')
    })

    it('应该能够恢复玩家状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVE, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 初始玩家是黑棋
      expect(result.current.currentPlayer).toBe('black')

      // 模拟回放结束时白棋刚落子，下一步应该是黑棋
      act(() => {
        result.current.setCurrentPlayer('black')
      })

      expect(result.current.currentPlayer).toBe('black')
    })
  })

  describe('时间状态恢复测试', () => {
    it('应该能够设置和恢复时间状态', () => {
      const { result } = renderHook(() => 
        useGameLogic({ 
          gameMode: GAME_MODES.PVP, 
          soundEnabled: false, 
          theme: 'default',
          aiLevel: 1
        })
      )

      // 模拟回放结束时的时间状态
      act(() => {
        result.current.setBlackTime(100)
        result.current.setWhiteTime(80)
        result.current.setGameTime(180)
      })

      expect(result.current.blackTime).toBe(100)
      expect(result.current.whiteTime).toBe(80)
      expect(result.current.gameTime).toBe(180)
    })
  })
})
