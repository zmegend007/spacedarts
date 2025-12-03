import { DartThrow, Multiplier, Round } from '../types';

export const createDartThrow = (multiplier: Multiplier, number: number): DartThrow => {
    let score = 0;

    // Calculate score based on multiplier
    switch (multiplier) {
        case 'S':
            score = number;
            break;
        case 'D':
            score = number * 2;
            break;
        case 'T':
            score = number * 3;
            break;
    }

    // Format display string
    let display = '';
    if (number === 25) {
        display = multiplier === 'D' ? 'Bull' : 'S-Bull';
    } else {
        display = `${multiplier}${number}`;
    }

    return {
        multiplier,
        number,
        score,
        display
    };
};

export const calculateRoundTotal = (throws: DartThrow[]): number => {
    return throws.reduce((sum, dart) => sum + dart.score, 0);
};

export const createRound = (throws: DartThrow[]): Round => {
    return {
        throws,
        total: calculateRoundTotal(throws),
        timestamp: Date.now()
    };
};

// Parse voice/text input to dart throw
export const parseDartInput = (input: string): DartThrow | null => {
    const cleaned = input.toLowerCase().trim();

    // Bullseye patterns
    if (cleaned.match(/\b(bullseye|bulls eye|double bull|bull)\b/i)) {
        const isDouble = cleaned.includes('double') || cleaned === 'bull';
        return createDartThrow(isDouble ? 'D' : 'S', 25);
    }

    // Triple patterns: "triple 20", "T20", "treble 20"
    const tripleMatch = cleaned.match(/(?:triple|treble|t)\s*(\d+)/i);
    if (tripleMatch) {
        const num = parseInt(tripleMatch[1]);
        if (num >= 1 && num <= 20) {
            return createDartThrow('T', num);
        }
    }

    // Double patterns: "double 16", "D16"
    const doubleMatch = cleaned.match(/(?:double|d)\s*(\d+)/i);
    if (doubleMatch) {
        const num = parseInt(doubleMatch[1]);
        if (num >= 1 && num <= 20) {
            return createDartThrow('D', num);
        }
        if (num === 25) {
            return createDartThrow('D', 25);
        }
    }

    // Single patterns: "single 5", "S5", or just "5"
    const singleMatch = cleaned.match(/(?:single|s)?\s*(\d+)/i);
    if (singleMatch) {
        const num = parseInt(singleMatch[1]);
        if (num >= 0 && num <= 20) {
            return createDartThrow('S', num);
        }
        if (num === 25) {
            return createDartThrow('S', 25);
        }
    }

    return null;
};

// Common dart combinations for quick input
export const COMMON_TARGETS = [
    { label: 'T20', multiplier: 'T' as Multiplier, number: 20 },
    { label: 'T19', multiplier: 'T' as Multiplier, number: 19 },
    { label: 'T18', multiplier: 'T' as Multiplier, number: 18 },
    { label: 'D20', multiplier: 'D' as Multiplier, number: 20 },
    { label: 'D16', multiplier: 'D' as Multiplier, number: 16 },
    { label: 'Bull', multiplier: 'D' as Multiplier, number: 25 },
];
