// Achievement System with AI-powered celebrations

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    celebrationMessage: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_180',
        name: 'Maximum Score!',
        description: 'Score 180 in a single round',
        icon: '🎯',
        rarity: 'legendary',
        celebrationMessage: 'MAXIMUM! 180! Three perfect triple twenties!'
    },
    {
        id: 'ton_80',
        name: 'Ton 80',
        description: 'Score exactly 180',
        icon: '💯',
        rarity: 'legendary',
        celebrationMessage: 'TON EIGHTY! Absolutely magnificent!'
    },
    {
        id: 'high_ton',
        name: 'High Ton',
        description: 'Score over 100 in a single round',
        icon: '🔥',
        rarity: 'rare',
        celebrationMessage: 'High ton! Over 100! Brilliant darts!'
    },
    {
        id: 'perfect_checkout',
        name: 'Perfect Checkout',
        description: 'Finish a game with a checkout over 100',
        icon: '👑',
        rarity: 'epic',
        celebrationMessage: 'PERFECT CHECKOUT! What a finish!'
    },
    {
        id: 'bullseye_finish',
        name: 'Bulls Eye Finish',
        description: 'Win a game with a bullseye',
        icon: '🎪',
        rarity: 'rare',
        celebrationMessage: 'BULLSEYE FINISH! Right in the heart!'
    },
    {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
        icon: '🏆',
        rarity: 'common',
        celebrationMessage: 'First win! Welcome to the winners circle!'
    },
    {
        id: 'comeback_king',
        name: 'Comeback King',
        description: 'Win after being behind by 200+ points',
        icon: '👑',
        rarity: 'epic',
        celebrationMessage: 'COMEBACK KING! What a turnaround!'
    },
    {
        id: 'hat_trick',
        name: 'Hat Trick',
        description: 'Win 3 games in a row',
        icon: '🎩',
        rarity: 'rare',
        celebrationMessage: 'Hat trick! Three wins in a row!'
    },
    {
        id: 'shanghai',
        name: 'Shanghai',
        description: 'Hit single, double, and triple of the same number',
        icon: '🌟',
        rarity: 'epic',
        celebrationMessage: 'SHANGHAI! Single, double, and triple!'
    },
    {
        id: 'nine_darter',
        name: 'Nine Darter',
        description: 'Finish a 501 game in 9 darts',
        icon: '💎',
        rarity: 'legendary',
        celebrationMessage: 'NINE DART FINISH! LEGENDARY! ABSOLUTELY LEGENDARY!'
    },
    {
        id: 'double_trouble',
        name: 'Double Trouble',
        description: 'Hit 5 doubles in a single game',
        icon: '🎲',
        rarity: 'rare',
        celebrationMessage: 'Double trouble! Five doubles in one game!'
    },
    {
        id: 'treble_master',
        name: 'Treble Master',
        description: 'Hit 10 trebles in a single game',
        icon: '⚡',
        rarity: 'epic',
        celebrationMessage: 'Treble master! Ten trebles! Incredible accuracy!'
    }
];

export interface GameStats {
    roundScores: number[];
    doublesHit: number;
    treblesHit: number;
    bullseyesHit: number;
    highestRound: number;
    gameWon: boolean;
    checkoutScore?: number;
    dartsThrown: number;
}

export const checkAchievements = (stats: GameStats, previousStats?: GameStats): Achievement[] => {
    const unlocked: Achievement[] = [];

    // Check for 180
    if (stats.roundScores.includes(180)) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'first_180');
        if (achievement) unlocked.push(achievement);
    }

    // Check for high ton (100+)
    if (stats.highestRound >= 100) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'high_ton');
        if (achievement) unlocked.push(achievement);
    }

    // Check for perfect checkout
    if (stats.gameWon && stats.checkoutScore && stats.checkoutScore >= 100) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'perfect_checkout');
        if (achievement) unlocked.push(achievement);
    }

    // Check for first win
    if (stats.gameWon && (!previousStats || !previousStats.gameWon)) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'first_win');
        if (achievement) unlocked.push(achievement);
    }

    // Check for nine darter (501 in 9 darts)
    if (stats.gameWon && stats.dartsThrown === 9) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'nine_darter');
        if (achievement) unlocked.push(achievement);
    }

    // Check for double trouble
    if (stats.doublesHit >= 5) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'double_trouble');
        if (achievement) unlocked.push(achievement);
    }

    // Check for treble master
    if (stats.treblesHit >= 10) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'treble_master');
        if (achievement) unlocked.push(achievement);
    }

    return unlocked;
};

// Local storage helpers
const STORAGE_KEY = 'dartmaster_achievements';

export const saveUnlockedAchievement = (achievementId: string): void => {
    const unlocked = getUnlockedAchievements();
    if (!unlocked.includes(achievementId)) {
        unlocked.push(achievementId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    }
};

export const getUnlockedAchievements = (): string[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const isAchievementUnlocked = (achievementId: string): boolean => {
    return getUnlockedAchievements().includes(achievementId);
};
