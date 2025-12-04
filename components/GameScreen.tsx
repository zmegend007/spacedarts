import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameMode, DartThrow, Round, Multiplier } from '../types';
import { Mic, MicOff, ArrowLeft, Lightbulb, Award, Target, Trash2, Settings, Wifi } from 'lucide-react';
import { generateHostSpeech, GameContext, generateGameCommentary, GameEventType } from '../services/gemini';
import { globalAudioQueue } from '../services/audioUtils';
import { voiceRecognition } from '../services/voiceRecognition';
import { calculateCheckout } from '../services/checkoutCalculator';
import { checkAchievements, saveUnlockedAchievement, GameStats } from '../services/achievements';
import { createDartThrow, createRound, COMMON_TARGETS, parseDartInput } from '../services/dartScoring';
import { processThrow, getInitialScore, getTargetLabel, CLOCK_SEQUENCE } from '../services/gameEngines';
import { autodartsService } from '../services/autodartsService';
import { createGame, saveGame } from '../services/firestoreService';
import { logGameStart, logGameEnd, logDartThrow } from '../services/analyticsService';
import ChatAssistant from './ChatAssistant';
import AutodartsSettings from './AutodartsSettings';
import { useToast } from './Toast';

interface GameScreenProps {
  mode: GameMode;
  players: Player[];
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ mode, players, onExit }) => {
  const { showToast } = useToast();
  // Game State
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]); // For Clock: This is the Target Index (0-20)
  const [playerRounds, setPlayerRounds] = useState<Round[][]>([]);
  const [currentThrows, setCurrentThrows] = useState<DartThrow[]>([]);

  // UI State
  const [isListening, setIsListening] = useState(false);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>('S');

  // Stats per player
  const [allGameStats, setAllGameStats] = useState<GameStats[]>([]);

  // Autodarts state
  const [showAutodartsSettings, setShowAutodartsSettings] = useState(false);
  const [autodartsConnected, setAutodartsConnected] = useState(false);

  // Firebase state
  const [gameId, setGameId] = useState<string | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const currentScore = scores[currentPlayerIndex] || 0;
  const currentRounds = playerRounds[currentPlayerIndex] || [];
  const currentStats = allGameStats[currentPlayerIndex] || {
    roundScores: [],
    doublesHit: 0,
    treblesHit: 0,
    bullseyesHit: 0,
    highestRound: 0,
    gameWon: false,
    dartsThrown: 0
  };

  const playVoice = useCallback(async (text: string) => {
    try {
      const audioBase64 = await generateHostSpeech(text);
      await globalAudioQueue.playBase64(audioBase64);
    } catch (e) {
      console.error("Audio playback error", e);
    }
  }, []);

  // Initial Game Setup & Persistence Loading
  useEffect(() => {
    const savedState = localStorage.getItem('dartmaster_gamestate');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only load if mode matches (basic check)
        if (parsed.mode === mode && parsed.players.length === players.length) {
          setScores(parsed.scores);
          setPlayerRounds(parsed.playerRounds);
          setCurrentPlayerIndex(parsed.currentPlayerIndex);
          setAllGameStats(parsed.allGameStats);
          return; // Skip default init
        }
      } catch (e) {
        console.error("Failed to load saved game", e);
      }
    }

    // Default Initialization
    const start = getInitialScore(mode);
    setScores(new Array(players.length).fill(start));
    setPlayerRounds(new Array(players.length).fill([]));
    setAllGameStats(new Array(players.length).fill({
      roundScores: [],
      doublesHit: 0,
      treblesHit: 0,
      bullseyesHit: 0,
      highestRound: 0,
      gameWon: false,
      dartsThrown: 0
    }));

    const intro = mode === GameMode.CLOCK
      ? `Welcome to Around the Clock. The target is 1. ${players[0].alias}, you're up!`
      : `Welcome to ${mode}. ${players[0].alias}, you are up first!`;

    // Temporarily disabled to debug crash
    // playVoice(intro);

    // Create game in Firebase
    createGame({
      player1Name: players[0].alias,
      player2Name: players.length > 1 ? players[1].alias : 'CPU',
      player1Score: start,
      player2Score: players.length > 1 ? start : start,
      currentPlayer: 1,
      gameMode: mode
    }).then((id) => {
      setGameId(id);
      console.log('Game created in Firebase:', id);
      showToast('success', 'Game saved to Firebase!');
      logGameStart(mode, players.length);
    }).catch((error) => {
      console.error('Failed to create game:', error);
      showToast('error', 'Failed to save game');
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, players]); // Re-run only if mode/players change (new game)



  // Persist Game State on Change
  useEffect(() => {
    if (scores.length > 0) {
      const stateToSave = {
        mode,
        players, // Store players to verify match on load
        scores,
        playerRounds,
        currentPlayerIndex,
        allGameStats
      };
      localStorage.setItem('dartmaster_gamestate', JSON.stringify(stateToSave));
    }
  }, [scores, playerRounds, currentPlayerIndex, allGameStats, mode, players]);


  const handleVoiceToggle = () => {
    if (!voiceRecognition.isSupported()) {
      showToast('warning', 'Voice recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      voiceRecognition.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceRecognition.startListening(
        (command) => {
          const dartThrow = parseDartInput(command.raw);
          if (dartThrow) {
            addDartThrow(dartThrow);
            playVoice(`${dartThrow.display}`);
          }
          setIsListening(false);
        },
        (error) => {
          console.error('Voice error:', error);
          setIsListening(false);
        }
      );
    }
  };



  const addDartThrow = (dartThrow: DartThrow) => {
    const newThrows = [...currentThrows, dartThrow];
    setCurrentThrows(newThrows);

    if (newThrows.length === 3) {
      completeRound(newThrows);
    }
  };

  const handleNumberClick = (number: number) => {
    const dartThrow = createDartThrow(selectedMultiplier, number);
    addDartThrow(dartThrow);
  };

  const completeRound = (throws: DartThrow[] = currentThrows) => {
    if (throws.length === 0) return;

    const round = createRound(throws);
    const roundTotal = round.total;

    let newScore = currentScore;
    let message = '';
    let isGameWon = false;

    // --- GAME ENGINE LOGIC ---
    if (mode === GameMode.CLOCK) {
      // Process each throw sequentially for Clock
      let tempScore = currentScore;
      let hits = 0;

      throws.forEach(t => {
        const result = processThrow(mode, currentStats, t, tempScore, currentPlayerIndex);
        if (result.isValid && result.nextTarget !== undefined) {
          tempScore = result.nextTarget;
          hits++;
          if (result.isWin) isGameWon = true;
        }
      });

      newScore = tempScore;
      message = hits > 0 ? `${hits} hits! Moving to ${getTargetLabel(mode, newScore)}` : "No hits.";
      if (isGameWon) message = `BULLSEYE! ${currentPlayer.alias} WINS THE GAME!`;

    } else {
      // Standard X01 Logic (Legacy)
      if (mode === GameMode.X01 || mode === GameMode.X01_301) {
        if (currentScore - roundTotal < 0 || currentScore - roundTotal === 1) {
          message = `Bust! ${currentPlayer.alias} stays on ${currentScore}.`;
        } else {
          newScore = currentScore - roundTotal;
          message = `${roundTotal} scored! ${newScore} remaining.`;
          if (roundTotal > 100) message = `Wow! A massive ${roundTotal}!`;
          if (newScore === 0) {
            message = `Game Shot! ${currentPlayer.alias} wins the leg!`;
            isGameWon = true;
          }
        }
      } else {
        newScore = currentScore + roundTotal;
        message = `${roundTotal} points. Total is ${newScore}.`;
      }
    }

    // Update Scores
    const newScores = [...scores];
    newScores[currentPlayerIndex] = newScore;
    setScores(newScores);

    // Update Stats
    const doublesInRound = throws.filter(t => t.multiplier === 'D').length;
    const treblesInRound = throws.filter(t => t.multiplier === 'T').length;
    const bullsInRound = throws.filter(t => t.number === 25).length;

    const allRoundScores = [...currentRounds.map(r => r.total), roundTotal];
    const newStats: GameStats = {
      roundScores: allRoundScores,
      doublesHit: currentStats.doublesHit + doublesInRound,
      treblesHit: currentStats.treblesHit + treblesInRound,
      bullseyesHit: currentStats.bullseyesHit + bullsInRound,
      highestRound: Math.max(currentStats.highestRound, roundTotal),
      gameWon: isGameWon,
      checkoutScore: isGameWon ? roundTotal : undefined,
      dartsThrown: currentStats.dartsThrown + throws.length
    };

    const newAllStats = [...allGameStats];
    newAllStats[currentPlayerIndex] = newStats;
    setAllGameStats(newAllStats);

    // Check Achievements
    const unlockedAchievements = checkAchievements(newStats, currentStats);
    if (unlockedAchievements.length > 0) {
      const achievement = unlockedAchievements[0];
      saveUnlockedAchievement(achievement.id);
      setShowAchievement(achievement.celebrationMessage);
      playVoice(achievement.celebrationMessage);
      setTimeout(() => setShowAchievement(null), 5000);
    }

    // Update Rounds
    const newPlayerRounds = [...playerRounds];
    newPlayerRounds[currentPlayerIndex] = [...currentRounds, round];
    setPlayerRounds(newPlayerRounds);

    setCurrentThrows([]);

    // Turn Switching
    if (!isGameWon) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      // Delay slightly for natural flow
      setTimeout(async () => {
        setCurrentPlayerIndex(nextPlayerIndex);

        // AI Commentary Logic
        let aiCommentary = '';

        // Calculate Match Context
        const opponentIndex = (currentPlayerIndex + 1) % players.length;
        const opponentScore = scores[opponentIndex];
        const opponentAlias = players[opponentIndex].alias;

        let scoreDiff = 0;
        let stage: 'OPENING' | 'MIDGAME' | 'ENDGAME' = 'MIDGAME';

        if (mode === GameMode.CLOCK) {
          scoreDiff = newScore - opponentScore;
          if (newScore <= 5) stage = 'OPENING';
          else if (newScore >= 15) stage = 'ENDGAME';
        } else {
          scoreDiff = opponentScore - newScore; // X01: Lower is better
          if (newScore > 300) stage = 'OPENING';
          else if (newScore <= 100) stage = 'ENDGAME';
        }

        const context: GameContext = {
          mode,
          currentScore: newScore,
          roundHistory: [...currentRounds.map(r => r.total), roundTotal],
          playerAlias: currentPlayer.alias,
          opponentAlias,
          opponentScore,
          scoreDifference: scoreDiff,
          gameStage: stage
        };

        // Generate commentary for interesting events
        if (roundTotal >= 100) {
          aiCommentary = await generateGameCommentary(context, 'HIGH_SCORE', `Scored ${roundTotal}`);
        } else if (roundTotal < 20 && mode !== GameMode.CLOCK && roundTotal > 0) {
          aiCommentary = await generateGameCommentary(context, 'BAD_ROUND', `Scored ${roundTotal}`);
        } else if (mode === GameMode.X01 && newScore <= 170 && calculateCheckout(newScore)) {
          aiCommentary = await generateGameCommentary(context, 'CHECKOUT_READY', `Needs ${newScore}`);
        }

        const nextTarget = mode === GameMode.CLOCK ? getTargetLabel(mode, scores[nextPlayerIndex]) : '';

        let finalMsg = '';
        if (aiCommentary) {
          // If we have AI commentary, use it but keep the flow moving
          finalMsg = `${message}. ${aiCommentary}. ${nextPlayer.alias}, you're up!`;
        } else {
          // Standard fallback
          finalMsg = mode === GameMode.CLOCK
            ? `${message}. ${nextPlayer.alias}, aim for ${nextTarget}!`
            : `${message} ${nextPlayer.alias}, you're up!`;
        }

        playVoice(finalMsg);

        // Auto-save game state
        if (gameId) {
          saveGame(gameId, {
            player1Score: currentPlayerIndex === 0 ? newScore : scores[0],
            player2Score: currentPlayerIndex === 1 ? newScore : scores[1],
            currentPlayer: nextPlayerIndex + 1
          });
        }
      }, 1500);
    } else {
      // Game Won Logic
      (async () => {
        const context: GameContext = {
          mode,
          currentScore: newScore,
          roundHistory: [...currentRounds.map(r => r.total), roundTotal],
          playerAlias: currentPlayer.alias
        };
        const victorySpeech = await generateGameCommentary(context, 'GAME_WON');
        playVoice(victorySpeech || message);

        if (gameId) {
          saveGame(gameId, {
            winner: currentPlayer.alias,
            completedAt: new Date() as any // Cast to any to avoid timestamp issues for now
          });
          logGameEnd(mode, currentPlayer.alias, 0, newScore); // Duration 0 for now
        }
      })();
    }
  };

  const undoLastThrow = () => {
    if (currentThrows.length > 0) {
      setCurrentThrows(currentThrows.slice(0, -1));
    }
  };

  const getCurrentRoundTotal = () => {
    return currentThrows.reduce((sum, dart) => sum + dart.score, 0);
  };

  const checkout = (mode === GameMode.X01 || mode === GameMode.X01_301) && currentScore <= 170
    ? calculateCheckout(currentScore)
    : null;

  const gameContext: GameContext = {
    mode: mode,
    currentScore: currentScore,
    roundHistory: currentRounds.map(r => r.total),
    playerAlias: currentPlayer.alias
  };
  // Autodarts Integration
  useEffect(() => {
    const handleDartThrow = (dart: DartThrow) => {
      console.log('Autodarts throw received:', dart);
      addDartThrow(dart);
    };

    autodartsService.onDartThrow(handleDartThrow);

    return () => {
      autodartsService.off('dart_throw');
    };
  }, [addDartThrow]);

  return (
    <div className="min-h-screen bg-dart-dark flex flex-col">
      {/* Header */}
      <div className="bg-dart-panel p-4 flex justify-between items-center shadow-md">
        <button onClick={onExit} className="text-gray-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="h-5 w-5" />
          <span>Exit Game</span>
        </button>
        <div className="flex items-center space-x-4">
          {autodartsConnected && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">Autodarts Connected</span>
            </div>
          )}
          <button
            onClick={() => setShowAutodartsSettings(true)}
            className="text-gray-400 hover:text-white"
            title="Autodarts Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Player Indicators */}
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-full">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${idx === currentPlayerIndex
                  ? 'bg-dart-accent text-white ring-2 ring-white'
                  : 'text-gray-500 opacity-50'
                  }`}
              >
                <img src={p.avatarUrl} alt={p.alias} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-bold hidden sm:inline">{p.alias}</span>
                {mode === GameMode.CLOCK && (
                  <span className="text-xs bg-gray-700 px-1 rounded text-dart-gold">
                    Target: {getTargetLabel(mode, scores[idx])}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 border-4 border-yellow-300">
            <Award className="h-8 w-8" />
            <div>
              <div className="font-bold text-lg">ACHIEVEMENT UNLOCKED!</div>
              <div className="text-sm">{showAchievement}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {/* Left: Score/Dashboard Display */}
        <div className="flex flex-col items-center justify-center lg:w-1/3">
          <h2 className="text-dart-gold uppercase tracking-widest text-sm mb-2">{mode}</h2>

          {/* Active Player Badge */}
          <div className="flex items-center gap-2 mb-4 bg-dart-panel px-4 py-2 rounded-full border border-dart-accent/30">
            <img src={currentPlayer.avatarUrl} alt={currentPlayer.alias} className="w-8 h-8 rounded-full" />
            <span className="text-dart-accent font-bold">{currentPlayer.alias}'s Turn</span>
          </div>

          {/* DYNAMIC DASHBOARD */}
          {mode === GameMode.CLOCK ? (
            // --- AROUND THE CLOCK DASHBOARD ---
            <div className="w-full max-w-sm">
              <div className="bg-dart-panel p-6 rounded-3xl border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] text-center mb-4">
                <h3 className="text-gray-400 text-sm uppercase mb-2">Current Target</h3>
                <h1 className="text-8xl font-bold text-white brand-font">
                  {getTargetLabel(mode, currentScore)}
                </h1>
              </div>

              {/* Clock Progress Track */}
              <div className="bg-gray-800 p-4 rounded-xl flex flex-wrap gap-2 justify-center">
                {CLOCK_SEQUENCE.map((num, idx) => {
                  const isCompleted = idx < currentScore;
                  const isCurrent = idx === currentScore;
                  return (
                    <div
                      key={num}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${isCompleted ? 'bg-green-600 text-white' :
                        isCurrent ? 'bg-blue-500 text-white ring-2 ring-white scale-110' :
                          'bg-gray-700 text-gray-500'
                        }`}
                    >
                      {num === 25 ? 'B' : num}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // --- STANDARD SCOREBOARD ---
            <div className="bg-dart-panel p-8 rounded-3xl border-4 border-dart-neon shadow-[0_0_20px_rgba(15,52,96,0.5)] min-w-[250px] text-center mb-4 relative">
              <h1 className="text-7xl font-bold text-white brand-font tabular-nums">
                {currentScore}
              </h1>
              {/* Opponent Scores Mini-View */}
              <div className="absolute -right-32 top-0 hidden xl:block">
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <h4 className="text-xs text-gray-400 mb-2">Opponents</h4>
                  {players.map((p, idx) => idx !== currentPlayerIndex && (
                    <div key={p.id} className="flex items-center gap-2 mb-2 last:mb-0">
                      <img src={p.avatarUrl} className="w-6 h-6 rounded-full opacity-70" />
                      <span className="text-gray-300 font-bold">{scores[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Checkout Suggestion (Only for X01) */}
          {checkout && (
            <div className="bg-green-900/50 border-2 border-green-500 rounded-lg px-4 py-2 mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-green-400" />
              <span className="text-green-200 font-semibold">{checkout.description}</span>
            </div>
          )}

          {/* Current Round Progress */}
          <div className="bg-dart-panel p-4 rounded-lg w-full max-w-sm mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-gray-400 text-sm">Current Round ({currentThrows.length}/3)</h3>
              <span className="text-dart-gold font-bold">{getCurrentRoundTotal()}</span>
            </div>
            <div className="flex gap-2 mb-3">
              {currentThrows.map((dart, idx) => (
                <div key={idx} className="bg-gray-700 px-3 py-2 rounded text-white font-bold">
                  {dart.display}
                </div>
              ))}
              {[...Array(3 - currentThrows.length)].map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-gray-800 px-3 py-2 rounded text-gray-600">
                  -
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={undoLastThrow}
                disabled={currentThrows.length === 0}
                className="flex-1 bg-red-900/50 hover:bg-red-900 disabled:opacity-30 text-white py-2 rounded flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Undo
              </button>
              <button
                onClick={() => completeRound()}
                disabled={currentThrows.length === 0}
                className="flex-1 bg-dart-green hover:bg-green-600 disabled:opacity-30 text-white py-2 rounded font-bold"
              >
                Complete Round
              </button>
            </div>
          </div>


        </div>

        {/* Center: Dart Input */}
        <div className="flex flex-col items-center justify-center lg:w-1/3">
          {/* Multiplier Selector */}
          <div className="flex gap-2 mb-4">
            {(['S', 'D', 'T'] as Multiplier[]).map(mult => (
              <button
                key={mult}
                onClick={() => setSelectedMultiplier(mult)}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${selectedMultiplier === mult
                  ? 'bg-dart-accent text-white scale-110'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                {mult === 'S' ? 'Single' : mult === 'D' ? 'Double' : 'Triple'}
              </button>
            ))}
          </div>

          {/* Quick Targets */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {COMMON_TARGETS.map(target => (
              <button
                key={target.label}
                onClick={() => addDartThrow(createDartThrow(target.multiplier, target.number))}
                className="bg-blue-900/50 hover:bg-blue-800 border border-blue-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                {target.label}
              </button>
            ))}
          </div>

          {/* Number Grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5].map(num => {
              // Highlight current target in Clock mode
              const isTarget = mode === GameMode.CLOCK && CLOCK_SEQUENCE[currentScore] === num;

              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`font-bold py-3 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${isTarget
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-800 ring-2 ring-white scale-105 z-10'
                    : 'bg-dart-panel hover:bg-gray-700 text-white border-gray-900'
                    }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Special Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <button
              onClick={() => handleNumberClick(25)}
              className={`font-bold py-3 rounded-lg border border-yellow-600 ${mode === GameMode.CLOCK && CLOCK_SEQUENCE[currentScore] === 25
                ? 'bg-yellow-600 text-white ring-2 ring-white'
                : 'bg-yellow-900/50 hover:bg-yellow-800 text-white'
                }`}
            >
              Bull
            </button>
            <button
              onClick={() => addDartThrow(createDartThrow('S', 0))}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg"
            >
              Miss (0)
            </button>
            <button
              onClick={handleVoiceToggle}
              className={`${isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-lg flex items-center justify-center`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Right: Round History */}
        <div className="lg:w-1/3 bg-dart-panel p-4 rounded-lg overflow-y-auto max-h-[600px]">
          <h3 className="text-gray-400 text-sm mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {currentPlayer.alias}'s History
          </h3>
          <div className="space-y-2">
            {currentRounds.slice().reverse().map((round, idx) => (
              <div key={currentRounds.length - idx} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs">Round {currentRounds.length - idx}</span>
                  <span className="text-dart-gold font-bold">{round.total}</span>
                </div>
                <div className="flex gap-2">
                  {round.throws.map((dart, dartIdx) => (
                    <div
                      key={dartIdx}
                      className={`px-2 py-1 rounded text-sm font-semibold ${dart.multiplier === 'T' ? 'bg-red-600 text-white' :
                        dart.multiplier === 'D' ? 'bg-green-600 text-white' :
                          'bg-gray-700 text-gray-300'
                        }`}
                    >
                      {dart.display}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {currentRounds.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                No rounds yet. Start throwing!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat with Game Context */}
      <ChatAssistant gameContext={gameContext} />

      {/* Autodarts Settings Modal */}
      {showAutodartsSettings && (
        <AutodartsSettings onClose={() => {
          setShowAutodartsSettings(false);
          setAutodartsConnected(autodartsService.isConnected());
        }} />
      )}
    </div>
  );
};

export default GameScreen;
