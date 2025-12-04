import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { analytics } from "./firebase";

/**
 * Log a custom event to Firebase Analytics
 */
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
    try {
        logEvent(analytics, eventName, eventParams);
    } catch (error) {
        console.error("Error logging analytics event:", error);
    }
};

/**
 * Log game start event
 */
export const logGameStart = (gameMode: string, playerCount: number) => {
    logAnalyticsEvent("game_start", {
        game_mode: gameMode,
        player_count: playerCount
    });
};

/**
 * Log game end event
 */
export const logGameEnd = (gameMode: string, winner: string, duration: number, finalScore: number) => {
    logAnalyticsEvent("game_end", {
        game_mode: gameMode,
        winner,
        duration_seconds: duration,
        final_score: finalScore
    });
};

/**
 * Log dart throw event
 */
export const logDartThrow = (score: number, multiplier: number, isDouble: boolean, isTriple: boolean) => {
    logAnalyticsEvent("dart_throw", {
        score,
        multiplier,
        is_double: isDouble,
        is_triple: isTriple
    });
};

/**
 * Log achievement unlocked event
 */
export const logAchievementUnlocked = (achievementId: string, achievementName: string) => {
    logAnalyticsEvent("achievement_unlocked", {
        achievement_id: achievementId,
        achievement_name: achievementName
    });
};

/**
 * Log camera usage event
 */
export const logCameraUsage = (action: string, success: boolean) => {
    logAnalyticsEvent("camera_usage", {
        action,
        success
    });
};

/**
 * Log AI analysis event
 */
export const logAIAnalysis = (analysisType: string, confidence: number, processingTime: number) => {
    logAnalyticsEvent("ai_analysis", {
        analysis_type: analysisType,
        confidence,
        processing_time_ms: processingTime
    });
};

/**
 * Set user ID for analytics
 */
export const setAnalyticsUserId = (userId: string) => {
    try {
        setUserId(analytics, userId);
    } catch (error) {
        console.error("Error setting analytics user ID:", error);
    }
};

/**
 * Set user properties for analytics
 */
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
    try {
        setUserProperties(analytics, properties);
    } catch (error) {
        console.error("Error setting analytics user properties:", error);
    }
};
