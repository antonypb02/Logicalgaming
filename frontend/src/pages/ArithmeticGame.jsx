import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Calculator, Check, X, Clock } from 'lucide-react';

const TOTAL_QUESTIONS = 10;

const generateQuestions = () => {
    const questions = [];
    const ops = ['+', '-', '*'];

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const operator = ops[Math.floor(Math.random() * ops.length)];
        let n1, n2, answer;

        if (operator === '*') {
            n1 = Math.floor(Math.random() * 12) + 2;
            n2 = Math.floor(Math.random() * 12) + 2;
            answer = n1 * n2;
        } else if (operator === '-') {
            n1 = Math.floor(Math.random() * 50) + 10;
            n2 = Math.floor(Math.random() * n1);
            answer = n1 - n2;
        } else {
            n1 = Math.floor(Math.random() * 50) + 1;
            n2 = Math.floor(Math.random() * 50) + 1;
            answer = n1 + n2;
        }

        questions.push({ id: i, n1, n2, operator, answer, userAnswer: '' });
    }
    return questions;
};

const ArithmeticGame = () => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState('start'); // start, playing, finished
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const inputRef = useRef(null);

    const startGame = () => {
        setQuestions(generateQuestions());
        setCurrentIndex(0);
        setScore(0);
        setResults([]);
        setStartTime(Date.now());
        setElapsedTime(0);
        setGameState('playing');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleAnswerChange = (value) => {
        const updated = [...questions];
        updated[currentIndex].userAnswer = value;
        setQuestions(updated);
    };

    const goNext = () => {
        if (currentIndex < TOTAL_QUESTIONS - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = async () => {
        let correctCount = 0;
        const resultsData = questions.map(q => {
            const isCorrect = parseInt(q.userAnswer) === q.answer;
            if (isCorrect) correctCount++;
            return { ...q, isCorrect };
        });

        setResults(resultsData);
        setScore(correctCount * 10);
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        setElapsedTime(timeTaken);
        setGameState('finished');

        const user = JSON.parse(localStorage.getItem('user'));
        try {
            await api.post('/submit_game', {
                user_id: user.id,
                game_type: 'arithmetic',
                score: correctCount * 10,
                time_taken: Math.round((Date.now() - startTime) / 1000)
            });
        } catch (error) {
            console.error("Failed to submit score", error);
        }
    };

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/10">
                    <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white p-2 rounded-lg transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calculator size={24} /> Arithmetic Challenge
                    </h2>
                    <div className="w-10"></div>
                </div>

                <div className="p-8 text-center">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Calculator className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Ready to Test Your Math?</h3>
                            <p className="text-white/70 mb-8">Answer {TOTAL_QUESTIONS} arithmetic questions.<br />Submit when you're done to see your score!</p>
                            <button
                                onClick={startGame}
                                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-emerald-600 transition shadow-lg"
                            >
                                Start Quiz
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentQuestion && (
                        <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-white/60 mb-1">
                                    <span>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Question Card */}
                            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
                                <div className="text-5xl font-bold text-white mb-6">
                                    {currentQuestion.n1} {currentQuestion.operator} {currentQuestion.n2} = ?
                                </div>
                                <input
                                    ref={inputRef}
                                    type="number"
                                    value={currentQuestion.userAnswer}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                    className="w-full text-center text-3xl font-bold py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                                    placeholder="Your answer"
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between items-center gap-4">
                                <button
                                    onClick={goPrev}
                                    disabled={currentIndex === 0}
                                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>

                                {currentIndex === TOTAL_QUESTIONS - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-bold hover:from-green-500 hover:to-emerald-600 transition shadow-lg"
                                    >
                                        Submit Answers
                                    </button>
                                ) : (
                                    <button
                                        onClick={goNext}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>

                            {/* Question Dots */}
                            <div className="flex justify-center gap-2 mt-6">
                                {questions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`w-3 h-3 rounded-full transition-all ${i === currentIndex
                                            ? 'bg-cyan-400 scale-125'
                                            : q.userAnswer !== ''
                                                ? 'bg-green-400'
                                                : 'bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-white mb-4">🎉 Congratulations!</h3>
                            <p className="text-white/80 text-lg mb-4">
                                You got <span className="font-bold text-cyan-400">{score / 10}</span> right answers out of <span className="font-bold text-cyan-400">{TOTAL_QUESTIONS}</span> in <span className="font-bold text-pink-400">{elapsedTime}</span> seconds!
                            </p>
                            <div className="flex items-center justify-center gap-2 text-white/60 mb-6">
                                <Clock size={18} />
                                <span>Time: {elapsedTime}s</span>
                            </div>

                            {/* Results Summary */}
                            <div className="bg-white/5 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto text-left border border-white/10">
                                {results.map((r, i) => (
                                    <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg mb-1 ${r.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        <span className="text-white/80 text-sm">{r.n1} {r.operator} {r.n2} = {r.answer}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${r.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                You: {r.userAnswer || '-'}
                                            </span>
                                            {r.isCorrect ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-red-400" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-3 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
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
};

export default ArithmeticGame;
