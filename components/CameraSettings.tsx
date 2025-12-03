import React, { useState, useEffect } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { cameraService, CameraConfig } from '../services/cameraService';

interface CameraSettingsProps {
    onClose: () => void;
}

const CameraSettings: React.FC<CameraSettingsProps> = ({ onClose }) => {
    const [config, setConfig] = useState<CameraConfig>({
        ipAddress: '',
        port: 8080,
        snapshotPath: '/snapshot.jpg',
        username: '',
        password: '',
        enabled: false
    });
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        const saved = cameraService.getConfig();
        if (saved) {
            setConfig(saved);
        }
    }, []);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        // Save config first
        cameraService.saveConfig(config);

        const success = await cameraService.testConnection();
        const status = cameraService.getStatus();

        setTestResult({
            success,
            message: success ? 'Camera connected successfully!' : status.error || 'Connection failed'
        });
        setTesting(false);
    };

    const handleSave = () => {
        cameraService.saveConfig(config);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dart-panel rounded-xl max-w-md w-full p-6 border border-gray-600">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Camera className="h-6 w-6 text-dart-accent" />
                        <h2 className="text-xl font-bold text-white">Camera Settings</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Enable Camera */}
                    <div className="flex items-center justify-between">
                        <label className="text-gray-300">Enable Camera</label>
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-5 h-5"
                        />
                    </div>

                    {/* IP Address */}
                    <div>
                        <label className="text-gray-300 text-sm block mb-1">IP Address</label>
                        <input
                            type="text"
                            value={config.ipAddress}
                            onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })}
                            placeholder="192.168.1.100"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                    </div>

                    {/* Port */}
                    <div>
                        <label className="text-gray-300 text-sm block mb-1">Port (optional)</label>
                        <input
                            type="number"
                            value={config.port || ''}
                            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || undefined })}
                            placeholder="8080"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                    </div>

                    {/* Snapshot Path */}
                    <div>
                        <label className="text-gray-300 text-sm block mb-1">Snapshot Path</label>
                        <input
                            type="text"
                            value={config.snapshotPath || ''}
                            onChange={(e) => setConfig({ ...config, snapshotPath: e.target.value })}
                            placeholder="/snapshot.jpg"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Common: /snapshot.jpg, /cgi-bin/snapshot.cgi, /image.jpg
                        </p>
                    </div>

                    {/* Username (optional) */}
                    <div>
                        <label className="text-gray-300 text-sm block mb-1">Username (optional)</label>
                        <input
                            type="text"
                            value={config.username || ''}
                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            placeholder="admin"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                    </div>

                    {/* Password (optional) */}
                    <div>
                        <label className="text-gray-300 text-sm block mb-1">Password (optional)</label>
                        <input
                            type="password"
                            value={config.password || ''}
                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-3 rounded flex items-center gap-2 ${testResult.success ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'
                            }`}>
                            {testResult.success ? (
                                <Check className="h-5 w-5 text-green-400" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            )}
                            <span className={testResult.success ? 'text-green-200' : 'text-red-200'}>
                                {testResult.message}
                            </span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleTest}
                            disabled={testing || !config.ipAddress}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-semibold"
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-dart-green hover:bg-green-600 text-white py-2 rounded font-semibold"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraSettings;
