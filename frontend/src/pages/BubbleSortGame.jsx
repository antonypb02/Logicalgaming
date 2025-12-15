import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Clock, HelpCircle } from 'lucide-react';

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 15; // seconds

const generateExpression = () => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, value, display;

    if (op === '×') {
        n1 = Math.floor(Math.random() * 10) + 1;
        n2 = Math.floor(Math.random() * 10) + 1;
        value = n1 * n2;
        display = `${n1} × ${n2}`;
    } else if (op === '÷') {
        n2 = Math.floor(Math.random() * 9) + 2;
        value = Math.floor(Math.random() * 10) + 1;
        n1 = n2 * value;
        display = `${n1} ÷ ${n2}`;
    } else if (op === '-') {
        n1 = Math.floor(Math.random() * 30) + 5;
        n2 = Math.floor(Math.random() * n1);
        value = n1 - n2;
        display = `${n1} - ${n2}`;
    } else {
        n1 = Math.floor(Math.random() * 20) + 1;
        n2 = Math.floor(Math.random() * 20) + 1;
        value = n1 + n2;
        display = `${n1} + ${n2}`;
    }

    return { display, value };
};

const generateQuestions = () => {
    const questions = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        let bubbles = [];
        const usedValues = new Set();

        while (bubbles.length < 3) {
            const expr = generateExpression();
            if (!usedValues.has(expr.value)) {
                usedValues.add(expr.value);
                bubbles.push({ id: bubbles.length, ...expr, selected: false, order: null });
            }
        }

        // Shuffle positions for display
        bubbles = bubbles.sort(() => Math.random() - 0.5);

        questions.push({ id: i, bubbles, userOrder: [], isCorrect: null });
    }
    return questions;
};

const BubbleSortGame = () => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState('start');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const startGame = () => {
        setQuestions(generateQuestions());
        setCurrentIndex(0);
        setScore(0);
        setTimeLeft(TIME_PER_QUESTION);
        setStartTime(Date.now());
        setGameState('playing');
    };

    // Timer for each question
    useEffect(() => {
        if (gameState !== 'playing') return;
        if (timeLeft <= 0) {
            handleNextQuestion(false);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const handleBubbleClick = (bubbleId) => {
        if (gameState !== 'playing') return;

        const updatedQuestions = [...questions];
        const q = updatedQuestions[currentIndex];
        const bubbleIndex = q.bubbles.findIndex(b => b.id === bubbleId);
        const bubble = q.bubbles[bubbleIndex];

        if (bubble.order !== null) {
            // Deselect: remove this and all after it
            const orderToRemove = bubble.order;
            q.bubbles.forEach(b => {
                if (b.order !== null && b.order >= orderToRemove) {
                    b.order = null;
                    b.selected = false;
                }
            });
            q.userOrder = q.userOrder.filter(o => o < orderToRemove);
        } else {
            // Select
            const nextOrder = q.userOrder.length;
            bubble.selected = true;
            bubble.order = nextOrder;
            q.userOrder.push(bubble.value);

            // Check if 3 selected
            if (q.userOrder.length === 3) {
                const sortedValues = [...q.bubbles].map(b => b.value).sort((a, b) => a - b);
                const isCorrect = q.userOrder.every((v, i) => v === sortedValues[i]);
                q.isCorrect = isCorrect;

                setQuestions(updatedQuestions);

                setTimeout(() => {
                    handleNextQuestion(isCorrect);
                }, 800);
                return;
            }
        }

        setQuestions(updatedQuestions);
    };

    const handleNextQuestion = (wasCorrect) => {
        if (wasCorrect) setScore(s => s + 1);

        if (currentIndex < TOTAL_QUESTIONS - 1) {
            setCurrentIndex(i => i + 1);
            setTimeLeft(TIME_PER_QUESTION);
        } else {
            finishGame(wasCorrect ? score + 1 : score);
        }
    };

    const finishGame = async (finalScore) => {
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        setElapsedTime(timeTaken);
        setScore(finalScore);
        setGameState('finished');

        const user = JSON.parse(localStorage.getItem('user'));
        try {
            await api.post('/submit_game', {
                user_id: user.id,
                game_type: 'bubble_sort',
                score: finalScore * 10,
                time_taken: timeTaken
            });
        } catch (e) {
            console.error(e);
        }
    };

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-slate-800 flex justify-between items-center">
                    <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white p-2 rounded-lg transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-white">Numerical Ordering</h2>
                    <button className="text-white/70 hover:text-white p-2 rounded-lg transition">
                        <HelpCircle size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <span className="text-4xl">🫧</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Bubble Sort Challenge</h3>
                            <div className="bg-slate-50 rounded-xl p-6 mb-6 text-left text-slate-600 space-y-3">
                                <p>• Three bubbles will appear, each with a number or expression.</p>
                                <p>• Select them in order from <strong>LOWEST</strong> to <strong>HIGHEST</strong> value.</p>
                                <p>• Click a bubble to select it. Click again to deselect.</p>
                                <p>• You have {TIME_PER_QUESTION} seconds per question.</p>
                            </div>
                            <button
                                onClick={startGame}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
                            >
                                Start Game
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentQuestion && (
                        <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Progress */}
                            <div className="flex justify-between text-sm text-slate-500 mb-2">
                                <span>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</span>
                                <span>Score: {score}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>

                            {/* Bubbles Area */}
                            <div className="relative h-80 flex items-center justify-center">
                                {currentQuestion.bubbles.map((bubble, i) => {
                                    const positions = [
                                        { top: '10%', left: '50%', transform: 'translateX(-50%)' },
                                        { top: '50%', right: '10%' },
                                        { bottom: '15%', left: '30%' },
                                    ];
                                    const pos = positions[i];
                                    const size = bubble.order !== null ? 'w-32 h-32' : 'w-28 h-28';

                                    return (
                                        <motion.button
                                            key={bubble.id}
                                            onClick={() => handleBubbleClick(bubble.id)}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`absolute ${size} rounded-full flex flex-col items-center justify-center font-bold text-xl transition-all duration-200 shadow-xl ${bubble.order !== null
                                                    ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white ring-4 ring-blue-400'
                                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
                                                }`}
                                            style={pos}
                                        >
                                            <span className="text-lg">{bubble.display}</span>
                                            {bubble.order !== null && (
                                                <span className="text-xs mt-1 bg-blue-400 text-white px-2 py-0.5 rounded-full">
                                                    {bubble.order + 1}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Timer & Instructions */}
                            <div className="flex items-center justify-center gap-4 mt-8 bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg ${timeLeft <= 5 ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-600'
                                        }`}>
                                        {timeLeft}
                                    </div>
                                </div>
                                <div className="text-center text-slate-600">
                                    <p className="font-medium">Select the bubbles in order from the</p>
                                    <p><strong>LOWEST</strong> to the <strong>HIGHEST</strong> value</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">🎉 Well Done!</h3>
                            <p className="text-slate-600 text-lg mb-2">
                                You got <span className="font-bold text-blue-600">{score}</span> right answers out of <span className="font-bold text-blue-600">{TOTAL_QUESTIONS}</span>
                            </p>
                            <p className="text-slate-500 mb-6">
                                Completed in <span className="font-bold">{elapsedTime}</span> seconds
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition"
                                >
                                    Play Again
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
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
};

export default BubbleSortGame;
