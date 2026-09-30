export type AlarmSoundMode = 'siren' | 'intermittent' | 'buzz' | 'chime' | 'horn' | 'custom';

export interface AudioAlarmStatus {
  isMuted: boolean;
  isAlarming: boolean;
  isMaxVolume: boolean;
  soundMode: AlarmSoundMode;
  isAcknowledged: boolean;
  customAudioName: string | null;
}

type AlarmListener = (status: AudioAlarmStatus) => void;

class AudioAlarmManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAlarming: boolean = false;
  private isMaxVolume: boolean = true;
  private isAcknowledged: boolean = false;
  private soundMode: AlarmSoundMode = 'intermittent';
  private customAudioBuffer: AudioBuffer | null = null;
  private customAudioName: string | null = null;
  private listeners: Set<AlarmListener> = new Set();

  private alarmInterval: number | null = null;
  private testTimeout: number | null = null;

  // Active continuous buzz nodes reference
  private buzzNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    osc3: OscillatorNode;
    lfo?: OscillatorNode;
    masterGain: GainNode;
  } | null = null;

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initAudioContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setAlarmState(hasCriticalMachine: boolean) {
    if (hasCriticalMachine && !this.isAlarming) {
      // New critical alarm episode -> reset acknowledgment
      this.isAcknowledged = false;
    } else if (!hasCriticalMachine) {
      this.isAcknowledged = false;
    }

    this.isAlarming = hasCriticalMachine;
    this.updateAlarmSequence();
    this.notify();
  }

  public acknowledgeAlarm() {
    this.isAcknowledged = true;
    this.stopAlarmSequence();
    this.notify();
  }

  public setSoundMode(mode: AlarmSoundMode) {
    this.soundMode = mode;
    if (this.isAlarming && !this.isMuted && !this.isAcknowledged) {
      this.updateAlarmSequence();
    } else {
      this.playTestBeep();
    }
    this.notify();
  }

  public toggleMute() {
    this.initAudioContext();
    this.isMuted = !this.isMuted;
    this.updateAlarmSequence();
    this.notify();
  }

  public toggleVolumeBoost() {
    this.isMaxVolume = !this.isMaxVolume;
    this.playTestBeep();
    this.notify();
  }

  public async loadCustomAudioFile(file: File): Promise<string> {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) throw new Error('Web Audio API not supported in this browser');

      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.customAudioBuffer = decoded;
      this.customAudioName = file.name;
      this.soundMode = 'custom';

      this.playTestBeep();
      this.notify();
      return `Loaded audio file: ${file.name}`;
    } catch (err) {
      console.error('Failed to decode custom audio file:', err);
      throw err;
    }
  }

  public playTestBeep() {
    this.initAudioContext();
    this.triggerCurrentSoundOnce();
  }

  private updateAlarmSequence() {
    if (this.isAlarming && !this.isMuted && !this.isAcknowledged) {
      this.startAlarmSequence();
    } else {
      this.stopAlarmSequence();
    }
  }

  private startAlarmSequence() {
    this.stopAlarmSequence();

    if (this.soundMode === 'buzz') {
      this.startContinuousBuzz();
      return;
    }

    // Play initial sound pulse
    this.triggerCurrentSoundOnce();

    // Repeat sound cycle based on mode
    let repeatIntervalMs = 450;
    if (this.soundMode === 'siren') {
      repeatIntervalMs = 2100;
    } else if (this.soundMode === 'intermittent') {
      repeatIntervalMs = 420;
    } else if (this.soundMode === 'chime') {
      repeatIntervalMs = 1200;
    } else if (this.soundMode === 'horn') {
      repeatIntervalMs = 900;
    } else if (this.soundMode === 'custom' && this.customAudioBuffer) {
      repeatIntervalMs = Math.max(800, Math.round(this.customAudioBuffer.duration * 1000 + 400));
    }

    this.alarmInterval = window.setInterval(() => {
      if (this.isAlarming && !this.isMuted && !this.isAcknowledged) {
        this.triggerCurrentSoundOnce();
      } else {
        this.stopAlarmSequence();
      }
    }, repeatIntervalMs);
  }

  private stopAlarmSequence() {
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.stopContinuousBuzz();
  }

  private triggerCurrentSoundOnce() {
    switch (this.soundMode) {
      case 'siren':
        this.playEscalatingSirenWail();
        break;
      case 'intermittent':
        this.playIntermittentBeepPulse();
        break;
      case 'buzz':
        this.playBuzzPulseTest();
        break;
      case 'chime':
        this.playDualToneWarningChime();
        break;
      case 'horn':
        this.playIndustrialKlaxonHorn();
        break;
      case 'custom':
        if (this.customAudioBuffer) {
          this.playCustomBuffer();
        } else {
          this.playIntermittentBeepPulse();
        }
        break;
    }
  }

  /**
   * Mode 1: Intermittent High-Pitched Warning Beep Pulse (2600Hz / 3100Hz)
   * Short, repeating high-pitched pulses for general warnings or minor machine stalls.
   */
  private playIntermittentBeepPulse() {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseGain = this.isMaxVolume ? 0.65 : 0.28;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(20, now);
      compressor.ratio.setValueAtTime(8, now);
      compressor.attack.setValueAtTime(0.002, now);
      compressor.release.setValueAtTime(0.08, now);
      compressor.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(2600, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(baseGain, now + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(compressor);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(3100, now);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(baseGain * 0.6, now + 0.008);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc2.connect(gain2);
      gain2.connect(compressor);
      osc2.start(now);
      osc2.stop(now + 0.10);
    } catch (e) {
      console.warn('Intermittent beep error:', e);
    }
  }

  /**
   * Mode 2: Escalating Emergency Siren Wail (500Hz -> 1450Hz)
   * Reserved for critical system failures or evacuations.
   */
  private playEscalatingSirenWail() {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseGain = this.isMaxVolume ? 0.7 : 0.28;
      const cycleDuration = 1.9;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, now);
      compressor.knee.setValueAtTime(15, now);
      compressor.ratio.setValueAtTime(12, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.12, now);
      compressor.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';

      osc1.frequency.setValueAtTime(500, now);
      osc1.frequency.exponentialRampToValueAtTime(1450, now + 1.1);
      osc1.frequency.exponentialRampToValueAtTime(650, now + 1.8);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(baseGain, now + 0.1);
      gain1.gain.setValueAtTime(baseGain, now + 1.65);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + cycleDuration);

      osc1.connect(gain1);
      gain1.connect(compressor);
      osc1.start(now);
      osc1.stop(now + cycleDuration);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';

      osc2.frequency.setValueAtTime(750, now);
      osc2.frequency.exponentialRampToValueAtTime(2175, now + 1.1);
      osc2.frequency.exponentialRampToValueAtTime(975, now + 1.8);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(baseGain * 0.4, now + 0.1);
      gain2.gain.setValueAtTime(baseGain * 0.4, now + 1.65);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + cycleDuration);

      osc2.connect(gain2);
      gain2.connect(compressor);
      osc2.start(now);
      osc2.stop(now + cycleDuration);
    } catch (e) {
      console.warn('Siren wail error:', e);
    }
  }

  /**
   * Mode 3: Continuous Electrical Buzz (Low/mid 120Hz/240Hz + 60Hz relay LFO)
   * Indicating stopped line or safety interlock trip.
   */
  private startContinuousBuzz() {
    const ctx = this.initAudioContext();
    if (!ctx || this.buzzNodes) return;

    try {
      const now = ctx.currentTime;
      const targetGainVal = this.isMaxVolume ? 0.48 : 0.20;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(targetGainVal, now + 0.05);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, now);
      compressor.knee.setValueAtTime(20, now);
      compressor.ratio.setValueAtTime(10, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(4, now);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(60, now);
      lfoGain.gain.setValueAtTime(0.12, now);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(120, now);
      gain1.gain.setValueAtTime(0.5, now);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(240, now);
      gain2.gain.setValueAtTime(0.4, now);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(360, now);
      gain3.gain.setValueAtTime(0.35, now);

      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      gain1.connect(filter);
      gain2.connect(filter);
      gain3.connect(filter);

      filter.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      this.buzzNodes = { osc1, osc2, osc3, lfo, masterGain };
    } catch (e) {
      console.warn('Continuous buzz start error:', e);
    }
  }

  private stopContinuousBuzz() {
    if (!this.buzzNodes || !this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const { osc1, osc2, osc3, lfo, masterGain } = this.buzzNodes;

      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc3.stop();
          lfo?.stop();
          osc1.disconnect();
          osc2.disconnect();
          osc3.disconnect();
          lfo?.disconnect();
          masterGain.disconnect();
        } catch (err) {}
      }, 60);

      this.buzzNodes = null;
    } catch (e) {
      console.warn('Continuous buzz stop error:', e);
      this.buzzNodes = null;
    }
  }

  private playBuzzPulseTest() {
    this.startContinuousBuzz();
    if (this.testTimeout) clearTimeout(this.testTimeout);
    this.testTimeout = window.setTimeout(() => {
      if (!this.isAlarming || this.isMuted || this.isAcknowledged) {
        this.stopContinuousBuzz();
      }
    }, 1500);
  }

  /**
   * Mode 4: Dual-Tone Warning Alert Chime (880Hz / 1200Hz)
   * High-clarity dual warning tone for caution & advisory states.
   */
  private playDualToneWarningChime() {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseGain = this.isMaxVolume ? 0.55 : 0.22;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);

      gain1.gain.setValueAtTime(baseGain, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(compressor);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1200, now + 0.18);

      gain2.gain.setValueAtTime(baseGain * 1.1, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc2.connect(gain2);
      gain2.connect(compressor);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.42);
    } catch (e) {
      console.warn('Warning chime error:', e);
    }
  }

  /**
   * Mode 5: Industrial Klaxon Horn (440Hz / 587Hz pulse)
   * Heavy mechanical klaxon warning pulse.
   */
  private playIndustrialKlaxonHorn() {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseGain = this.isMaxVolume ? 0.6 : 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(587, now + 0.18);
      osc.frequency.linearRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(baseGain, now + 0.05);
      gain.gain.setValueAtTime(baseGain, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Klaxon horn error:', e);
    }
  }

  /**
   * Mode 6: Custom User Audio Buffer playback
   */
  private playCustomBuffer() {
    if (!this.customAudioBuffer) return;
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const source = ctx.createBufferSource();
      source.buffer = this.customAudioBuffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.isMaxVolume ? 1.0 : 0.4, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('Custom audio playback error:', e);
    }
  }

  public subscribe(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  public getStatus(): AudioAlarmStatus {
    return {
      isMuted: this.isMuted,
      isAlarming: this.isAlarming,
      isMaxVolume: this.isMaxVolume,
      soundMode: this.soundMode,
      isAcknowledged: this.isAcknowledged,
      customAudioName: this.customAudioName,
    };
  }
}

export const audioAlarmManager = new AudioAlarmManager();
