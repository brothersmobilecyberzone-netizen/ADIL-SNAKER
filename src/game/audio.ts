/**
 * Procedural Web Audio API Synthesizer for ADIL-SNAKER-PANEL
 * Zero external audio files, 100% offline, zero-404, instant playback
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private currentStep: number = 0;
  private activeWorldTheme: string = 'jungle';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateVolumes();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    this.updateVolumes();
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.updateVolumes();
    if (!enabled) {
      this.stopBGM();
    }
  }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 0.35 : 0, now);
    this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.12 : 0, now);
  }

  /**
   * Sound when snake eats a regular red apple
   */
  public playEat() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.08);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Sound when collecting bonus food (star, diamond, speed)
   */
  public playBonus() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  /**
   * Sound when earning coins
   */
  public playCoin() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  /**
   * Tactile button UI tap sound
   */
  public playButton() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Wall or obstacle impact crash sound
   */
  public playCrash() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Game Over dramatic sound
   */
  public playGameOver() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23]; // A4, Ab4, G4, F4
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + i * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  /**
   * Victory sound for level completion
   */
  public playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }

  /**
   * Procedural dynamic background arcade groove (zero external audio files)
   */
  public startBGM(worldTheme: string = 'jungle') {
    this.activeWorldTheme = worldTheme;
    if (!this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;

    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    const basslines: Record<string, number[]> = {
      jungle: [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81], // A2
      desert: [98, 98, 123.47, 130.81, 98, 146.83, 130.81, 123.47], // G2
      ice: [130.81, 130.81, 155.56, 174.61, 130.81, 196, 174.61, 155.56], // C3
      lava: [82.41, 82.41, 98, 110, 82.41, 123.47, 110, 98], // E2
      neon: [123.47, 123.47, 146.83, 164.81, 185, 164.81, 146.83, 123.47], // B2
    };

    const notes = basslines[worldTheme] || basslines.jungle;
    const stepDuration = 220; // ms

    this.currentStep = 0;
    this.bgmIntervalId = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const freq = notes[this.currentStep % notes.length];
      const isKickBeat = this.currentStep % 2 === 0;

      // Bass note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = worldTheme === 'neon' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.19);

      // Subtle cyber kick drum pulse on downbeats
      if (isKickBeat) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
        kickGain.gain.setValueAtTime(0.25, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.1);
      }

      this.currentStep++;
    }, stepDuration);
  }

  public stopBGM() {
    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundManager = new SoundEngine();
