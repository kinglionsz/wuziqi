import React, { useState } from 'react';
import './Board.css';

const Board = ({ board, onCellClick, currentPlayer, gameOver }) => {
  const [hoverPosition, setHoverPosition] = useState(null);

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (!gameOver && !board[rowIndex][colIndex]) {
      setHoverPosition({ row: rowIndex, col: colIndex });
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  return (
    <div className="board">
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
              {cell === 'black' && <div className="stone black"></div>}
              {cell === 'white' && <div className="stone white"></div>}
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