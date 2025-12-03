import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameSelection from './components/GameSelection';
import GameScreen from './components/GameScreen';
import { Player, GameMode } from './types';

function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameMode | null>(null);

  if (!player) {
    return <SetupScreen onComplete={setPlayer} />;
  }

  if (!selectedGame) {
    return <GameSelection onSelect={setSelectedGame} />;
  }

  return (
    <GameScreen 
      mode={selectedGame} 
      player={player} 
      onExit={() => setSelectedGame(null)} 
    />
  );
}

export default App;
