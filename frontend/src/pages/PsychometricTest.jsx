import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, AlertCircle } from 'lucide-react';

const questions = [
    { id: 1, text: "I am the life of the party.", trait: "extraversion" },
    { id: 2, text: "I sympathize with others' feelings.", trait: "agreeableness" },
    { id: 3, text: "I get chores done right away.", trait: "conscientiousness" },
    { id: 4, text: "I have frequent mood swings.", trait: "neuroticism" },
    { id: 5, text: "I have a vivid imagination.", trait: "openness" },
    { id: 6, text: "I don't talk a lot.", trait: "extraversion", reverse: true },
    { id: 7, text: "I am not interested in other people's problems.", trait: "agreeableness", reverse: true },
    { id: 8, text: "I often forget to put things back in their proper place.", trait: "conscientiousness", reverse: true },
    { id: 9, text: "I am relaxed most of the time.", trait: "neuroticism", reverse: true },
    { id: 10, text: "I am not interested in abstract ideas.", trait: "openness", reverse: true },
];

const options = [
    { value: 1, label: "Disagree Strongly" },
    { value: 2, label: "Disagree a little" },
    { value: 3, label: "Neither agree nor disagree" },
    { value: 4, label: "Agree a little" },
    { value: 5, label: "Agree Strongly" },
];

const PsychometricTest = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleOptionSelect = (value) => {
        setAnswers({ ...answers, [questions[currentStep].id]: value });
        if (currentStep < questions.length - 1) {
            setTimeout(() => setCurrentStep(currentStep + 1), 250);
        }
    };

    const calculateScores = () => {
        const scores = { extraversion: 0, agreeableness: 0, conscientiousness: 0, neuroticism: 0, openness: 0 };

        questions.forEach(q => {
            let val = answers[q.id] || 3;
            if (q.reverse) val = 6 - val; // Reverse scoring for 1-5 scale
            scores[q.trait] += val;
        });
        return scores;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const scores = calculateScores();
        const user = JSON.parse(localStorage.getItem('user'));

        try {
            await api.post('/submit_psychometric', {
                user_id: user.id,
                scores: scores
            });
            navigate('/dashboard');
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit results. Please try again.");
            setSubmitting(false);
        }
    };

    const currentQuestion = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    <div className="mb-8">
                        <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase">
                            Question {currentStep + 1} of {questions.length}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                            {currentQuestion.text}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {options.map((option) => (
                            <motion.button
                                key={option.value}
                                whileHover={{ scale: 1.01, backgroundColor: '#f8fafc' }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleOptionSelect(option.value)}
                                className={`w-full p-4 text-left rounded-xl border-2 transition-colors flex items-center justify-between group ${answers[currentQuestion.id] === option.value
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-400'
                                    }`}
                            >
                                <span className={`font-medium ${answers[currentQuestion.id] === option.value ? 'text-blue-700' : 'text-gray-700'
                                    }`}>
                                    {option.label}
                                </span>
                                {answers[currentQuestion.id] === option.value && (
                                    <Check className="w-5 h-5 text-blue-600" />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className={`text-gray-500 hover:text-gray-700 font-medium ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''
                                }`}
                        >
                            Back
                        </button>

                        {currentStep === questions.length - 1 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSubmit}
                                disabled={!answers[currentQuestion.id] || submitting}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-blue-200"
                            >
                                {submitting ? 'Submitting...' : 'Complete Test'}
                                {!submitting && <ChevronRight className="w-5 h-5" />}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PsychometricTest;
