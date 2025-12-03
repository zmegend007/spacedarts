// Gemini Vision Analysis for Dart Detection
import { GoogleGenAI } from "@google/genai";
import { DartThrow, Multiplier } from '../types';
import { createDartThrow } from './dartScoring';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface DetectedThrow extends DartThrow {
    confidence: number; // 0-1 confidence score
}

export interface VisionAnalysisResult {
    throws: DetectedThrow[];
    rawResponse: string;
    success: boolean;
    error?: string;
}

export const analyzeDartboard = async (imageBase64: string): Promise<VisionAnalysisResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    },
                    {
                        text: `You are a professional dart scoring assistant. Analyze this dartboard image and identify where each dart has landed.

IMPORTANT INSTRUCTIONS:
1. Look for dart shafts, flights, or dart tips in the dartboard
2. Identify the exact segment each dart is in (1-20)
3. Determine if it's in the single, double, or triple ring
4. The bullseye (center) scores 50 for double bull, 25 for single bull
5. Return ONLY a JSON array, no other text

Return format (JSON array only):
[
  {"multiplier": "T", "number": 20, "confidence": 0.95},
  {"multiplier": "D", "number": 16, "confidence": 0.88}
]

Multiplier codes:
- "S" = Single (outer ring or main segment)
- "D" = Double (outer narrow ring or double bull)
- "T" = Triple (inner narrow ring)

Number: 1-20 for regular segments, 25 for bullseye

Confidence: 0.0 to 1.0 (how certain you are about this detection)

If no darts are visible, return an empty array: []

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
                    }
                ]
            },
            config: {
                temperature: 0.1, // Low temperature for consistent results
            }
        });

        const rawResponse = response.text?.trim() || '';

        // Try to extract JSON from response
        let jsonStr = rawResponse;

        // Remove markdown code blocks if present
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        // Try to find JSON array in the response
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(jsonStr);

            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            // Convert to DetectedThrow objects
            const throws: DetectedThrow[] = parsed.map((item: any) => {
                const dartThrow = createDartThrow(
                    item.multiplier as Multiplier,
                    item.number
                );

                return {
                    ...dartThrow,
                    confidence: item.confidence || 0.5
                };
            });

            return {
                throws,
                rawResponse,
                success: true
            };
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.log('Raw response:', rawResponse);

            return {
                throws: [],
                rawResponse,
                success: false,
                error: 'Failed to parse AI response'
            };
        }
    } catch (error) {
        console.error('Vision analysis failed:', error);
        return {
            throws: [],
            rawResponse: '',
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
        };
    }
};

// Helper to validate detected throws
export const validateDetectedThrows = (throws: DetectedThrow[]): DetectedThrow[] => {
    return throws.filter(dart => {
        // Validate number range
        if (dart.number < 0 || dart.number > 25) return false;
        if (dart.number > 20 && dart.number !== 25) return false;

        // Validate multiplier
        if (!['S', 'D', 'T'].includes(dart.multiplier)) return false;

        // Bullseye can only be S or D
        if (dart.number === 25 && dart.multiplier === 'T') return false;

        // Confidence should be reasonable
        if (dart.confidence < 0.3) return false;

        return true;
    });
};
