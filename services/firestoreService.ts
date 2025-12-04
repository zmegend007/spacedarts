import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    DocumentData,
    QueryConstraint,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Game data interface for Firestore
 */
export interface GameData {
    id?: string;
    player1Name: string;
    player2Name: string;
    player1Score: number;
    player2Score: number;
    currentPlayer: number;
    gameMode: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
    winner?: string;
}

/**
 * Player stats interface
 */
export interface PlayerStats {
    id?: string;
    userId: string;
    displayName: string;
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    highestScore: number;
    achievements: string[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

/**
 * Save a game to Firestore
 */
export const saveGame = async (gameId: string, gameData: Partial<GameData>): Promise<void> => {
    try {
        const gameRef = doc(db, "games", gameId);
        await setDoc(gameRef, {
            ...gameData,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving game:", error);
        throw error;
    }
};

/**
 * Load a game from Firestore
 */
export const loadGame = async (gameId: string): Promise<GameData | null> => {
    try {
        const gameRef = doc(db, "games", gameId);
        const gameSnap = await getDoc(gameRef);

        if (gameSnap.exists()) {
            return { id: gameSnap.id, ...gameSnap.data() } as GameData;
        }
        return null;
    } catch (error) {
        console.error("Error loading game:", error);
        throw error;
    }
};

/**
 * Create a new game
 */
export const createGame = async (gameData: Omit<GameData, 'id'>): Promise<string> => {
    try {
        const gamesRef = collection(db, "games");
        const docRef = await addDoc(gamesRef, {
            ...gameData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating game:", error);
        throw error;
    }
};

/**
 * Get recent games for a user
 */
export const getUserGames = async (userId: string, limitCount: number = 10): Promise<GameData[]> => {
    try {
        const gamesRef = collection(db, "games");
        const q = query(
            gamesRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as GameData));
    } catch (error) {
        console.error("Error getting user games:", error);
        throw error;
    }
};

/**
 * Save or update player stats
 */
export const savePlayerStats = async (userId: string, stats: PlayerStats): Promise<void> => {
    try {
        const statsRef = doc(db, "playerStats", userId);
        await setDoc(statsRef, {
            ...stats,
            userId,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving player stats:", error);
        throw error;
    }
};

/**
 * Get player stats
 */
export const getPlayerStats = async (userId: string): Promise<PlayerStats | null> => {
    try {
        const statsRef = doc(db, "playerStats", userId);
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            return { id: statsSnap.id, ...statsSnap.data() } as PlayerStats;
        }
        return null;
    } catch (error) {
        console.error("Error getting player stats:", error);
        throw error;
    }
};

/**
 * Get leaderboard (top players by wins)
 */
export const getLeaderboard = async (limitCount: number = 10): Promise<PlayerStats[]> => {
    try {
        const statsRef = collection(db, "playerStats");
        const q = query(
            statsRef,
            orderBy("gamesWon", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PlayerStats));
    } catch (error) {
        console.error("Error getting leaderboard:", error);
        throw error;
    }
};

/**
 * Delete a game
 */
export const deleteGame = async (gameId: string): Promise<void> => {
    try {
        const gameRef = doc(db, "games", gameId);
        await deleteDoc(gameRef);
    } catch (error) {
        console.error("Error deleting game:", error);
        throw error;
    }
};
