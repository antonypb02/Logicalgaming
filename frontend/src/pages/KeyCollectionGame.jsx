import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Trophy, Eye, EyeOff } from 'lucide-react';

const GRID_W = 15;
const GRID_H = 15;
const MAX_LEVEL = 5;

const KeyCollectionGame = () => {
    const navigate = useNavigate();
    const [level, setLevel] = useState(1);
    const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
    const [keyPos, setKeyPos] = useState({ x: 7, y: 13 });
    const [doorPos, setDoorPos] = useState({ x: 13, y: 13 });
    const [hasKey, setHasKey] = useState(false);
    const [lastHitWall, setLastHitWall] = useState(null);
    const [walls, setWalls] = useState(new Set());
    const [gameState, setGameState] = useState('playing'); // playing, won
    const [moves, setMoves] = useState(0);
    const [wallHits, setWallHits] = useState(0);
    const [showWalls, setShowWalls] = useState(false);

    // Initialize Game - multi-level patterns, all fairly challenging
    useEffect(() => {
        const wallSet = new Set();

        // Default positions for each level (all different)
        let start = { x: 1, y: 1 };
        let key = { x: 7, y: 11 };
        let door = { x: 13, y: 13 };

        switch (level) {
            case 1:
                // Hard baseline (previously similar to a higher level)
                key = { x: 6, y: 11 };
                door = { x: 12, y: 10 };
                break;
            case 2:
                // Slightly harder, key and door moved
                key = { x: 4, y: 10 };
                door = { x: 11, y: 9 };
                break;
            case 3:
                // More central objective
                key = { x: 8, y: 9 };
                door = { x: 12, y: 7 };
                break;
            case 4:
                // Key deeper in the maze
                key = { x: 5, y: 8 };
                door = { x: 11, y: 6 };
                break;
            case 5:
            default:
                // Most difficult: key and door both close to dense walls
                key = { x: 3, y: 9 };
                door = { x: 10, y: 5 };
                break;
        }

        // Outer border walls (same for all levels)
        for (let x = 0; x < GRID_W; x++) {
            wallSet.add(`${x},0`);
            wallSet.add(`${x},${GRID_H - 1}`);
        }
        for (let y = 0; y < GRID_H; y++) {
            wallSet.add(`0,${y}`);
            wallSet.add(`${GRID_W - 1},${y}`);
        }

        // Base diagonal pattern - always present (already challenging)
        for (let i = 2; i < 13; i++) {
            wallSet.add(`${i},${i}`);
            wallSet.add(`${i},${14 - i}`);
        }

        // Horizontal barriers with gaps - get denser with level
        for (let x = 3; x < 12; x++) {
            if (x !== 7 && x !== 9) {
                wallSet.add(`${x},5`);
            }
        }

        if (level >= 2) {
            for (let x = 3; x < 12; x++) {
                if (x !== 5 && x !== 8) {
                    wallSet.add(`${x},9`);
                }
            }
        }

        if (level >= 3) {
            for (let x = 2; x < 13; x++) {
                if (x !== 4 && x !== 10) {
                    wallSet.add(`${x},7`);
                }
            }
        }

        // Vertical barriers with gaps - also scale with level
        for (let y = 3; y < 12; y++) {
            if (y !== 7 && y !== 9) {
                wallSet.add(`5,${y}`);
            }
        }

        if (level >= 2) {
            for (let y = 3; y < 12; y++) {
                if (y !== 5 && y !== 8) {
                    wallSet.add(`9,${y}`);
                }
            }
        }

        if (level >= 3) {
            for (let y = 2; y < 13; y++) {
                if (y !== 4 && y !== 11) {
                    wallSet.add(`7,${y}`);
                }
            }
        }

        // Additional complexity - clusters grow with level
        wallSet.add('3,3');
        wallSet.add('3,4');
        wallSet.add('11,3');
        wallSet.add('11,4');

        if (level >= 2) {
            wallSet.add('3,11');
            wallSet.add('4,11');
            wallSet.add('11,11');
            wallSet.add('10,11');
        }

        if (level >= 3) {
            wallSet.add('6,6');
            wallSet.add('6,8');
            wallSet.add('8,6');
            wallSet.add('8,8');
        }

        if (level >= 4) {
            wallSet.add('4,4');
            wallSet.add('4,5');
            wallSet.add('5,4');
            wallSet.add('10,4');
            wallSet.add('10,5');
            wallSet.add('9,4');
        }

        if (level >= 5) {
            wallSet.add('6,4');
            wallSet.add('7,4');
            wallSet.add('8,4');
            wallSet.add('6,10');
            wallSet.add('7,10');
            wallSet.add('8,10');
        }

        // Ensure start, key, and door are always walkable
        wallSet.delete(`${key.x},${key.y}`);
        wallSet.delete(`${door.x},${door.y}`);
        wallSet.delete(`${start.x},${start.y}`);

        setPlayerPos(start);
        setKeyPos(key);
        setDoorPos(door);
        setWalls(wallSet);
        setLastHitWall(null);
        setHasKey(false);
        setMoves(0);
        setWallHits(0);
        setGameState('playing');
    }, [level]);

    const handleWin = async () => {
        setGameState('won');
        const finalScore = Math.max(1000 - (moves * 5) - (wallHits * 20), 100);
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            await api.post('/submit_game', {
                user_id: user.id,
                game_type: 'key_collection',
                score: finalScore,
                time_taken: moves
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;

        const key = e.key;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

        e.preventDefault();

        setPlayerPos(prev => {
            let { x, y } = prev;
            let newX = x;
            let newY = y;

            if (key === 'ArrowUp') newY = y - 1;
            if (key === 'ArrowDown') newY = y + 1;
            if (key === 'ArrowLeft') newX = x - 1;
            if (key === 'ArrowRight') newX = x + 1;

            // Check if new position is a wall
            const posKey = `${newX},${newY}`;
            if (walls.has(posKey)) {
                // Hit a wall - briefly highlight it
                setLastHitWall(posKey);
                setWallHits(h => h + 1);
                return prev; // Don't move
            }

            // Valid move - clear previous hit wall highlight
            setLastHitWall(null);

            // Count move
            setMoves(m => m + 1);

            // Check if picked up key
            if (newX === keyPos.x && newY === keyPos.y && !hasKey) {
                setHasKey(true);
            }

            // Check if reached door with key
            if (newX === doorPos.x && newY === doorPos.y && hasKey) {
                setTimeout(() => handleWin(), 100);
            }

            return { x: newX, y: newY };
        });
    }, [gameState, walls, keyPos, doorPos, hasKey]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const resetGame = () => {
        setLevel(1);
    };

    const goToNextLevel = () => {
        if (level < MAX_LEVEL) {
            setLevel(l => l + 1);
        } else {
            // All levels complete - restart from level 1
            setLevel(1);
        }
        setGameState('playing');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-800 rounded-lg transition">
                        <ArrowLeft />
                    </button>
                    <div className="flex gap-8 items-center">
                        <div className="text-lg font-bold">Level: {level}</div>
                        <div className="text-lg font-bold">Moves: {moves}</div>
                        <div className="text-lg font-bold text-red-400">Wall Hits: {wallHits}</div>
                        <div className={`text-lg font-bold ${hasKey ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {hasKey ? '🔑 Key Found!' : '🔑 Find Key'}
                        </div>
                        <button 
                            onClick={() => setShowWalls(!showWalls)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm flex items-center gap-2"
                            title="Peek at walls (cheating!)"
                        >
                            {showWalls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            Peek
                        </button>
                    </div>
                    <button 
                        onClick={resetGame}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        Reset
                    </button>
                </div>

                <div className="relative bg-gray-800 rounded-xl overflow-hidden border-4 border-purple-500/50 shadow-2xl mx-auto"
                    style={{ width: 'fit-content' }}>

                    {/* Grid Background */}
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_W}, 40px)`, gridTemplateRows: `repeat(${GRID_H}, 40px)` }}>
                        {Array(GRID_H * GRID_W).fill(0).map((_, i) => {
                            const x = i % GRID_W;
                            const y = Math.floor(i / GRID_W);
                            const posKey = `${x},${y}`;
                            const isWall = walls.has(posKey);
                            const isCurrentHitWall = lastHitWall === posKey;
                            
                            return (
                                <div 
                                    key={i} 
                                    className={`border border-gray-700/20 w-10 h-10 transition-all duration-300 ${
                                        isCurrentHitWall ? 'bg-red-900/50 border-red-500' : ''
                                    } ${
                                        showWalls && isWall && !isCurrentHitWall ? 'bg-orange-900/30 border-orange-500/30' : ''
                                    }`}
                                ></div>
                            );
                        })}
                    </div>

                    {/* Player */}
                    <motion.div 
                        className="absolute top-0 left-0 pointer-events-none"
                        animate={{ 
                            x: playerPos.x * 40, 
                            y: playerPos.y * 40 
                        }}
                        transition={{ duration: 0.1 }}
                    >
                        <div className="w-10 h-10 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full shadow-lg flex items-center justify-center border-2 border-blue-300">
                                <span className="text-xs font-bold">P</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Key */}
                    {!hasKey && (
                        <div 
                            className="absolute top-0 left-0 pointer-events-none"
                            style={{ transform: `translate(${keyPos.x * 40}px, ${keyPos.y * 40}px)` }}
                        >
                            <div className="w-10 h-10 flex items-center justify-center">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <Key className="text-yellow-400 w-7 h-7 drop-shadow-lg" />
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Door */}
                    <div 
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{ transform: `translate(${doorPos.x * 40}px, ${doorPos.y * 40}px)` }}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${
                            hasKey ? 'opacity-100' : 'opacity-40'
                        }`}>
                            <motion.div
                                animate={hasKey ? { 
                                    scale: [1, 1.1, 1],
                                } : {}}
                                transition={{ 
                                    duration: 1,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            >
                                <div className={`w-7 h-9 rounded-sm border-2 flex items-center justify-center text-lg font-bold ${
                                    hasKey ? 'bg-green-500 border-green-300 text-white' : 'bg-gray-600 border-gray-400 text-gray-200'
                                }`}>
                                    🚪
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Win Overlay */}
                    {gameState === 'won' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm z-30"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.5 }}
                            >
                                <Trophy className="w-24 h-24 text-yellow-400 mb-4" />
                            </motion.div>
                            <h2 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                Victory!
                            </h2>
                            <div className="text-center mb-6">
                                <p className="text-gray-300 text-xl mb-2">You found the key and escaped!</p>
                                <p className="text-gray-400">Total Moves: {moves}</p>
                                <p className="text-gray-400">Wall Hits: {wallHits}</p>
                                <p className="text-green-400 font-bold text-2xl mt-2">
                                    Score: {Math.max(1000 - (moves * 5) - (wallHits * 20), 100)}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={goToNextLevel}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition"
                                >
                                    {level < MAX_LEVEL ? 'Next Level' : 'Play Again (Level 1)'}
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">🧠 Memory Challenge</h3>
                    <p className="text-gray-300 mb-2">
                        <span className="font-bold text-white">Objective:</span> Find the hidden key 🔑 and reach the door 🚪
                    </p>
                    <p className="text-gray-300 mb-2">
                        <span className="font-bold text-white">Challenge:</span> Walls are invisible until you hit them! Remember the maze layout.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Use arrow keys to move. Fewer moves and wall hits = higher score!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyCollectionGame;
