// Voice Recognition Service for Dart Scoring
// Supports commands like "Triple 20", "Double 16", "180", etc.

interface VoiceCommand {
    score: number;
    raw: string;
}

export class VoiceRecognitionService {
    private recognition: any;
    private isListening: boolean = false;
    private onResultCallback?: (command: VoiceCommand) => void;
    private onErrorCallback?: (error: string) => void;

    constructor() {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Voice input:', transcript);

            const command = this.parseCommand(transcript);
            if (command && this.onResultCallback) {
                this.onResultCallback(command);
            }
        };

        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
            this.isListening = false;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    private parseCommand(transcript: string): VoiceCommand | null {
        // Remove filler words
        const cleaned = transcript
            .replace(/\b(score|scored|i scored|i got)\b/gi, '')
            .trim();

        // Pattern: "triple 20" or "T20" or "treble 20"
        const tripleMatch = cleaned.match(/(?:triple|treble|t)\s*(\d+)/i);
        if (tripleMatch) {
            const num = parseInt(tripleMatch[1]);
            if (num >= 1 && num <= 20) {
                return { score: num * 3, raw: transcript };
            }
        }

        // Pattern: "double 16" or "D16"
        const doubleMatch = cleaned.match(/(?:double|d)\s*(\d+)/i);
        if (doubleMatch) {
            const num = parseInt(doubleMatch[1]);
            if (num >= 1 && num <= 20) {
                return { score: num * 2, raw: transcript };
            }
            if (num === 25) { // Double bull
                return { score: 50, raw: transcript };
            }
        }

        // Pattern: "bullseye" or "bull"
        if (cleaned.match(/\b(bullseye|bulls eye)\b/i)) {
            return { score: 50, raw: transcript };
        }
        if (cleaned.match(/\b(bull|single bull)\b/i) && !cleaned.match(/double/i)) {
            return { score: 25, raw: transcript };
        }

        // Pattern: direct numbers "180", "one hundred eighty"
        const numberWords: { [key: string]: number } = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
            'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
            'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100
        };

        // Convert words to numbers
        let numericTranscript = cleaned;
        Object.entries(numberWords).forEach(([word, value]) => {
            numericTranscript = numericTranscript.replace(new RegExp(`\\b${word}\\b`, 'gi'), value.toString());
        });

        // Try to parse as direct number
        const directNumber = parseInt(numericTranscript.replace(/\D/g, ''));
        if (!isNaN(directNumber) && directNumber >= 0 && directNumber <= 180) {
            return { score: directNumber, raw: transcript };
        }

        // Pattern: "single 5" or just "5"
        const singleMatch = cleaned.match(/(?:single\s*)?(\d+)/i);
        if (singleMatch) {
            const num = parseInt(singleMatch[1]);
            if (num >= 0 && num <= 20) {
                return { score: num, raw: transcript };
            }
        }

        return null;
    }

    public startListening(
        onResult: (command: VoiceCommand) => void,
        onError?: (error: string) => void
    ): void {
        if (!this.recognition) {
            if (onError) onError('Speech recognition not supported');
            return;
        }

        this.onResultCallback = onResult;
        this.onErrorCallback = onError;

        try {
            this.recognition.start();
            this.isListening = true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            if (onError) onError('Failed to start listening');
        }
    }

    public stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    public isActive(): boolean {
        return this.isListening;
    }

    public isSupported(): boolean {
        return !!this.recognition;
    }
}

export const voiceRecognition = new VoiceRecognitionService();
