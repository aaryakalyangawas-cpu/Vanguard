import { WeaponId } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playGunshot(weaponId: WeaponId, volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.32 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    if (weaponId === 'm4a1') {
      // Crisp 5.56mm NATO crack
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1850, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + 0.13);
      filter.Q.value = 0.85;
      noiseGain.gain.setValueAtTime(0.95, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);
      oscGain.gain.setValueAtTime(0.65, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      noise.start(now);
      noise.stop(now + 0.15);
      osc.start(now);
      osc.stop(now + 0.095);
    } else if (weaponId === 'ak74') {
      // Punchy 5.45mm metallic Kalashnikov bark
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1250, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.17);
      filter.Q.value = 1.0;
      noiseGain.gain.setValueAtTime(1.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(44, now + 0.11);
      oscGain.gain.setValueAtTime(0.75, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.start(now);
      noise.stop(now + 0.19);
      osc.start(now);
      osc.stop(now + 0.125);
    } else if (weaponId === 'mp5') {
      // Tight suppressed 9mm SMG report
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(520, now + 0.075);
      filter.Q.value = 1.3;
      noiseGain.gain.setValueAtTime(0.62, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.055);

      noise.start(now);
      noise.stop(now + 0.085);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (weaponId === 'm870') {
      // Heavy 12-gauge pump blast + rack clack
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.32);
      noiseGain.gain.setValueAtTime(1.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.19);
      oscGain.gain.setValueAtTime(1.0, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.start(now);
      noise.stop(now + 0.35);
      osc.start(now);
      osc.stop(now + 0.21);

      if (volumeScale > 0.5) {
        window.setTimeout(() => this.playMechanicalClick(460, 0.055), 270);
        window.setTimeout(() => this.playMechanicalClick(630, 0.055), 400);
      }
    } else if (weaponId === 'mk14') {
      // Heavy 7.62x51mm NATO DMR snap
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2100, now);
      filter.frequency.exponentialRampToValueAtTime(360, now + 0.22);
      filter.Q.value = 0.9;
      noiseGain.gain.setValueAtTime(1.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.23);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.start(now);
      noise.stop(now + 0.24);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      // M24 SWS bolt-action rifle supersonic crack + bolt cycle
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(260, now + 0.34);
      filter.Q.value = 1.1;
      noiseGain.gain.setValueAtTime(1.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
      oscGain.gain.setValueAtTime(0.88, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.start(now);
      noise.stop(now + 0.36);
      osc.start(now);
      osc.stop(now + 0.26);

      if (volumeScale > 0.5) {
        window.setTimeout(() => this.playMechanicalClick(720, 0.045), 390);
        window.setTimeout(() => this.playMechanicalClick(540, 0.045), 540);
      }
    }

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);

    osc.connect(oscGain);
    oscGain.connect(master);
  }

  public playMechanicalClick(freq = 520, dur = 0.045) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + dur);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  public playReload() {
    this.playMechanicalClick(390, 0.05);
    window.setTimeout(() => this.playMechanicalClick(680, 0.055), 320);
  }

  public playHitmarker(isHeadshot: boolean, isKill: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isHeadshot ? 'triangle' : 'sine';
    const startFreq = isHeadshot ? 1480 : 880;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 1920 : 520, now + 0.06);

    gain.gain.setValueAtTime(isHeadshot ? 0.2 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    if (isKill) {
      const killOsc = ctx.createOscillator();
      const killGain = ctx.createGain();
      killOsc.type = 'sine';
      killOsc.frequency.setValueAtTime(660, now + 0.03);
      killOsc.frequency.setValueAtTime(990, now + 0.09);
      killGain.gain.setValueAtTime(0.16, now + 0.03);
      killGain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      killOsc.connect(killGain);
      killGain.connect(ctx.destination);
      killOsc.start(now + 0.03);
      killOsc.stop(now + 0.23);
    }
  }

  public playDamageTaken() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.12);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.07);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playMatchEnd(victory: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = victory ? [523.25, 659.25, 783.99, 1046.5] : [392.0, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}

export const soundEngine = new SoundEngine();
