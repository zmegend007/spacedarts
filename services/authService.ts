import {
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    updateProfile
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Sign in anonymously for guest players
 */
export const signInAsGuest = async (): Promise<User> => {
    try {
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        throw error;
    }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error signing in:", error);
        throw error;
    }
};

/**
 * Create a new user account
 */
export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name if provided
        if (displayName && result.user) {
            await updateProfile(result.user, { displayName });
        }

        return result.user;
    } catch (error) {
        console.error("Error signing up:", error);
        throw error;
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
