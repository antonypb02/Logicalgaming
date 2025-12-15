import React, { useState, useEffect, useCallback } from 'react';

const RatMazeGame = () => {
  // Game constants
  const GRID_SIZE = 15;
  const CELL_SIZE = 40;
  
  // Cell types
  const EMPTY = 0;
  const WALL = 1;
  const RAT = 2;
  const CHEESE = 3;
  const VISITED = 4;

  // Initial maze generation
  const generateMaze = () => {
    const maze = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(EMPTY));
    
    // Add border walls
    for (let i = 0; i < GRID_SIZE; i++) {
      maze[0][i] = WALL;
      maze[GRID_SIZE - 1][i] = WALL;
      maze[i][0] = WALL;
      maze[i][GRID_SIZE - 1] = WALL;
    }
    
    // Add random internal walls
    for (let i = 2; i < GRID_SIZE - 2; i += 2) {
      for (let j = 2; j < GRID_SIZE - 2; j += 2) {
        if (Math.random() > 0.3) {
          maze[i][j] = WALL;
          // Add connecting walls
          const direction = Math.floor(Math.random() * 4);
          if (direction === 0 && i > 1) maze[i - 1][j] = WALL;
          else if (direction === 1 && i < GRID_SIZE - 2) maze[i + 1][j] = WALL;
          else if (direction === 2 && j > 1) maze[i][j - 1] = WALL;
          else if (direction === 3 && j < GRID_SIZE - 2) maze[i][j + 1] = WALL;
        }
      }
    }
    
    return maze;
  };

  // State management
  const [maze, setMaze] = useState(generateMaze());
  const [ratPosition, setRatPosition] = useState({ row: 1, col: 1 });
  const [cheesePosition, setCheesePosition] = useState({ 
    row: GRID_SIZE - 2, 
    col: GRID_SIZE - 2 
  });
  const [visitedCells, setVisitedCells] = useState(new Set(['1,1']));
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!gameWon) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameWon, startTime]);

  // Check win condition
  useEffect(() => {
    if (ratPosition.row === cheesePosition.row && 
        ratPosition.col === cheesePosition.col) {
      setGameWon(true);
    }
  }, [ratPosition, cheesePosition]);

  // Move rat
  const moveRat = useCallback((deltaRow, deltaCol) => {
    if (gameWon) return;

    const newRow = ratPosition.row + deltaRow;
    const newCol = ratPosition.col + deltaCol;

    // Check boundaries and walls
    if (newRow >= 0 && newRow < GRID_SIZE && 
        newCol >= 0 && newCol < GRID_SIZE && 
        maze[newRow][newCol] !== WALL) {
      
      setRatPosition({ row: newRow, col: newCol });
      setVisitedCells(prev => new Set([...prev, `${newRow},${newCol}`]));
      setMoves(prev => prev + 1);
    }
  }, [ratPosition, maze, gameWon]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          moveRat(-1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveRat(1, 0);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveRat(0, -1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveRat(0, 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveRat]);

  // Reset game
  const resetGame = () => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setRatPosition({ row: 1, col: 1 });
    setCheesePosition({ row: GRID_SIZE - 2, col: GRID_SIZE - 2 });
    setVisitedCells(new Set(['1,1']));
    setMoves(0);
    setGameWon(false);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  // Get cell style
  const getCellStyle = (row, col) => {
    const isRat = row === ratPosition.row && col === ratPosition.col;
    const isCheese = row === cheesePosition.row && col === cheesePosition.col;
    const isWall = maze[row][col] === WALL;
    const isVisited = visitedCells.has(`${row},${col}`);

    let backgroundColor = '#f0f0f0';
    let content = '';
    let fontSize = '24px';

    if (isWall) {
      backgroundColor = '#2c3e50';
    } else if (isRat) {
      backgroundColor = '#3498db';
      content = '🐀';
    } else if (isCheese) {
      backgroundColor = '#f39c12';
      content = '🧀';
    } else if (isVisited) {
      backgroundColor = '#ecf0f1';
    }

    return {
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      backgroundColor,
      border: '1px solid #bdc3c7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      transition: 'background-color 0.2s',
    };
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#34495e',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
    }}>
      {/* Title */}
      <h1 style={{
        color: '#ecf0f1',
        marginBottom: '20px',
        fontSize: '48px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      }}>
        🐀 Rat Maze Game 🧀
      </h1>

      {/* Game stats */}
      <div style={{
        display: 'flex',
        gap: '30px',
        marginBottom: '20px',
        color: '#ecf0f1',
        fontSize: '20px',
        fontWeight: 'bold',
      }}>
        <div style={{
          backgroundColor: '#2c3e50',
          padding: '10px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          Moves: {moves}
        </div>
        <div style={{
          backgroundColor: '#2c3e50',
          padding: '10px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          Time: {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Maze grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
        gap: '0',
        backgroundColor: '#2c3e50',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
        marginBottom: '20px',
      }}>
        {maze.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={getCellStyle(rowIndex, colIndex)}
            />
          ))
        ))}
      </div>

      {/* Controls */}
      <div style={{
        color: '#ecf0f1',
        textAlign: 'center',
        marginBottom: '20px',
      }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          Use Arrow Keys or WASD to move the rat to the cheese!
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60px)',
          gap: '5px',
          justifyContent: 'center',
          marginTop: '15px',
        }}>
          <div></div>
          <button
            onClick={() => moveRat(-1, 0)}
            style={buttonStyle}
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => moveRat(0, -1)}
            style={buttonStyle}
          >
            ←
          </button>
          <button
            onClick={() => moveRat(1, 0)}
            style={buttonStyle}
          >
            ↓
          </button>
          <button
            onClick={() => moveRat(0, 1)}
            style={buttonStyle}
          >
            →
          </button>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={resetGame}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          fontSize: '18px',
          borderRadius: '10px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
      >
        New Maze
      </button>

      {/* Win modal */}
      {gameWon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#2ecc71',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{
              fontSize: '48px',
              color: 'white',
              marginBottom: '20px',
            }}>
              🎉 You Won! 🎉
            </h2>
            <p style={{
              fontSize: '24px',
              color: 'white',
              marginBottom: '10px',
            }}>
              Moves: {moves}
            </p>
            <p style={{
              fontSize: '24px',
              color: 'white',
              marginBottom: '30px',
            }}>
              Time: {formatTime(elapsedTime)}
            </p>
            <button
              onClick={resetGame}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                fontSize: '20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Button style for directional controls
const buttonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  width: '60px',
  height: '60px',
  fontSize: '24px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  transition: 'all 0.2s',
};

export default RatMazeGame;
