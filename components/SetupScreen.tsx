import React, { useState } from 'react';
import { User, Wand2, RefreshCw, ChevronRight, Edit2, Loader2 } from 'lucide-react';
import { generateDartAlias, generateAvatar, editAvatar } from '../services/gemini';
import { Player } from '../types';

interface SetupScreenProps {
  onComplete: (player: Player) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);

  const handleGenerateIdentity = async () => {
    if (!name) return;
    setIsGenerating(true);
    try {
      const newAlias = await generateDartAlias(name);
      setAlias(newAlias);
      const newAvatar = await generateAvatar(newAlias);
      setAvatarUrl(newAvatar);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAvatar = async () => {
    if (!avatarUrl || !editPrompt) return;
    setIsProcessingEdit(true);
    try {
      const newAvatar = await editAvatar(avatarUrl, editPrompt);
      setAvatarUrl(newAvatar);
      setIsEditing(false);
      setEditPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingEdit(false);
    }
  }

  const handleStart = () => {
    if (name && alias && avatarUrl) {
      onComplete({
        id: Date.now().toString(),
        name,
        alias,
        avatarUrl,
        score: 0
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-dart-dark text-white">
      <div className="w-full max-w-md bg-dart-panel p-8 rounded-2xl shadow-2xl border border-dart-neon/30">
        <h1 className="text-3xl font-bold text-center mb-8 text-dart-accent brand-font tracking-wider">
          JOIN THE CLUB
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Real Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dart-dark border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:border-dart-accent transition-colors"
                placeholder="John Doe"
              />
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          {!alias && (
            <button
              onClick={handleGenerateIdentity}
              disabled={!name || isGenerating}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
                !name ? 'bg-gray-700 cursor-not-allowed' : 'bg-dart-accent hover:bg-red-600 shadow-lg shadow-red-900/50'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Consulting the Spirits...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  <span>Generate Persona</span>
                </>
              )}
            </button>
          )}

          {alias && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center p-4 bg-dart-dark/50 rounded-lg border border-dart-gold/30">
                <p className="text-sm text-gray-400">Your Dart Alias</p>
                <h2 className="text-2xl font-bold text-dart-gold brand-font">{alias}</h2>
              </div>

              <div className="relative group mx-auto w-64 h-64">
                {avatarUrl ? (
                  <>
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-xl shadow-2xl ring-2 ring-dart-accent"
                    />
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="absolute bottom-2 right-2 bg-dart-dark/80 p-2 rounded-full hover:bg-dart-accent transition-colors"
                        title="Edit Avatar"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl">
                      <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                   </div>
                )}
              </div>

              {isEditing && (
                 <div className="bg-dart-dark p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs text-gray-400 mb-2">Describe changes (e.g., "add sunglasses", "make it retro")</label>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-dart-accent outline-none"
                            placeholder="Add a neon halo..."
                        />
                        <button 
                            onClick={handleEditAvatar}
                            disabled={!editPrompt || isProcessingEdit}
                            className="bg-dart-green hover:bg-green-600 px-3 py-2 rounded text-white disabled:opacity-50"
                        >
                            {isProcessingEdit ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4" />}
                        </button>
                    </div>
                 </div>
              )}

              <button
                onClick={handleGenerateIdentity}
                className="w-full py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate Identity</span>
              </button>

              <button
                onClick={handleStart}
                className="w-full py-4 bg-dart-green hover:bg-green-600 text-white rounded-lg font-bold text-xl shadow-lg shadow-green-900/50 flex items-center justify-center space-x-2 animate-pulse-slow"
              >
                <span>Enter the Arena</span>
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
