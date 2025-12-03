import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameSelection from './components/GameSelection';
import GameScreen from './components/GameScreen';
import { Player, GameMode } from './types';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameMode | null>(null);

  if (players.length === 0) {
    return <SetupScreen onComplete={setPlayers} />;
  }

  if (!selectedGame) {
    return <GameSelection onSelect={setSelectedGame} />;
  }

  return (
    <GameScreen
      mode={selectedGame}
      players={players}
      onExit={() => setSelectedGame(null)}
    />
  );
}

export default App;
