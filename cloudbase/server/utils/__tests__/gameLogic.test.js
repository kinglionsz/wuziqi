// Test for game logic - using shared test helpers
import { 
  BOARD_SIZE,
  createEmptyBoard, 
  createBoard, 
  checkWinner, 
  checkDraw,
  validateMove,
  generateRoomId
} from '../../tests/utils/testHelpers.js'

describe('gameLogic checkWinner', () => {
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

  it('diagonal five should return true', () => {
    const board = createBoard([
      { row: 0, col: 0, player: 'black' },
      { row: 1, col: 1, player: 'black' },
      { row: 2, col: 2, player: 'black' },
      { row: 3, col: 3, player: 'black' },
      { row: 4, col: 4, player: 'black' }
    ])
    expect(checkWinner(board, 2, 2, 'black')).toBe(true)
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
    const board = createBoard([
      { row: 7, col: 7, player: 'black' },
      { row: 7, col: 8, player: 'white' }
    ])
    expect(checkDraw(board)).toBe(false)
  })

  it('full board should return true', () => {
    const board = Array(BOARD_SIZE).fill(null).map((_, row) =>
      Array(BOARD_SIZE).fill(null).map((_, col) =>
        (row + col) % 2 === 0 ? 'black' : 'white'
      )
    )
    expect(checkDraw(board)).toBe(true)
  })
})

describe('createEmptyBoard', () => {
  it('should create 15x15 board', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(BOARD_SIZE)
    expect(board[0]).toHaveLength(BOARD_SIZE)
  })

  it('all cells should be null', () => {
    const board = createEmptyBoard()
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        expect(board[row][col]).toBe(null)
      }
    }
  })
})

describe('validateMove', () => {
  const board = createBoard([
    { row: 7, col: 7, player: 'black' }
  ])

  it('valid move should return valid: true', () => {
    expect(validateMove(0, 0, board)).toEqual({ valid: true, error: null })
  })

  it('out of bounds row should return error', () => {
    expect(validateMove(15, 7, board)).toEqual({ valid: false, error: '位置越界' })
  })

  it('out of bounds col should return error', () => {
    expect(validateMove(7, 15, board)).toEqual({ valid: false, error: '位置越界' })
  })

  it('occupied position should return error', () => {
    expect(validateMove(7, 7, board)).toEqual({ valid: false, error: '该位置已有棋子' })
  })
})

describe('generateRoomId', () => {
  it('default length should be 6', () => {
    const roomId = generateRoomId()
    expect(roomId).toHaveLength(6)
  })

  it('custom length should work', () => {
    const roomId = generateRoomId(4)
    expect(roomId).toHaveLength(4)
  })

  it('should only contain valid characters', () => {
    const roomId = generateRoomId(100)
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (const char of roomId) {
      expect(validChars).toContain(char)
    }
  })
})

describe('BOARD_SIZE', () => {
  it('should be 15', () => {
    expect(BOARD_SIZE).toBe(15)
  })
})
