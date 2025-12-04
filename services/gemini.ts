import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: Ensure process.env.API_KEY is available in your environment
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDartAlias = async (name: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a funny, rhyming, or cool "Dart Player Alias" for a person named "${name}". 
      Return ONLY the alias as a plain string. Examples: "Bullseye Ben", "Darting Dave", "Triple Twenty Tony".`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text?.trim() || `Darting ${name}`;
  } catch (error) {
    console.error("Alias generation failed:", error);
    return `The ${name} Thrower`;
  }
};

export const generateAvatar = async (alias: string): Promise<string> => {
  try {
    // Nano Banana Pro = gemini-3-pro-image-preview
    // Using generateContent with imageConfig for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `A cool, stylized digital art avatar for a dart player named "${alias}". 
            The style should be neon, cyber-punk pub vibe. High quality, detailed character portrait.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    // Extract image from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Avatar generation failed:", error);
    // Return a fallback placeholder if generation fails
    return `https://picsum.photos/400/400?random=${Date.now()}`;
  }
};

export const editAvatar = async (currentImageBase64: string, prompt: string): Promise<string> => {
  try {
    // Strip the data url prefix if present
    const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // Nano Banana powered edit = gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image data found");
  } catch (error) {
    console.error("Avatar editing failed:", error);
    return currentImageBase64; // Return original on failure
  }
};

export interface PlayerAnswers {
  style: string;
  spirit: string;
  vibe: string;
}

export const generateAvatarDescription = async (
  name: string,
  answers: PlayerAnswers
): Promise<string> => {
  try {
    const prompt = `Create a vivid, creative avatar description for a dart player named "${name}".

Their throwing style: ${answers.style}
Their spirit animal: ${answers.spirit}
Their dartboard vibe: ${answers.vibe}

Generate a 2-3 sentence description that combines these elements into a unique dart player persona. Make it fun, visual, and memorable. Focus on creating a character that would make a great image. Be creative and descriptive!

Example format: "A precision sniper with the sharp eyes of an eagle, bringing neon cyberpunk energy to every throw. Known for calculated moves and futuristic style."`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });

    return response.text?.trim() || `${name}, the ${answers.style} with ${answers.spirit} energy.`;
  } catch (error) {
    console.error("Description generation failed:", error);
    return `${name}, a legendary dart player with ${answers.style} style.`;
  }
};

export const generateHostSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say enthusiastically like a crazy game show host: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck sounds energetic/mischievous
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};

export interface GameContext {
  mode: string;
  currentScore: number;
  roundHistory: number[];
  playerAlias: string;
  opponentAlias?: string;
  opponentScore?: number;
  scoreDifference?: number; // Positive = Leading, Negative = Trailing
  gameStage?: 'OPENING' | 'MIDGAME' | 'ENDGAME';
}

export type GameEventType = 'ROUND_END' | 'HIGH_SCORE' | 'BAD_ROUND' | 'CHECKOUT_READY' | 'GAME_WON' | 'GAME_LOST' | 'BUST';

export const generateGameCommentary = async (
  context: GameContext,
  eventType: GameEventType,
  eventData?: string
): Promise<string> => {
  try {
    const prompt = `You are a legendary, high-energy darts commentator (like Sid Waddell). 
    Generate a SHORT, witty, enthusiastic 1-sentence commentary for this moment.
    
    Context:
    - Player: ${context.playerAlias}
    - Mode: ${context.mode}
    - Score: ${context.currentScore}
    - Opponent: ${context.opponentAlias || 'None'}
    - Lead/Deficit: ${context.scoreDifference ? (context.scoreDifference > 0 ? 'Leading by ' + context.scoreDifference : 'Trailing by ' + Math.abs(context.scoreDifference)) : 'N/A'}
    - Stage: ${context.gameStage || 'N/A'}
    - Event: ${eventType}
    - Details: ${eventData || 'None'}
    
    Style:
    - Use metaphors, be dramatic, maybe a bit roasting if it's a bad round.
    - If it's a close game (diff < 50), mention the pressure.
    - If trailing big (> 100), mention the comeback needed.
    - Keep it under 15 words so it can be spoken quickly.
    - NO hashtags, NO emojis. Just spoken text.
    
    Examples:
    - (High Score): "He's throwing arrows like they're laser beams! Magnificent!"
    - (Bad Round): "Oh dear, that's more like a knitting circle than a darts match!"
    - (Checkout): "One dart away from glory! Can he hold his nerve?"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.0, // High creativity
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Commentary generation failed:", error);
    return ""; // Fail silently, fallback to standard audio
  }
};

export const chatWithBot = async (
  history: { role: 'user' | 'model', text: string }[],
  message: string,
  gameContext?: GameContext
): Promise<string> => {
  try {
    let systemInstruction = "You are DartBot Pro, an expert Darts referee, coach, and historian. You know all rules for 501, Cricket, Shanghai, Killer, and Around the Clock. You are helpful, concise, encouraging, and use pub banter style.";

    // Add game context to system instruction
    if (gameContext) {
      const recentRounds = gameContext.roundHistory.slice(-5).join(', ') || 'none yet';
      const avgScore = gameContext.roundHistory.length > 0
        ? Math.round(gameContext.roundHistory.reduce((a, b) => a + b, 0) / gameContext.roundHistory.length)
        : 0;

      systemInstruction += `\n\nCURRENT GAME CONTEXT:
- Mode: ${gameContext.mode}
- Player: ${gameContext.playerAlias}
- Current Score: ${gameContext.currentScore}
- Recent Rounds: ${recentRounds}
- Average Score: ${avgScore}

Provide personalized advice based on this context. Be encouraging but honest. If they ask about strategy, consider their current score and game mode.`;
    }

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      config: {
        systemInstruction,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm not sure about that rule, mate.";
  } catch (error) {
    console.error("Chat failed:", error);
    return "Sorry, the pub is too loud, I didn't catch that.";
  }
}
