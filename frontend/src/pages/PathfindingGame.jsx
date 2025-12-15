import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Trophy, Target, RotateCw, ArrowLeftRight, Check } from "lucide-react";
import api from "../services/api";

const GRID_SIZE = 10;
const TIME_LIMIT_SECONDS = 240; // 4 minutes
const TOTAL_LEVELS = 2;

// Direction constants: 0=right, 1=down, 2=left, 3=up
const DIRECTIONS = {
  RIGHT: 0,
  DOWN: 1,
  LEFT: 2,
  UP: 3
};

// Arrow symbols for each direction
const ARROW_SYMBOLS = {
  [DIRECTIONS.RIGHT]: "→",
  [DIRECTIONS.DOWN]: "↓",
  [DIRECTIONS.LEFT]: "←",
  [DIRECTIONS.UP]: "↑"
};

// Helper function to generate arrows for all cells except obstacles, start, and goal
const generateFullGridArrows = (start, goal, obstacles, seed = 0) => {
  const arrows = [];
  // Use seed for consistent random generation
  let randomSeed = seed;
  const random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  };
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Skip start position
      if (x === start.x && y === start.y) continue;
      
      // Skip goal position
      if (x === goal.x && y === goal.y) continue;
      
      // Skip obstacles
      if (obstacles.some(obs => obs.x === x && obs.y === y)) continue;
      
      // Add arrow with random initial direction
      const randomDir = Math.floor(random() * 4);
      arrows.push({ x, y, direction: randomDir });
    }
  }
  
  return arrows;
};

const LEVELS = [
  {
    start: { x: 1, y: 1 },
    goal: { x: 8, y: 0 },
    obstacles: [
      { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
      { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }
    ],
    generateInitialPath() {
      // Generate full grid with arrows, then set optimal path
      const allArrows = generateFullGridArrows(this.start, this.goal, this.obstacles, 12345);
      
      // Set optimal path directions
      const optimalPath = [
        { x: 1, y: 1, direction: DIRECTIONS.RIGHT },
        { x: 2, y: 1, direction: DIRECTIONS.RIGHT },
        { x: 3, y: 1, direction: DIRECTIONS.DOWN },
        { x: 3, y: 3, direction: DIRECTIONS.RIGHT },
        { x: 4, y: 3, direction: DIRECTIONS.RIGHT },
        { x: 5, y: 3, direction: DIRECTIONS.DOWN },
        { x: 5, y: 4, direction: DIRECTIONS.DOWN },
        { x: 5, y: 5, direction: DIRECTIONS.RIGHT },
        { x: 7, y: 5, direction: DIRECTIONS.UP },
        { x: 7, y: 4, direction: DIRECTIONS.UP },
        { x: 7, y: 3, direction: DIRECTIONS.RIGHT },
        { x: 8, y: 3, direction: DIRECTIONS.UP },
        { x: 8, y: 2, direction: DIRECTIONS.UP },
        { x: 8, y: 1, direction: DIRECTIONS.UP }
      ];
      
      // Update arrows that are part of optimal path
      optimalPath.forEach(opt => {
        const arrowIndex = allArrows.findIndex(a => a.x === opt.x && a.y === opt.y);
        if (arrowIndex !== -1) {
          allArrows[arrowIndex].direction = opt.direction;
        }
      });
      
      return allArrows;
    }
  },
  {
    start: { x: 0, y: 2 },
    goal: { x: 9, y: 1 },
    obstacles: [
      { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
      { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
      { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
      { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }
    ],
    generateInitialPath() {
      // Generate full grid with arrows, then set optimal path
      const allArrows = generateFullGridArrows(this.start, this.goal, this.obstacles, 67890);
      
      // Set optimal path directions
      const optimalPath = [
        { x: 0, y: 2, direction: DIRECTIONS.RIGHT },
        { x: 1, y: 2, direction: DIRECTIONS.RIGHT },
        { x: 2, y: 2, direction: DIRECTIONS.UP },
        { x: 2, y: 1, direction: DIRECTIONS.RIGHT },
        { x: 3, y: 1, direction: DIRECTIONS.RIGHT },
        { x: 4, y: 1, direction: DIRECTIONS.DOWN },
        { x: 4, y: 3, direction: DIRECTIONS.RIGHT },
        { x: 5, y: 3, direction: DIRECTIONS.RIGHT },
        { x: 6, y: 3, direction: DIRECTIONS.DOWN },
        { x: 6, y: 4, direction: DIRECTIONS.DOWN },
        { x: 6, y: 5, direction: DIRECTIONS.RIGHT },
        { x: 7, y: 5, direction: DIRECTIONS.RIGHT },
        { x: 8, y: 5, direction: DIRECTIONS.UP },
        { x: 8, y: 4, direction: DIRECTIONS.UP },
        { x: 8, y: 3, direction: DIRECTIONS.UP },
        { x: 8, y: 2, direction: DIRECTIONS.RIGHT },
        { x: 9, y: 2, direction: DIRECTIONS.UP }
      ];
      
      // Update arrows that are part of optimal path
      optimalPath.forEach(opt => {
        const arrowIndex = allArrows.findIndex(a => a.x === opt.x && a.y === opt.y);
        if (arrowIndex !== -1) {
          allArrows[arrowIndex].direction = opt.direction;
        }
      });
      
      return allArrows;
    }
  }
];

export default function PathfindingGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("start");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pathSegments, setPathSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT_SECONDS);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [levelScores, setLevelScores] = useState([]);
  const [status, setStatus] = useState("Rotate and arrange path segments to reach Earth");
  const timerRef = useRef(null);
  const [isPathValid, setIsPathValid] = useState(false);

  const currentLevelData = LEVELS[currentLevel];

  // Initialize path segments for current level
  useEffect(() => {
    if (gameState === "playing") {
      // Generate initial path using the level's generator function
      const path = currentLevelData.generateInitialPath();
      setPathSegments(JSON.parse(JSON.stringify(path)));
      setSelectedSegment(null);
      setIsPathValid(false);
      setStatus("Click on a path segment to select it, then rotate or reverse it");
    }
  }, [currentLevel, gameState]);

  // Check if path is valid (connects start to goal)
  useEffect(() => {
    if (pathSegments.length === 0 || gameState !== "playing") {
      setIsPathValid(false);
      return;
    }

    const start = currentLevelData.start;
    const goal = currentLevelData.goal;
    
    // Create a map of path segments by position
    const pathMap = new Map();
    pathSegments.forEach(seg => {
      const key = `${seg.x},${seg.y}`;
      pathMap.set(key, seg.direction);
    });

    // Check if start position has a path segment
    const startKey = `${start.x},${start.y}`;
    if (!pathMap.has(startKey)) {
      setIsPathValid(false);
      return;
    }

    // Follow the path from start to goal
    const visited = new Set();
    let current = { x: start.x, y: start.y };
    let steps = 0;
    const maxSteps = GRID_SIZE * GRID_SIZE;

    while (steps < maxSteps) {
      const key = `${current.x},${current.y}`;
      
      // Check for loops
      if (visited.has(key)) {
        setIsPathValid(false);
        return;
      }
      visited.add(key);

      // Check if we reached the goal
      if (current.x === goal.x && current.y === goal.y) {
        setIsPathValid(true);
        return;
      }

      // Get direction at current position
      const direction = pathMap.get(key);
      if (direction === undefined) {
        setIsPathValid(false);
        return;
      }

      // Check if obstacle is in the way
      const isObstacle = currentLevelData.obstacles.some(
        obs => obs.x === current.x && obs.y === current.y
      );
      if (isObstacle) {
        setIsPathValid(false);
        return;
      }

      // Move based on direction
      let nextX = current.x;
      let nextY = current.y;
      
      if (direction === DIRECTIONS.RIGHT) nextX++;
      else if (direction === DIRECTIONS.DOWN) nextY++;
      else if (direction === DIRECTIONS.LEFT) nextX--;
      else if (direction === DIRECTIONS.UP) nextY--;

      // Check bounds
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        setIsPathValid(false);
        return;
      }

      // Check if next position has a path segment
      const nextKey = `${nextX},${nextY}`;
      if (!pathMap.has(nextKey) && !(nextX === goal.x && nextY === goal.y)) {
        setIsPathValid(false);
        return;
      }

      current = { x: nextX, y: nextY };
      steps++;
    }

    setIsPathValid(false);
  }, [pathSegments, currentLevelData, gameState]);

  const rotateSegment = (e, direction = 1) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedSegment === null) {
      setStatus("⚠️ Select a path segment first by clicking on it");
      return;
    }

    setPathSegments(prev => {
      const newSegments = [...prev];
      const index = selectedSegment;
      const segment = newSegments[index];
      
      if (!segment) return prev;
      
      // Rotate direction (0->1->2->3->0)
      const newDirection = direction === 1 
        ? (segment.direction + 1) % 4
        : (segment.direction + 3) % 4;
      
      newSegments[index] = { ...segment, direction: newDirection };
      return newSegments;
    });
    
    setStatus("✓ Path segment rotated");
  };

  const reverseSegment = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedSegment === null) {
      setStatus("⚠️ Select a path segment first by clicking on it");
      return;
    }

    setPathSegments(prev => {
      const newSegments = [...prev];
      const index = selectedSegment;
      const segment = newSegments[index];
      
      if (!segment) return prev;
      
      // Reverse direction (0<->2, 1<->3)
      const reverseMap = {
        [DIRECTIONS.RIGHT]: DIRECTIONS.LEFT,
        [DIRECTIONS.LEFT]: DIRECTIONS.RIGHT,
        [DIRECTIONS.DOWN]: DIRECTIONS.UP,
        [DIRECTIONS.UP]: DIRECTIONS.DOWN
      };
      
      newSegments[index] = { ...segment, direction: reverseMap[segment.direction] };
      return newSegments;
    });
    
    setStatus("✓ Path segment reversed");
  };

  const selectSegment = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedSegment(index);
    setStatus(`✓ Segment ${index + 1} selected - Use buttons to rotate or reverse`);
  };

  const submitPath = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPathValid) {
      setStatus("❌ Path is invalid! Make sure it connects from 🚀 to 🌍");
      return;
    }

    const levelTime = TIME_LIMIT_SECONDS - timeRemaining;
    
    // Calculate optimal path length using BFS
    const calculateOptimalPathLength = () => {
      const start = currentLevelData.start;
      const goal = currentLevelData.goal;
      const queue = [{ x: start.x, y: start.y, steps: 0 }];
      const visited = new Set();
      const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ];
      
      while (queue.length > 0) {
        const { x, y, steps } = queue.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (x === goal.x && y === goal.y) {
          return steps;
        }
        
        // Check if obstacle
        const isObstacle = currentLevelData.obstacles.some(obs => obs.x === x && obs.y === y);
        if (isObstacle) continue;
        
        // Add neighbors
        for (const dir of directions) {
          const nx = x + dir.dx;
          const ny = y + dir.dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const nKey = `${nx},${ny}`;
            if (!visited.has(nKey)) {
              queue.push({ x: nx, y: ny, steps: steps + 1 });
            }
          }
        }
      }
      return 100; // Fallback
    };
    
    const optimalLength = calculateOptimalPathLength();
    
    // Calculate actual path length by following the path
    const calculateActualPathLength = () => {
      const start = currentLevelData.start;
      const goal = currentLevelData.goal;
      const pathMap = new Map();
      pathSegments.forEach(seg => {
        pathMap.set(`${seg.x},${seg.y}`, seg.direction);
      });
      
      let current = { x: start.x, y: start.y };
      let steps = 0;
      const visited = new Set();
      const maxSteps = GRID_SIZE * GRID_SIZE;
      
      while (steps < maxSteps) {
        const key = `${current.x},${current.y}`;
        if (visited.has(key)) break;
        visited.add(key);
        
        if (current.x === goal.x && current.y === goal.y) {
          return steps;
        }
        
        const direction = pathMap.get(key);
        if (direction === undefined) break;
        
        if (direction === DIRECTIONS.RIGHT) current.x++;
        else if (direction === DIRECTIONS.DOWN) current.y++;
        else if (direction === DIRECTIONS.LEFT) current.x--;
        else if (direction === DIRECTIONS.UP) current.y--;
        
        steps++;
      }
      return steps;
    };
    
    const actualLength = calculateActualPathLength();
    
    // Calculate score
    let score = 100;
    if (actualLength > optimalLength) {
      score -= (actualLength - optimalLength) * 3;
    }
    score += Math.floor(timeRemaining / 4);
    if (actualLength === optimalLength) {
      score += 50; // Perfect path bonus
    }
    score = Math.max(0, score);

    setLevelScores(prev => [...prev, score]);
    setTotalTime(prev => prev + levelTime);

    if (currentLevel < TOTAL_LEVELS - 1) {
      setStatus(`✅ Level ${currentLevel + 1} complete! Moving to next level...`);
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setTimeRemaining(TIME_LIMIT_SECONDS);
        setSelectedSegment(null);
      }, 2000);
    } else {
      finishGame();
    }
  };

  const startGame = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setGameState("playing");
    setCurrentLevel(0);
    setTimeRemaining(TIME_LIMIT_SECONDS);
    setStartTime(Date.now());
    setTotalTime(0);
    setLevelScores([]);
    setSelectedSegment(null);
    setStatus("Click on a path segment to select it, then rotate or reverse it");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus("⏰ Time's up! Game over.");
    finishGame();
  };

  const finishGame = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const finalTime = totalTime + (TIME_LIMIT_SECONDS - timeRemaining);
    const totalScore = levelScores.reduce((sum, score) => sum + score, 0);
    
    setGameState("finished");
    setTotalTime(finalTime);

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      try {
        // Calculate optimal steps for final submission
        const calculateOptimalSteps = () => {
          const start = currentLevelData.start;
          const goal = currentLevelData.goal;
          const queue = [{ x: start.x, y: start.y, steps: 0 }];
          const visited = new Set();
          const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
          ];
          
          while (queue.length > 0) {
            const { x, y, steps } = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (x === goal.x && y === goal.y) {
              return steps;
            }
            
            const isObstacle = currentLevelData.obstacles.some(obs => obs.x === x && obs.y === y);
            if (isObstacle) continue;
            
            for (const dir of directions) {
              const nx = x + dir.dx;
              const ny = y + dir.dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const nKey = `${nx},${ny}`;
                if (!visited.has(nKey)) {
                  queue.push({ x: nx, y: ny, steps: steps + 1 });
                }
              }
            }
          }
          return 100;
        };
        
        const optimalSteps = calculateOptimalSteps();
        
        await api.post("/submit_game", {
          user_id: user.id,
          game_type: "pathfinding",
          score: totalScore,
          time_taken: finalTime,
          steps_taken: pathSegments.length,
          optimal_steps: optimalSteps,
          keys_collected: 0,
          levels_completed: currentLevel + 1
        });
      } catch (error) {
        console.error("Failed to submit score", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderCell = (x, y) => {
    const isStart = currentLevelData.start.x === x && currentLevelData.start.y === y;
    const isGoal = currentLevelData.goal.x === x && currentLevelData.goal.y === y;
    const isObstacle = currentLevelData.obstacles.some(obs => obs.x === x && obs.y === y);
    const pathIndex = pathSegments.findIndex(seg => seg.x === x && seg.y === y);
    const isSelected = pathIndex !== -1 && pathIndex === selectedSegment;
    const hasPath = pathIndex !== -1;

    let bg = "#2a2a3e";
    let content = null;
    let borderColor = "#1a1a2e";
    let cursorStyle = "default";

    if (isObstacle) {
      bg = "#1a1a2e";
    } else if (isStart) {
      bg = "#1a2a3e";
      content = "🚀";
    } else if (isGoal) {
      bg = "#3a2a1e";
      content = "🌍";
    } else if (hasPath) {
      bg = "#3a3a4e";
      const segment = pathSegments[pathIndex];
      content = ARROW_SYMBOLS[segment.direction];
      cursorStyle = "pointer";
      
      if (isSelected) {
        borderColor = "#fbbf24";
      } else {
        borderColor = "#1a1a2e";
      }
    }

    return (
      <div
        key={`${x}-${y}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hasPath) {
            selectSegment(e, pathIndex);
          }
        }}
        className="relative flex items-center justify-center border-2 transition-all select-none"
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: bg,
          borderColor: borderColor,
          fontSize: "20px",
          color: "#ffffff",
          cursor: cursorStyle,
          userSelect: "none"
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {content}
      </div>
    );
  };

  const totalScore = levelScores.reduce((sum, score) => sum + score, 0);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/dashboard");
            }}
            className="text-white/70 hover:text-white p-2 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={24} /> Pathfinding Challenge
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="p-8">
          {gameState === "start" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">
                Build the Path to Earth! 🌍
              </h3>
              <p className="text-white/70 mb-6 text-center">
                Rotate and arrange path segments to create a route from the spaceship to Earth.<br />
                Complete {TOTAL_LEVELS} sections within the time limit!
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <h4 className="text-white font-semibold mb-2">Game Rules:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Click on path segments (arrows) to select them</li>
                  <li>• Use "Rotate path" to change arrow direction</li>
                  <li>• Use "Reverse" to flip arrow direction</li>
                  <li>• Create a continuous path from 🚀 to 🌍</li>
                  <li>• Avoid obstacles (dark cells)</li>
                  <li>• Click ✓ to submit when path is complete</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-emerald-600 transition shadow-lg"
              >
                Start Game
              </button>
            </motion.div>
          )}

          {gameState === "playing" && (
            <div>
              {/* Timer and Level Indicator */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 bg-white/10 rounded-full border-2 border-white/20 flex flex-col items-center justify-center">
                    <Clock className="w-5 h-5 text-white absolute top-1" />
                    <div className={`text-xs font-bold ${timeRemaining <= 30 ? "text-red-400" : "text-white"} mt-3`}>
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>
                <div className="text-white/80 font-semibold text-lg">
                  Section {currentLevel + 1} of {TOTAL_LEVELS}
                </div>
              </div>

              {/* Status */}
              <div className="text-center mb-4 min-h-[60px]">
                <p className={`font-semibold text-lg ${isPathValid ? "text-green-400" : "text-white"}`}>
                  {status}
                </p>
                {isPathValid && (
                  <p className="text-green-400 text-sm mt-2 animate-pulse">✓ Path is valid! Click ✓ to submit.</p>
                )}
              </div>

              {/* Grid */}
              <div className="flex justify-center mb-6">
                <div
                  className="grid gap-0 p-2 bg-gray-900/50 rounded-lg border-2 border-white/20 select-none"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {Array(GRID_SIZE).fill(null).map((_, y) =>
                    Array(GRID_SIZE).fill(null).map((_, x) => renderCell(x, y))
                  )}
                </div>
              </div>

              {/* Action Buttons - Bottom Center */}
              <div className="flex justify-center items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={(e) => rotateSegment(e, 1)}
                  disabled={selectedSegment === null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed border border-white/20"
                >
                  <RotateCw size={18} />
                  Rotate path
                </button>
                <button
                  type="button"
                  onClick={reverseSegment}
                  disabled={selectedSegment === null}
                  className="w-10 h-10 bg-white/10 text-white rounded-lg hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 flex items-center justify-center"
                  title="Reverse Direction"
                >
                  <ArrowLeftRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={submitPath}
                  disabled={!isPathValid}
                  className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                  title="Submit Path"
                >
                  <Check size={20} />
                </button>
              </div>

              {/* Instructions */}
              <div className="text-center text-white/60 text-sm">
                Select a path segment (highlighted in yellow) to rotate or reverse it
              </div>
            </div>
          )}

          {gameState === "finished" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-4 text-center">
                🎉 Game Complete!
              </h3>

              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-white/60 text-sm mb-1">Total Score</div>
                    <div className="text-3xl font-bold text-cyan-400">{totalScore}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-1">Total Time</div>
                    <div className="text-3xl font-bold text-pink-400">{formatTime(totalTime)}</div>
                  </div>
                </div>

                {/* Level Breakdown */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-white font-semibold mb-2">Section Scores:</h4>
                  <div className="space-y-2">
                    {levelScores.map((score, i) => (
                      <div key={i} className="flex justify-between items-center text-white/80">
                        <span>Section {i + 1}</span>
                        <span className="font-bold text-cyan-400">{score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate("/dashboard");
                  }}
                  className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
