import React, { useState } from 'react';
import './Board.css';

const THEMES = {
  default: {
    boardColor: '#DEB887',
    lineColor: '#8B4513',
    lastMoveColor: 'rgba(255, 0, 0, 0.5)'
  },
  wood: {
    boardColor: '#DEB887',
    lineColor: '#5D3A1A',
    lastMoveColor: 'rgba(255, 0, 0, 0.5)'
  },
  ocean: {
    boardColor: '#87CEEB',
    lineColor: '#1e3c72',
    lastMoveColor: 'rgba(255, 0, 0, 0.5)'
  },
  forest: {
    boardColor: '#90EE90',
    lineColor: '#228B22',
    lastMoveColor: 'rgba(255, 0, 0, 0.5)'
  },
  night: {
    boardColor: '#2C3E50',
    lineColor: '#ECF0F1',
    lastMoveColor: 'rgba(255, 200, 0, 0.6)'
  },
  pink: {
    boardColor: '#FFF0F5',
    lineColor: '#DB7093',
    lastMoveColor: 'rgba(255, 0, 0, 0.5)'
  }
};

const Board = ({ board, onCellClick, currentPlayer, gameOver, theme = 'default' }) => {
  const [hoverPosition, setHoverPosition] = useState(null);
  const currentTheme = THEMES[theme] || THEMES.default;

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (!gameOver && !board[rowIndex][colIndex]) {
      setHoverPosition({ row: rowIndex, col: colIndex });
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  // 找到最后一步
  const getLastMove = () => {
    for (let i = board.length - 1; i >= 0; i--) {
      for (let j = board[i].length - 1; j >= 0; j--) {
        if (board[i][j]) {
          return { row: i, col: j };
        }
      }
    }
    return null;
  };

  const lastMove = getLastMove();

  return (
    <div className="board" style={{ 
      backgroundColor: currentTheme.boardColor,
      '--line-color': currentTheme.lineColor,
      '--last-move-color': currentTheme.lastMoveColor
    }}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className="board-cell"
              onClick={() => onCellClick(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              onMouseLeave={handleMouseLeave}
            >
              {/* 棋盘线条 */}
              {(rowIndex === 7 && colIndex === 7) && <div className="star-point center-star"></div>}
              {(rowIndex === 3 && colIndex === 3) && <div className="star-point"></div>}
              {(rowIndex === 3 && colIndex === 11) && <div className="star-point"></div>}
              {(rowIndex === 11 && colIndex === 3) && <div className="star-point"></div>}
              {(rowIndex === 11 && colIndex === 11) && <div className="star-point"></div>}
              
              {/* 棋子 */}
              {cell === 'black' && (
                <div className={`stone black ${lastMove && lastMove.row === rowIndex && lastMove.col === colIndex ? 'last-move' : ''}`}>
                  {lastMove && lastMove.row === rowIndex && lastMove.col === colIndex && <div className="last-move-indicator"></div>}
                </div>
              )}
              {cell === 'white' && (
                <div className={`stone white ${lastMove && lastMove.row === rowIndex && lastMove.col === colIndex ? 'last-move' : ''}`}>
                  {lastMove && lastMove.row === rowIndex && lastMove.col === colIndex && <div className="last-move-indicator"></div>}
                </div>
              )}
              
              {/* 预览 */}
              {hoverPosition && 
               hoverPosition.row === rowIndex && 
               hoverPosition.col === colIndex && 
               !cell && 
               <div className={`preview-stone ${currentPlayer}`}></div>
              }
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
