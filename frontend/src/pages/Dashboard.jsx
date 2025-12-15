import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Arithmetic Game</h3>
                    <p className="text-gray-600 mb-4">Test your mental math speed!</p>
                    <button
                        onClick={() => navigate('/game/arithmetic')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Pathfinding Game</h3>
                    <p className="text-gray-600 mb-4">Navigate the maze to the goal.</p>
                    <button
                        onClick={() => navigate('/game/pathfinding')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Key Collection</h3>
                    <p className="text-gray-600 mb-4">Collect keys while avoiding enemies!</p>
                    <button
                        onClick={() => navigate('/game/key-collection')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Bubble Sort</h3>
                    <p className="text-gray-600 mb-4">Order bubbles from lowest to highest!</p>
                    <button
                        onClick={() => navigate('/game/bubble-sort')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Rat Maze Game</h3>
                    <p className="text-gray-600 mb-4">Guide the rat through the maze to the cheese!</p>
                    <button
                        onClick={() => navigate('/game/rat-maze')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Super Hard Maze</h3>
                    <p className="text-gray-600 mb-4">Take on the extreme difficulty maze challenge.</p>
                    <button
                        onClick={() => navigate('/game/superhardmaze')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Play Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
