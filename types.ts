export interface Player {
  id: string;
  name: string;
  alias: string;
  avatarUrl: string;
  score: number;
}

export enum GameMode {
  X01 = '501 Double Out',
  CRICKET = 'Cricket',
  CLOCK = 'Around the Clock',
  KILLER = 'Killer',
  SHANGHAI = 'Shanghai',
  X01_301 = '301 Double In/Out'
}

export interface GameConfig {
  mode: GameMode;
  target?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// New dart throw tracking
export type Multiplier = 'S' | 'D' | 'T'; // Single, Double, Triple

export interface DartThrow {
  multiplier: Multiplier;
  number: number; // 1-20 or 25 (bull)
  score: number; // calculated score
  display: string; // e.g., "T20", "D16", "S5"
}

export interface Round {
  throws: DartThrow[];
  total: number;
  timestamp: number;
}

// Camera integration types
export interface CameraConfig {
  ipAddress: string;
  port?: number;
  snapshotPath?: string;
  username?: string;
  password?: string;
  enabled: boolean;
}

export interface DetectedThrow extends DartThrow {
  confidence: number;
}
