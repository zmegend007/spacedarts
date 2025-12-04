import React, { useState, useEffect } from 'react';
import { X, Wifi, WifiOff, Loader } from 'lucide-react';
import { autodartsService, autodartsConfig } from '../services/autodartsService';

interface AutodartsSettingsProps {
    onClose: () => void;
}

const AutodartsSettings: React.FC<AutodartsSettingsProps> = ({ onClose }) => {
    const [boardId, setBoardId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load saved config
        const saved = autodartsConfig.load();
        if (saved) {
            setBoardId(saved.boardId);
            setUsername(saved.username);
            setPassword(saved.password);
        }

        // Check if already connected
        setIsConnected(autodartsService.isConnected());
    }, []);

    const handleConnect = async () => {
        setError(null);
        setIsConnecting(true);

        try {
            const config = { boardId, username, password };
            await autodartsService.connect(config);

            // Save config
            autodartsConfig.save(config);

            setIsConnected(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        autodartsService.disconnect();
        setIsConnected(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="card max-w-md w-full p-6 border-neon-cyan glow">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-neon-cyan">Autodarts Connection</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Connection Status */}
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${isConnected ? 'bg-green-900/30 border-neon-green' :
                    'bg-gray-800/50 border-gray-600'
                    }`}>
                    {isConnected ? (
                        <>
                            <Wifi className="h-5 w-5 text-neon-green animate-pulse" />
                            <span className="text-neon-green font-semibold">Connected to Autodarts</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-400">Not Connected</span>
                        </>
                    )}
                </div>

                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-900/20 border border-neon-cyan/30 rounded-lg">
                    <h3 className="text-neon-cyan font-semibold mb-2">Setup Instructions:</h3>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Install Autodarts Desktop app</li>
                        <li>Sign up at <a href="https://play.autodarts.io" target="_blank" rel="noopener noreferrer" className="text-neon-cyan underline hover:text-white">play.autodarts.io</a></li>
                        <li>Register your board to get Board ID</li>
                        <li>Enter credentials below</li>
                    </ol>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-neon-purple text-sm mb-2 font-bold">Board ID</label>
                        <input
                            type="text"
                            value={boardId}
                            onChange={(e) => setBoardId(e.target.value)}
                            placeholder="e.g., ABC123XYZ"
                            className="w-full bg-black/40 border border-neon-purple/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(188,19,254,0.5)] transition-all"
                            disabled={isConnected}
                        />
                    </div>

                    <div>
                        <label className="block text-neon-purple text-sm mb-2 font-bold">Autodarts Username/Email</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-black/40 border border-neon-purple/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(188,19,254,0.5)] transition-all"
                            disabled={isConnected}
                        />
                    </div>

                    <div>
                        <label className="block text-neon-purple text-sm mb-2 font-bold">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-black/40 border border-neon-purple/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(188,19,254,0.5)] transition-all"
                            disabled={isConnected}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {isConnected ? (
                        <button
                            onClick={handleDisconnect}
                            className="flex-1 bg-red-600/80 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || !boardId || !username || !password}
                            className="flex-1 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,243,255,0.6)]"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect to Autodarts'
                            )}
                        </button>
                    )}
                </div>

                {/* Help Link */}
                <div className="mt-4 text-center">
                    <a
                        href="https://autodarts.io/downloads"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neon-cyan/70 hover:text-neon-cyan hover:underline transition-colors"
                    >
                        Download Autodarts Desktop →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AutodartsSettings;
