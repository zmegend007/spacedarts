// Utility to base64 decode
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Utility to decode raw PCM audio data
export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const bytes = decodeBase64(base64Data);
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class AudioQueue {
  private audioContext: AudioContext;
  private isPlaying: boolean = false;
  private queue: AudioBuffer[] = [];

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  public async playBase64(base64Data: string) {
    // Resume context if suspended (browser policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const buffer = await decodeAudioData(base64Data, this.audioContext);
    this.queue.push(buffer);
    this.processQueue();
  }

  private processQueue() {
    if (this.isPlaying || this.queue.length === 0) return;

    this.isPlaying = true;
    const buffer = this.queue.shift();
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.onended = () => {
      this.isPlaying = false;
      this.processQueue();
    };
    source.start();
  }
}

export const globalAudioQueue = new AudioQueue();