import React, { useState } from 'react';
import { User, Wand2, RefreshCw, ChevronRight, ChevronLeft, Plus, Users, Loader2, Sparkles } from 'lucide-react';
import { generateAvatarDescription, generateAvatar, PlayerAnswers } from '../services/gemini';
import { Player } from '../types';
import { useToast } from './Toast';

interface SetupScreenProps {
  onComplete: (players: Player[]) => void;
}

type Step = 'name' | 'questions' | 'description' | 'image' | 'done';

interface Question {
  id: keyof PlayerAnswers;
  question: string;
  options: string[];
}

const DART_QUESTIONS: Question[] = [
  {
    id: 'style',
    question: "What's your dart throwing style?",
    options: [
      'Precision sniper 🎯',
      'Wild gunslinger 🤠',
      'Zen master 🧘',
      'Party animal 🎉'
    ]
  },
  {
    id: 'spirit',
    question: "Choose your dart spirit animal:",
    options: [
      'Eagle (sharp-eyed) 🦅',
      'Cheetah (lightning fast) 🐆',
      'Owl (wise strategist) 🦉',
      'Dragon (fierce competitor) 🐉'
    ]
  },
  {
    id: 'vibe',
    question: "Your dartboard vibe:",
    options: [
      'Neon cyberpunk 🌃',
      'Classic pub 🍺',
      'Mystical wizard 🔮',
      'Futuristic space 🚀'
    ]
  }
];

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { showToast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);

  // Current player state
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PlayerAnswers>({
    style: '',
    spirit: '',
    vibe: ''
  });
  const [description, setDescription] = useState('');
  const [alias, setAlias] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Loading states
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleNameNext = () => {
    if (name.trim()) {
      setStep('questions');
      setCurrentQuestionIndex(0);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const questionId = DART_QUESTIONS[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Auto-advance to next question or description
    setTimeout(() => {
      if (currentQuestionIndex < DART_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        handleGenerateDescription();
      }
    }, 300);
  };

  const handleGenerateDescription = async () => {
    setStep('description');
    setIsGeneratingDescription(true);

    try {
      const desc = await generateAvatarDescription(name, answers);
      setDescription(desc);

      // Extract a short alias from the description or use name
      const aliasMatch = desc.match(/"([^"]+)"/);
      setAlias(aliasMatch ? aliasMatch[1] : `${name} the ${answers.style.split(' ')[0]}`);
    } catch (error) {
      showToast('error', 'Failed to generate description. Please try again.');
      console.error(error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleConfirmDescription = async () => {
    setStep('image');
    setIsGeneratingImage(true);

    try {
      // Use the description to generate a better avatar
      const imagePrompt = `${description}. Digital art, character portrait, high quality, detailed.`;
      const avatar = await generateAvatar(imagePrompt);
      setAvatarUrl(avatar);
      setStep('done');
    } catch (error) {
      showToast('error', 'Failed to generate avatar. Please try again.');
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateDescription = () => {
    handleGenerateDescription();
  };

  const handleAddPlayer = () => {
    if (name && alias && avatarUrl) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name,
        alias,
        avatarUrl,
        score: 0
      };
      setPlayers([...players, newPlayer]);

      // Reset for next player
      setStep('name');
      setName('');
      setCurrentQuestionIndex(0);
      setAnswers({ style: '', spirit: '', vibe: '' });
      setDescription('');
      setAlias('');
      setAvatarUrl(null);

      showToast('success', `${alias} added to the lineup!`);
    }
  };

  const handleStartGame = () => {
    if (players.length > 0) {
      setIsStarting(true);
      setTimeout(() => onComplete(players), 500);
    } else if (name && alias && avatarUrl) {
      // Single player - add and start
      const newPlayer: Player = {
        id: Date.now().toString(),
        name,
        alias,
        avatarUrl,
        score: 0
      };
      setIsStarting(true);
      setTimeout(() => onComplete([newPlayer]), 500);
    }
  };

  const currentQuestion = DART_QUESTIONS[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-dart-dark text-white">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">

        {/* Left: Main Flow */}
        <div className="flex-1 bg-dart-panel p-8 rounded-2xl shadow-2xl border border-dart-neon/30">
          <h1 className="text-3xl font-bold text-center mb-8 text-dart-accent brand-font tracking-wider">
            {players.length === 0 ? "PLAYER 1" : `PLAYER ${players.length + 1}`}
          </h1>

          {/* Step: Name */}
          {step === 'name' && (
            <div className="space-y-6 fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">What's your name?</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dart-dark border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:border-dart-accent transition-colors"
                    placeholder="Enter your name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name) handleNameNext();
                    }}
                    autoFocus
                  />
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                </div>
              </div>

              <button
                onClick={handleNameNext}
                disabled={!name.trim()}
                className="w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition-all bg-dart-accent hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step: Questions */}
          {step === 'questions' && (
            <div className="space-y-6 fade-in">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">
                  Question {currentQuestionIndex + 1} of {DART_QUESTIONS.length}
                </div>
                <div className="flex gap-2 justify-center">
                  {DART_QUESTIONS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-12 rounded-full transition-all ${idx <= currentQuestionIndex ? 'bg-dart-accent' : 'bg-gray-700'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white text-center mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    className="w-full p-4 bg-dart-dark border-2 border-gray-700 hover:border-dart-accent rounded-lg text-left transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <span className="text-lg">{option}</span>
                  </button>
                ))}
              </div>

              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="w-full py-2 text-gray-400 hover:text-white flex items-center justify-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}
            </div>
          )}

          {/* Step: Description */}
          {step === 'description' && (
            <div className="space-y-6 fade-in">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-dart-gold mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Your Dart Persona</h2>
                <p className="text-gray-400 text-sm">AI-generated based on your answers</p>
              </div>

              {isGeneratingDescription ? (
                <div className="bg-dart-dark p-8 rounded-lg text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-dart-accent mx-auto mb-4" />
                  <p className="text-gray-400">Creating your unique persona...</p>
                </div>
              ) : (
                <>
                  <div className="bg-dart-dark p-6 rounded-lg border border-dart-gold/30">
                    <p className="text-lg text-white leading-relaxed italic">
                      "{description}"
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Your alias:</p>
                    <p className="text-xl font-bold text-dart-gold brand-font">{alias}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRegenerateDescription}
                      className="flex-1 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={handleConfirmDescription}
                      className="flex-1 py-3 bg-dart-green hover:bg-green-600 text-white rounded-lg font-bold flex items-center justify-center space-x-2 transition-all shadow-lg"
                    >
                      <Wand2 className="h-5 w-5" />
                      <span>Generate Avatar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Image Generation */}
          {step === 'image' && (
            <div className="space-y-6 fade-in">
              <div className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-dart-accent mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Generating Your Avatar</h2>
                <p className="text-gray-400">Creating your unique persona image...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && avatarUrl && (
            <div className="space-y-6 fade-in">
              <div className="text-center">
                <div className="relative group mx-auto w-64 h-64 mb-4">
                  <img
                    src={avatarUrl}
                    alt={alias}
                    className="w-full h-full object-cover rounded-xl shadow-2xl ring-4 ring-dart-accent"
                  />
                </div>

                <h2 className="text-2xl font-bold text-dart-gold brand-font mb-2">{alias}</h2>
                <p className="text-gray-400 text-sm italic">"{description}"</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('description');
                    setAvatarUrl(null);
                  }}
                  className="flex-1 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg font-semibold transition-all"
                >
                  Start Over
                </button>

                <button
                  onClick={handleAddPlayer}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center space-x-2 transition-all shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Player</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Player List & Start */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-dart-panel p-6 rounded-2xl border border-gray-700 flex-1">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-dart-gold" />
              The Lounge ({players.length})
            </h3>

            <div className="space-y-3">
              {players.map((p, idx) => (
                <div key={p.id} className="bg-gray-800 p-3 rounded-lg flex items-center gap-3 border border-gray-700 slide-in">
                  <img src={p.avatarUrl} alt={p.alias} className="w-12 h-12 rounded-full border-2 border-dart-accent" />
                  <div>
                    <div className="font-bold text-white text-sm">{p.alias}</div>
                    <div className="text-xs text-gray-400">Player {idx + 1}</div>
                  </div>
                </div>
              ))}

              {players.length === 0 && (
                <div className="text-center text-gray-500 py-8 italic">
                  No players in the lounge yet.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={(players.length === 0 && step !== 'done') || isStarting}
            className="w-full py-4 bg-dart-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xl shadow-lg shadow-green-900/50 flex items-center justify-center space-x-2 transition-all"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Entering Lounge...</span>
              </>
            ) : (
              <>
                <span>Enter the Lounge</span>
                <ChevronRight className="h-6 w-6" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SetupScreen;
