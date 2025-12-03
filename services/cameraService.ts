// Camera Service for IP Camera Integration
// Supports HTTP snapshot URLs and basic RTSP streams

export interface CameraConfig {
    ipAddress: string;
    port?: number;
    snapshotPath?: string; // e.g., '/snapshot.jpg' or '/cgi-bin/snapshot.cgi'
    username?: string;
    password?: string;
    enabled: boolean;
}

export interface CameraStatus {
    connected: boolean;
    lastCapture?: Date;
    error?: string;
}

const STORAGE_KEY = 'dartmaster_camera_config';

export class CameraService {
    private config: CameraConfig | null = null;
    private status: CameraStatus = { connected: false };

    constructor() {
        this.loadConfig();
    }

    // Load camera config from localStorage
    loadConfig(): CameraConfig | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.config = JSON.parse(stored);
                return this.config;
            }
        } catch (e) {
            console.error('Failed to load camera config:', e);
        }
        return null;
    }

    // Save camera config to localStorage
    saveConfig(config: CameraConfig): void {
        this.config = config;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    // Get current config
    getConfig(): CameraConfig | null {
        return this.config;
    }

    // Build snapshot URL
    getSnapshotUrl(): string | null {
        if (!this.config || !this.config.enabled) return null;

        const { ipAddress, port, snapshotPath, username, password } = this.config;
        const portStr = port ? `:${port}` : '';
        const path = snapshotPath || '/snapshot.jpg';

        // Build URL with optional auth
        let url = `http://${ipAddress}${portStr}${path}`;

        // Add basic auth if credentials provided
        if (username && password) {
            url = `http://${username}:${password}@${ipAddress}${portStr}${path}`;
        }

        return url;
    }

    // Test camera connection
    async testConnection(): Promise<boolean> {
        const url = this.getSnapshotUrl();
        if (!url) {
            this.status = { connected: false, error: 'No camera configured' };
            return false;
        }

        try {
            // Try to fetch a snapshot
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });

            if (response.ok) {
                this.status = { connected: true, lastCapture: new Date() };
                return true;
            } else {
                this.status = { connected: false, error: `HTTP ${response.status}` };
                return false;
            }
        } catch (error) {
            this.status = {
                connected: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            };
            return false;
        }
    }

    // Capture a frame from the camera
    async captureFrame(): Promise<Blob | null> {
        const url = this.getSnapshotUrl();
        if (!url) {
            throw new Error('No camera configured');
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Failed to capture: HTTP ${response.status}`);
            }

            const blob = await response.blob();
            this.status = { connected: true, lastCapture: new Date() };
            return blob;
        } catch (error) {
            this.status = {
                connected: false,
                error: error instanceof Error ? error.message : 'Capture failed'
            };
            throw error;
        }
    }

    // Convert blob to base64
    async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Get camera status
    getStatus(): CameraStatus {
        return this.status;
    }

    // Check if camera is enabled
    isEnabled(): boolean {
        return this.config?.enabled || false;
    }
}

export const cameraService = new CameraService();
