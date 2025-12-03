import React, { useState, useEffect } from 'react';
import { Player, GameMode, DartThrow, Round, Multiplier, DetectedThrow } from '../types';
import { Mic, MicOff, ArrowLeft, Lightbulb, Award, Target, Trash2, Camera, Settings, Loader } from 'lucide-react';
import { generateHostSpeech, GameContext } from '../services/gemini';
import { globalAudioQueue } from '../services/audioUtils';
import { voiceRecognition } from '../services/voiceRecognition';
import { calculateCheckout } from '../services/checkoutCalculator';
import { checkAchievements, saveUnlockedAchievement, GameStats } from '../services/achievements';
import { createDartThrow, createRound, COMMON_TARGETS, parseDartInput } from '../services/dartScoring';
import { cameraService } from '../services/cameraService';
import { analyzeDartboard, validateDetectedThrows } from '../services/visionAnalysis';
import ChatAssistant from './ChatAssistant';
import CameraSettings from './CameraSettings';

interface GameScreenProps {
  mode: GameMode;
  player: Player;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ mode, player, onExit }) => {
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentThrows, setCurrentThrows] = useState<DartThrow[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>('S');
  const [gameStats, setGameStats] = useState<GameStats>({
    roundScores: [],
    doublesHit: 0,
    treblesHit: 0,
    bullseyesHit: 0,
    highestRound: 0,
    gameWon: false,
    dartsThrown: 0
  });

  // Camera state
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedThrows, setDetectedThrows] = useState<DetectedThrow[]>([]);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);

  // Check if camera is enabled on mount
  useEffect(() => {
    setCameraEnabled(cameraService.isEnabled());
  }, []);

  // Initial Score logic based on mode
  useEffect(() => {
    let start = 0;
    if (mode === GameMode.X01) start = 501;
    if (mode === GameMode.X01_301) start = 301;
    if (mode === GameMode.CRICKET) start = 0;
    setCurrentScore(start);

    playVoice(`Welcome to ${mode}. ${player.alias}, step up to the oche!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, player.alias]);

  const playVoice = async (text: string) => {
    try {
      const audioBase64 = await generateHostSpeech(text);
      if (audioBase64) {
        await globalAudioQueue.playBase64(audioBase64);
      }
    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  const handleVoiceToggle = () => {
    if (!voiceRecognition.isSupported()) {
      alert('Voice recognition is not supported in your browser. Try Chrome or Edge.');
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

  const handleCaptureAndAnalyze = async () => {
    if (!cameraEnabled) {
      alert('Camera not enabled. Please configure in settings.');
      return;
    }

    setCapturing(true);
    setDetectedThrows([]);
    setLastCaptureUrl(null);

    try {
      // Capture frame from camera
      const blob = await cameraService.captureFrame();
      if (!blob) {
        throw new Error('Failed to capture frame');
      }

      // Create preview URL
      const url = URL.createObjectURL(blob);
      setLastCaptureUrl(url);

      setCapturing(false);
      setAnalyzing(true);

      // Convert to base64 and analyze
      const base64 = await cameraService.blobToBase64(blob);
      const result = await analyzeDartboard(base64);

      setAnalyzing(false);

      if (!result.success) {
        alert(`Analysis failed: ${result.error || 'Unknown error'}`);
        return;
      }

      // Validate and set detected throws
      const validThrows = validateDetectedThrows(result.throws);
      setDetectedThrows(validThrows);

      if (validThrows.length === 0) {
        playVoice('No darts detected. Try again or enter manually.');
      } else {
        playVoice(`Detected ${validThrows.length} dart${validThrows.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Capture/analysis error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Capture failed'}`);
      setCapturing(false);
      setAnalyzing(false);
    }
  };

  const acceptDetectedThrows = () => {
    detectedThrows.forEach(dart => {
      addDartThrow(dart);
    });
    setDetectedThrows([]);
    setLastCaptureUrl(null);
  };

  const rejectDetectedThrows = () => {
    setDetectedThrows([]);
    setLastCaptureUrl(null);
  };

  const addDartThrow = (dartThrow: DartThrow) => {
    const newThrows = [...currentThrows, dartThrow];
    setCurrentThrows(newThrows);

    // Auto-complete round after 3 darts
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

    if (mode === GameMode.X01 || mode === GameMode.X01_301) {
      if (currentScore - roundTotal < 0 || currentScore - roundTotal === 1) {
        message = `Bust! You scored ${roundTotal} but needed ${currentScore}.`;
        // Don't update score on bust
      } else {
        newScore = currentScore - roundTotal;
        message = `${roundTotal} scored! ${newScore} remaining.`;
        if (roundTotal > 100) message = `Wow! A massive ${roundTotal}! ${newScore} left.`;
        if (newScore === 0) {
          message = `Game Shot! ${player.alias} wins the leg!`;
          isGameWon = true;
        }
        setCurrentScore(newScore);
      }
    } else {
      newScore = currentScore + roundTotal;
      message = `${roundTotal} points. Total is ${newScore}.`;
      setCurrentScore(newScore);
    }

    // Update stats
    const doublesInRound = throws.filter(t => t.multiplier === 'D').length;
    const treblesInRound = throws.filter(t => t.multiplier === 'T').length;
    const bullsInRound = throws.filter(t => t.number === 25).length;

    const allRoundScores = [...rounds.map(r => r.total), roundTotal];
    const newStats: GameStats = {
      roundScores: allRoundScores,
      doublesHit: gameStats.doublesHit + doublesInRound,
      treblesHit: gameStats.treblesHit + treblesInRound,
      bullseyesHit: gameStats.bullseyesHit + bullsInRound,
      highestRound: Math.max(gameStats.highestRound, roundTotal),
      gameWon: isGameWon,
      checkoutScore: isGameWon ? roundTotal : undefined,
      dartsThrown: gameStats.dartsThrown + throws.length
    };

    // Check achievements
    const unlockedAchievements = checkAchievements(newStats, gameStats);
    if (unlockedAchievements.length > 0) {
      const achievement = unlockedAchievements[0];
      saveUnlockedAchievement(achievement.id);
      setShowAchievement(achievement.celebrationMessage);
      playVoice(achievement.celebrationMessage);
      setTimeout(() => setShowAchievement(null), 5000);
    }

    setGameStats(newStats);
    setRounds([...rounds, round]);
    setCurrentThrows([]);
    playVoice(message);
  };

  const undoLastThrow = () => {
    if (currentThrows.length > 0) {
      setCurrentThrows(currentThrows.slice(0, -1));
    }
  };

  const getCurrentRoundTotal = () => {
    return currentThrows.reduce((sum, dart) => sum + dart.score, 0);
  };

  // Get checkout suggestion
  const checkout = (mode === GameMode.X01 || mode === GameMode.X01_301) && currentScore <= 170
    ? calculateCheckout(currentScore)
    : null;

  // Game context for chat
  const gameContext: GameContext = {
    mode: mode,
    currentScore: currentScore,
    roundHistory: rounds.map(r => r.total),
    playerAlias: player.alias
  };

  return (
    <div className="min-h-screen bg-dart-dark flex flex-col">
      {/* Header */}
      <div className="bg-dart-panel p-4 flex justify-between items-center shadow-md">
        <button onClick={onExit} className="text-gray-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="h-5 w-5" />
          <span>Exit Game</span>
        </button>
        <div className="flex items-center space-x-3">
          {cameraEnabled && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Camera Active</span>
            </div>
          )}
          <button
            onClick={() => setShowCameraSettings(true)}
            className="text-gray-400 hover:text-white"
            title="Camera Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <img src={player.avatarUrl} alt={player.alias} className="w-10 h-10 rounded-full border border-dart-accent" />
          <span className="font-bold text-white hidden sm:inline">{player.alias}</span>
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
        {/* Left: Score Display & Checkout */}
        <div className="flex flex-col items-center justify-center lg:w-1/3">
          <h2 className="text-dart-gold uppercase tracking-widest text-sm mb-2">{mode}</h2>
          <div className="bg-dart-panel p-8 rounded-3xl border-4 border-dart-neon shadow-[0_0_20px_rgba(15,52,96,0.5)] min-w-[250px] text-center mb-4">
            <h1 className="text-7xl font-bold text-white brand-font tabular-nums">
              {currentScore}
            </h1>
          </div>

          {/* Checkout Suggestion */}
          {checkout && (
            <div className="bg-green-900/50 border-2 border-green-500 rounded-lg px-4 py-2 mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-green-400" />
              <span className="text-green-200 font-semibold">{checkout.description}</span>
            </div>
          )}

          {/* Current Round Progress */}
          <div className="bg-dart-panel p-4 rounded-lg w-full max-w-sm">
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

          {/* Camera Capture Panel */}
          {cameraEnabled && (
            <div className="bg-dart-panel p-4 rounded-lg w-full max-w-sm mt-4">
              <h3 className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                AI Dart Detection
              </h3>

              <button
                onClick={handleCaptureAndAnalyze}
                disabled={capturing || analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-3"
              >
                {capturing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Capturing...
                  </>
                ) : analyzing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    Capture & Analyze
                  </>
                )}
              </button>

              {/* Detected Throws */}
              {detectedThrows.length > 0 && (
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-green-400 text-sm font-semibold mb-2">
                    Detected {detectedThrows.length} dart{detectedThrows.length > 1 ? 's' : ''}:
                  </div>
                  <div className="flex gap-2 mb-3">
                    {detectedThrows.map((dart, idx) => (
                      <div key={idx} className="bg-gray-700 px-3 py-2 rounded">
                        <div className="text-white font-bold">{dart.display}</div>
                        <div className="text-gray-400 text-xs">
                          {Math.round(dart.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptDetectedThrows}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={rejectDetectedThrows}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            {[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="bg-dart-panel hover:bg-gray-700 text-white font-bold py-3 rounded-lg border-b-4 border-gray-900 active:border-b-0 active:translate-y-1"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Special Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <button
              onClick={() => handleNumberClick(25)}
              className="bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-600 text-white font-bold py-3 rounded-lg"
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
            Round History
          </h3>
          <div className="space-y-2">
            {rounds.slice().reverse().map((round, idx) => (
              <div key={rounds.length - idx} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs">Round {rounds.length - idx}</span>
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
            {rounds.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                No rounds yet. Start throwing!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat with Game Context */}
      <ChatAssistant gameContext={gameContext} />

      {/* Camera Settings Modal */}
      {showCameraSettings && (
        <CameraSettings onClose={() => {
          setShowCameraSettings(false);
          setCameraEnabled(cameraService.isEnabled());
        }} />
      )}
    </div>
  );
};

export default GameScreen;
