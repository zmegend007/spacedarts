import React from 'react';
import { GameMode } from '../types';
import { Target, Trophy, Clock, Skull, Hash, PlayCircle } from 'lucide-react';

interface GameSelectionProps {
  onSelect: (mode: GameMode) => void;
}

const GameSelection: React.FC<GameSelectionProps> = ({ onSelect }) => {
  const games = [
    {
      mode: GameMode.X01,
      name: "501 Double Out",
      description: "The professional standard. Start at 501, finish on a double.",
      icon: <Trophy className="h-8 w-8 text-dart-gold" />,
      difficulty: "Hard"
    },
    {
      mode: GameMode.CRICKET,
      name: "Cricket",
      description: "Close numbers 15-20 and Bullseye. Strategy & accuracy.",
      icon: <Target className="h-8 w-8 text-dart-accent" />,
      difficulty: "Medium"
    },
    {
      mode: GameMode.CLOCK,
      name: "Around the Clock",
      description: "Hit 1-20 in order. Great for beginners.",
      icon: <Clock className="h-8 w-8 text-blue-400" />,
      difficulty: "Easy"
    },
    {
      mode: GameMode.KILLER,
      name: "Killer",
      description: "Eliminate opponents by hitting their doubles.",
      icon: <Skull className="h-8 w-8 text-red-500" />,
      difficulty: "Medium"
    },
    {
      mode: GameMode.SHANGHAI,
      name: "Shanghai",
      description: "Round-based scoring. Hit single, double, triple for bonus.",
      icon: <Hash className="h-8 w-8 text-purple-400" />,
      difficulty: "Medium"
    },
    {
      mode: GameMode.X01_301,
      name: "301 Double In/Out",
      description: "Quicker version of 501. Double to start and finish.",
      icon: <PlayCircle className="h-8 w-8 text-green-400" />,
      difficulty: "Medium"
    }
  ];

  return (
    <div className="min-h-screen bg-dart-dark p-6">
      <h1 className="text-4xl font-bold text-center text-white mb-2 brand-font">SELECT GAME MODE</h1>
      <p className="text-center text-gray-400 mb-10">Choose your challenge</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {games.map((game) => (
          <button
            key={game.mode}
            onClick={() => onSelect(game.mode)}
            className="bg-dart-panel border border-gray-700 hover:border-dart-accent rounded-xl p-6 flex flex-col items-center text-center transition-all hover:transform hover:scale-105 group"
          >
            <div className="mb-4 p-4 bg-dart-dark rounded-full group-hover:bg-dart-accent/20 transition-colors">
              {game.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 brand-font">{game.name}</h3>
            <p className="text-gray-400 text-sm mb-4 flex-grow">{game.description}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              game.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
              game.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {game.difficulty}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameSelection;
