// Test for AI logic - using shared test helpers
import { 
  createEmptyBoard, 
  createBoard, 
  checkWinner, 
  checkDraw 
} from '../../../tests/utils/testHelpers.js'

describe('AI checkWinner', () => {
  it('empty board should return false', () => {
    const board = createEmptyBoard()
    expect(checkWinner(board, 7, 7, 'black')).toBe(false)
  })

  it('horizontal five should return true', () => {
    const board = createBoard([
      { row: 7, col: 0, player: 'black' },
      { row: 7, col: 1, player: 'black' },
      { row: 7, col: 2, player: 'black' },
      { row: 7, col: 3, player: 'black' },
      { row: 7, col: 4, player: 'black' }
    ])
    expect(checkWinner(board, 7, 2, 'black')).toBe(true)
  })

  it('vertical five should return true', () => {
    const board = createBoard([
      { row: 3, col: 7, player: 'black' },
      { row: 4, col: 7, player: 'black' },
      { row: 5, col: 7, player: 'black' },
      { row: 6, col: 7, player: 'black' },
      { row: 7, col: 7, player: 'black' }
    ])
    expect(checkWinner(board, 5, 7, 'black')).toBe(true)
  })

  it('diagonal five (\\) should return true', () => {
    const board = createBoard([
      { row: 0, col: 0, player: 'black' },
      { row: 1, col: 1, player: 'black' },
      { row: 2, col: 2, player: 'black' },
      { row: 3, col: 3, player: 'black' },
      { row: 4, col: 4, player: 'black' }
    ])
    expect(checkWinner(board, 2, 2, 'black')).toBe(true)
  })

  it('diagonal five (/) should return true', () => {
    const board = createBoard([
      { row: 0, col: 10, player: 'white' },
      { row: 1, col: 9, player: 'white' },
      { row: 2, col: 8, player: 'white' },
      { row: 3, col: 7, player: 'white' },
      { row: 4, col: 6, player: 'white' }
    ])
    expect(checkWinner(board, 2, 8, 'white')).toBe(true)
  })

  it('four in a row should return false', () => {
    const board = createBoard([
      { row: 7, col: 0, player: 'black' },
      { row: 7, col: 1, player: 'black' },
      { row: 7, col: 2, player: 'black' },
      { row: 7, col: 3, player: 'black' }
    ])
    expect(checkWinner(board, 7, 1, 'black')).toBe(false)
  })
})

describe('checkDraw', () => {
  it('empty board should return false', () => {
    const board = createEmptyBoard()
    expect(checkDraw(board)).toBe(false)
  })

  it('partial board should return false', () => {
    const board = createEmptyBoard()
    board[7][7] = 'black'
    board[7][8] = 'white'
    expect(checkDraw(board)).toBe(false)
  })

  it('full board should return true', () => {
    const board = Array(15).fill(null).map((_, row) =>
      Array(15).fill(null).map((_, col) =>
        (row + col) % 2 === 0 ? 'black' : 'white'
      )
    )
    expect(checkDraw(board)).toBe(true)
  })
})

describe('Board operations', () => {
  it('should create empty 15x15 board', () => {
    const board = createEmptyBoard()
    expect(board.length).toBe(15)
    expect(board[0].length).toBe(15)
  })

  it('all cells should be null initially', () => {
    const board = createEmptyBoard()
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        expect(board[row][col]).toBe(null)
      }
    }
  })

  it('should place piece correctly', () => {
    const board = createEmptyBoard()
    board[7][7] = 'black'
    expect(board[7][7]).toBe('black')
  })
})
