export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: number[]; // -12dB to +12dB for each frequency
}

export const EQ_PRESETS: EqualizerPreset[] = [
  { id: 'flat', name: 'Flat / Default', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost', name: 'Bass Boost 💥', gains: [7, 6, 4, 1, 0, 0, 0, 0, 0, 0] },
  { id: 'vocal_boost', name: 'Vocal Booster 🎤', gains: [-2, -1, 0, 3, 6, 5, 3, 1, 0, 0] },
  { id: 'electronic', name: 'Electronic / EDM ⚡', gains: [6, 5, 2, 0, -2, 2, 4, 5, 5, 4] },
  { id: 'rock', name: 'Rock 🎸', gains: [5, 4, 2, -1, -1, 1, 3, 4, 4, 3] },
  { id: 'acoustic', name: 'Acoustic / Classical 🎻', gains: [3, 2, 0, 1, 3, 3, 4, 3, 2, 2] },
];

export class EqualizerAudioNode {
  private ctx: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isConnected: boolean = false;
  private currentElement: HTMLAudioElement | null = null;

  init(audioElement: HTMLAudioElement) {
    this.currentElement = audioElement;
    // Don't auto-connect MediaElementSource until user explicitly enables equalizer,
    // because cross-origin audio elements without CORS headers will output silence
    // when piped through Web Audio API's createMediaElementSource!
  }

  enable() {
    if (this.isConnected || !this.currentElement) return;
    try {
      // Set crossOrigin if allowed by server
      this.currentElement.crossOrigin = 'anonymous';
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.source = this.ctx.createMediaElementSource(this.currentElement);
      this.gainNode = this.ctx.createGain();

      // Create 10 band filters
      this.filters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // Connect source -> filter1 -> filter2 ... -> gainNode -> destination
      let prevNode: AudioNode = this.source;
      for (const f of this.filters) {
        prevNode.connect(f);
        prevNode = f;
      }
      prevNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.isConnected = true;
    } catch (e) {
      console.warn('Web Audio API equalizer init failed', e);
    }
  }

  setGain(bandIndex: number, gainDb: number) {
    if (this.filters[bandIndex]) {
      this.filters[bandIndex].gain.value = Math.max(-12, Math.min(12, gainDb));
    }
  }

  applyPreset(preset: EqualizerPreset) {
    preset.gains.forEach((gain, idx) => {
      this.setGain(idx, gain);
    });
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const equalizerManager = new EqualizerAudioNode();
