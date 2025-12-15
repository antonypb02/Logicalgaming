import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PsychometricTest from './pages/PsychometricTest';
import Dashboard from './pages/Dashboard';

import ArithmeticGame from './pages/ArithmeticGame';
import PathfindingGame from './pages/PathfindingGame';
import KeyCollectionGame from './pages/KeyCollectionGame';
import BubbleSortGame from './pages/BubbleSortGame';
import RatMazeGame from './pages/RatMazeGame';
import SuperHardMaze from './pages/SuperHardMaze';
function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/test" element={<PsychometricTest />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game/rat-maze" element={<RatMazeGame />} />
        <Route path="/game/superhardmaze" element={<SuperHardMaze />} />
        <Route path="/game/arithmetic" element={<ArithmeticGame />} />
        <Route path="/game/pathfinding" element={<PathfindingGame />} />
        <Route path="/game/key-collection" element={<KeyCollectionGame />} />
        <Route path="/game/bubble-sort" element={<BubbleSortGame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
