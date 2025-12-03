import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameSelection from './components/GameSelection';
import GameScreen from './components/GameScreen';
import { Player, GameMode } from './types';

function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('dartmaster_players');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGame, setSelectedGame] = useState<GameMode | null>(() => {
    const saved = localStorage.getItem('dartmaster_game_mode');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist state changes
  React.useEffect(() => {
    localStorage.setItem('dartmaster_players', JSON.stringify(players));
  }, [players]);

  React.useEffect(() => {
    if (selectedGame) {
      localStorage.setItem('dartmaster_game_mode', JSON.stringify(selectedGame));
    } else {
      localStorage.removeItem('dartmaster_game_mode');
    }
  }, [selectedGame]);

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
      onExit={() => {
        setSelectedGame(null);
        // Optional: Clear game state on exit
        localStorage.removeItem('dartmaster_gamestate');
      }}
    />
  );
}

export default App;
