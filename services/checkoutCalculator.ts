// Smart Checkout Calculator
// Calculates optimal dart combinations to finish a game

export interface CheckoutSuggestion {
    score: number;
    path: string[];
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

// Common checkout paths (optimized for double-out)
const CHECKOUT_PATHS: { [key: number]: string[] } = {
    // Perfect finishes
    170: ['T20', 'T20', 'D25'],
    167: ['T20', 'T19', 'D25'],
    164: ['T20', 'T18', 'D25'],
    161: ['T20', 'T17', 'D25'],
    160: ['T20', 'T20', 'D20'],
    158: ['T20', 'T20', 'D19'],
    157: ['T20', 'T19', 'D20'],
    156: ['T20', 'T20', 'D18'],
    155: ['T20', 'T19', 'D19'],
    154: ['T20', 'T18', 'D20'],
    153: ['T20', 'T19', 'D18'],
    152: ['T20', 'T20', 'D16'],
    151: ['T20', 'T17', 'D20'],
    150: ['T20', 'T18', 'D18'],

    // Common checkouts
    140: ['T20', 'T20', 'D10'],
    130: ['T20', 'T18', 'D8'],
    120: ['T20', 'S20', 'D20'],
    110: ['T20', 'S18', 'D16'],
    100: ['T20', 'D20'],
    90: ['T20', 'D15'],
    80: ['T20', 'D10'],
    70: ['T18', 'D8'],
    60: ['S20', 'D20'],
    50: ['S18', 'D16'],
    40: ['D20'],
    32: ['D16'],
    24: ['D12'],
    16: ['D8'],
    8: ['D4'],
    4: ['D2'],
    2: ['D1'],
};

export const calculateCheckout = (remainingScore: number): CheckoutSuggestion | null => {
    // Can't checkout on 1 or scores > 170
    if (remainingScore === 1 || remainingScore > 170) {
        return null;
    }

    // Check if we have a predefined path
    if (CHECKOUT_PATHS[remainingScore]) {
        return {
            score: remainingScore,
            path: CHECKOUT_PATHS[remainingScore],
            description: CHECKOUT_PATHS[remainingScore].join(' → '),
            difficulty: getDifficulty(remainingScore)
        };
    }

    // Calculate a simple checkout for scores not in our table
    if (remainingScore <= 40 && remainingScore % 2 === 0) {
        const doubleTarget = remainingScore / 2;
        return {
            score: remainingScore,
            path: [`D${doubleTarget}`],
            description: `Double ${doubleTarget}`,
            difficulty: 'easy'
        };
    }

    // For odd numbers or complex scores, suggest a setup
    if (remainingScore < 170) {
        // Try to get to a known checkout
        for (let setup = 1; setup <= 60; setup++) {
            const afterSetup = remainingScore - setup;
            if (CHECKOUT_PATHS[afterSetup]) {
                return {
                    score: remainingScore,
                    path: [`S${setup}`, ...CHECKOUT_PATHS[afterSetup]],
                    description: `${setup} → ${CHECKOUT_PATHS[afterSetup].join(' → ')}`,
                    difficulty: 'medium'
                };
            }
        }
    }

    return null;
};

const getDifficulty = (score: number): 'easy' | 'medium' | 'hard' => {
    if (score <= 40) return 'easy';
    if (score <= 100) return 'medium';
    return 'hard';
};

export const getCheckoutAdvice = (remainingScore: number): string => {
    if (remainingScore === 1) {
        return "Bust! You can't checkout on 1. Aim for a setup score.";
    }

    if (remainingScore > 170) {
        return `${remainingScore} remaining. Focus on scoring high to get into checkout range.`;
    }

    const checkout = calculateCheckout(remainingScore);

    if (!checkout) {
        return `${remainingScore} remaining. Set up for a known checkout.`;
    }

    const difficultyEmoji = {
        easy: '✅',
        medium: '⚡',
        hard: '🔥'
    };

    return `${difficultyEmoji[checkout.difficulty]} Checkout available: ${checkout.description}`;
};
