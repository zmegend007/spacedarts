// Autodarts WebSocket Integration Service
import { DartThrow } from '../types';
import { createDartThrow } from './dartScoring';

interface AutodartsConfig {
    boardId: string;
    username: string;
    password: string;
}

interface AutodartsEvent {
    event: string;
    data?: any;
}

interface DartThrowData {
    segment: number;
    multiplier: number;
    score: number;
}

class AutodartsConnection {
    private ws: WebSocket | null = null;
    private config: AutodartsConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private eventHandlers: Map<string, (data: any) => void> = new Map();

    connect(config: AutodartsConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            this.config = config;

            // Autodarts WebSocket URL (adjust based on actual API)
            // This is a placeholder - actual URL needs to be confirmed
            const wsUrl = `wss://autodarts.io/ws/board/${config.boardId}`;

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ Connected to Autodarts');
                    this.reconnectAttempts = 0;

                    // Authenticate (if required by Autodarts API)
                    this.sendMessage({
                        event: 'auth',
                        data: {
                            username: config.username,
                            password: config.password,
                            boardId: config.boardId
                        }
                    });

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: AutodartsEvent = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse Autodarts message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ Autodarts WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('🔌 Disconnected from Autodarts');
                    this.attemptReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleMessage(message: AutodartsEvent) {
        const handler = this.eventHandlers.get(message.event);
        if (handler) {
            handler(message.data);
        }
    }

    on(event: string, handler: (data: any) => void) {
        this.eventHandlers.set(event, handler);
    }

    off(event: string) {
        this.eventHandlers.delete(event);
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.config) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

            console.log(`🔄 Reconnecting to Autodarts... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            this.reconnectTimeout = setTimeout(() => {
                this.connect(this.config!);
            }, delay);
        }
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.eventHandlers.clear();
        this.config = null;
    }

    private sendMessage(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
const connection = new AutodartsConnection();

export const autodartsService = {
    /**
     * Connect to Autodarts WebSocket
     */
    async connect(config: AutodartsConfig): Promise<void> {
        return connection.connect(config);
    },

    /**
     * Disconnect from Autodarts
     */
    disconnect(): void {
        connection.disconnect();
    },

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return connection.isConnected();
    },

    /**
     * Listen for dart throw events
     */
    onDartThrow(callback: (dart: DartThrow) => void): void {
        connection.on('dart_throw', (data: DartThrowData) => {
            // Convert Autodarts format to our DartThrow format
            const multiplierMap: { [key: number]: 'S' | 'D' | 'T' } = {
                1: 'S',
                2: 'D',
                3: 'T'
            };

            const dart = createDartThrow(
                multiplierMap[data.multiplier] || 'S',
                data.segment
            );

            callback(dart);
        });
    },

    /**
     * Listen for game start events
     */
    onGameStart(callback: (data: any) => void): void {
        connection.on('game_start', callback);
    },

    /**
     * Listen for game end events
     */
    onGameEnd(callback: (data: any) => void): void {
        connection.on('game_end', callback);
    },

    /**
     * Listen for turn change events
     */
    onTurnChange(callback: (data: any) => void): void {
        connection.on('turn_change', callback);
    },

    /**
     * Remove event listener
     */
    off(event: string): void {
        connection.off(event);
    }
};

// Save/load config from localStorage
const STORAGE_KEY = 'autodarts_config';

export const autodartsConfig = {
    save(config: AutodartsConfig): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    },

    load(): AutodartsConfig | null {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    clear(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
};
