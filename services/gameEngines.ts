import { GameMode, DartThrow, GameStats } from '../types';

export interface GameState {
    scores: number[]; // For X01/Cricket: Points. For Clock: Current Target Number
    targets: number[]; // Current target for each player (specific to Clock)
    message: string;
    isGameWon: boolean;
    stats: GameStats[];
}

export const CLOCK_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

export const processThrow = (
    mode: GameMode,
    currentStats: GameStats,
    dart: DartThrow,
    currentScore: number, // Current points or target depending on mode
    playerIndex: number
): {
    isValid: boolean;
    scoreValue: number;
    nextTarget?: number;
    message: string;
    isWin: boolean;
} => {

    // --- AROUND THE CLOCK LOGIC ---
    if (mode === GameMode.CLOCK) {
        const currentTarget = currentScore; // In Clock, score IS the target index or number
        // We'll treat currentScore as the INDEX in CLOCK_SEQUENCE for simplicity in state, 
        // but the UI might store the actual number. Let's store the INDEX (0-20).

        const targetNumber = CLOCK_SEQUENCE[currentScore];

        if (dart.number === targetNumber) {
            // HIT!
            const isWin = currentScore === CLOCK_SEQUENCE.length - 1;
            const nextIndex = currentScore + 1;

            return {
                isValid: true,
                scoreValue: 1, // Advance 1 step
                nextTarget: nextIndex,
                message: isWin ? "BULLSEYE! GAME WON!" : `Hit! Next target: ${CLOCK_SEQUENCE[nextIndex]}`,
                isWin
            };
        } else {
            // MISS
            return {
                isValid: false,
                scoreValue: 0,
                nextTarget: currentScore,
                message: "Miss!",
                isWin: false
            };
        }
    }

    // --- STANDARD X01 LOGIC (Fallback) ---
    return {
        isValid: true,
        scoreValue: dart.score,
        message: `${dart.score} scored`,
        isWin: false
    };
};

export const getInitialScore = (mode: GameMode): number => {
    if (mode === GameMode.CLOCK) return 0; // Start at index 0 (Number 1)
    if (mode === GameMode.X01) return 501;
    if (mode === GameMode.X01_301) return 301;
    return 0;
};

export const getTargetLabel = (mode: GameMode, score: number): string => {
    if (mode === GameMode.CLOCK) {
        const target = CLOCK_SEQUENCE[score];
        return target === 25 ? "BULL" : target.toString();
    }
    return score.toString();
};
