import { WeaponId } from './types';
import { WEAPONS } from './weapons';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;

  // Vehicle engine continuous drone nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Attack helicopter twin-turbine + main rotor blade chop nodes
  private heliTurbineOsc: OscillatorNode | null = null;
  private heliChopOsc: OscillatorNode | null = null;
  private heliLfoOsc: OscillatorNode | null = null;
  private heliLfoGain: GainNode | null = null;
  private heliFilter: BiquadFilterNode | null = null;
  private heliGain: GainNode | null = null;

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.ctx) {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      if (this.heliGain) {
        this.heliGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
    }
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
    const length = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public updateVehicleEngine(active: boolean, speedRatio: number, isHeavy: boolean) {
    const ctx = this.ctx;
    if (this.muted || !active) {
      if (this.engineGain && ctx) {
        this.engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      }
      return;
    }
    const readyCtx = this.ensureContext();
    if (!readyCtx) return;

    if (!this.engineOsc || !this.engineSubOsc || !this.engineGain || !this.engineFilter) {
      const osc = readyCtx.createOscillator();
      const sub = readyCtx.createOscillator();
      const filter = readyCtx.createBiquadFilter();
      const gain = readyCtx.createGain();

      osc.type = 'sawtooth';
      sub.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      gain.gain.value = 0;

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(readyCtx.destination);
      osc.start();
      sub.start();

      this.engineOsc = osc;
      this.engineSubOsc = sub;
      this.engineFilter = filter;
      this.engineGain = gain;
    }

    const now = readyCtx.currentTime;
    const clamped = Math.max(0, Math.min(1, speedRatio));
    const baseFreq = isHeavy ? 38 : 54;
    const targetFreq = baseFreq + clamped * (isHeavy ? 42 : 68);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(140 + clamped * 260, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.032 + clamped * 0.045, now, 0.08);
  }

  public playGunshot(weaponId: WeaponId | 'mg30' | 'hmg' | 'autocannon' | 'field_gun' | 'tow', volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    if (weaponId === 'field_gun') {
      this.playFieldGunFire(volumeScale);
      return;
    }
    if (weaponId === 'autocannon') {
      this.playAutocannonFire(volumeScale);
      return;
    }
    if (weaponId === 'tow') {
      this.playRocketOrMissileLaunch(true, volumeScale);
      return;
    }
    if (weaponId === 'mg30') {
      this.playLightMg30Fire(volumeScale);
      return;
    }
    if (weaponId === 'hmg') {
      this.playHeavyMgFire(volumeScale);
      return;
    }

    const spec = WEAPONS[weaponId];
    if (!spec) {
      this.playHeavyMgFire(volumeScale);
      return;
    }

    if (spec.category === 'launcher') {
      this.playRocketOrMissileLaunch(spec.guidance !== 'none', volumeScale);
      return;
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    const vol = (spec.suppressed ? 0.2 : 0.34) * volumeScale;
    master.gain.setValueAtTime(vol, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    if (spec.suppressed) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(980, now);
      filter.frequency.exponentialRampToValueAtTime(360, now + 0.07);
      filter.Q.value = 1.4;
      noiseGain.gain.setValueAtTime(0.55, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.008, now + 0.08);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(68, now + 0.055);
      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.008, now + 0.06);

      noise.start(now);
      noise.stop(now + 0.09);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (spec.category === 'shotgun') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(190, now + 0.32);
      noiseGain.gain.setValueAtTime(1.38, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      oscGain.gain.setValueAtTime(1.05, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.21);

      noise.start(now);
      noise.stop(now + 0.35);
      osc.start(now);
      osc.stop(now + 0.22);

      if (spec.fireMode === 'PUMP' && volumeScale > 0.5) {
        window.setTimeout(() => this.playMechanicalClick(450, 0.05), 250);
        window.setTimeout(() => this.playMechanicalClick(630, 0.05), 380);
      }
    } else if (spec.category === 'sniper') {
      const heavy50 = spec.damage >= 100;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(heavy50 ? 2900 : 2500, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + (heavy50 ? 0.44 : 0.34));
      filter.Q.value = 1.05;
      noiseGain.gain.setValueAtTime(heavy50 ? 1.5 : 1.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + (heavy50 ? 0.46 : 0.35));

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(heavy50 ? 240 : 300, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + (heavy50 ? 0.3 : 0.22));
      oscGain.gain.setValueAtTime(heavy50 ? 1.05 : 0.85, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + (heavy50 ? 0.32 : 0.24));

      noise.start(now);
      noise.stop(now + 0.48);
      osc.start(now);
      osc.stop(now + 0.33);

      if (spec.fireMode === 'BOLT' && volumeScale > 0.5) {
        window.setTimeout(() => this.playMechanicalClick(720, 0.045), 390);
        window.setTimeout(() => this.playMechanicalClick(540, 0.045), 540);
      }
    } else if (spec.category === 'dmr' || spec.category === 'lmg') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(spec.category === 'dmr' ? 2150 : 1650, now);
      filter.frequency.exponentialRampToValueAtTime(340, now + 0.2);
      filter.Q.value = 0.9;
      noiseGain.gain.setValueAtTime(1.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.21);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(spec.category === 'dmr' ? 185 : 155, now);
      osc.frequency.exponentialRampToValueAtTime(46, now + 0.13);
      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      noise.start(now);
      noise.stop(now + 0.22);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (spec.category === 'smg' || spec.category === 'pistol') {
      const mag = spec.damage >= 45;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(mag ? 2000 : 1450, now);
      filter.frequency.exponentialRampToValueAtTime(440, now + (mag ? 0.18 : 0.095));
      filter.Q.value = 1.05;
      noiseGain.gain.setValueAtTime(mag ? 1.15 : 0.78, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + (mag ? 0.19 : 0.1));

      osc.type = mag ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(mag ? 190 : 210, now);
      osc.frequency.exponentialRampToValueAtTime(mag ? 45 : 75, now + (mag ? 0.12 : 0.065));
      oscGain.gain.setValueAtTime(mag ? 0.85 : 0.52, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + (mag ? 0.13 : 0.07));

      noise.start(now);
      noise.stop(now + 0.2);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      // Assault rifles (5.56 vs 7.62)
      const heavy762 = spec.damage >= 29;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(heavy762 ? 1320 : 1850, now);
      filter.frequency.exponentialRampToValueAtTime(heavy762 ? 310 : 460, now + (heavy762 ? 0.17 : 0.13));
      filter.Q.value = 0.9;
      noiseGain.gain.setValueAtTime(heavy762 ? 1.12 : 0.96, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + (heavy762 ? 0.18 : 0.14));

      osc.type = heavy762 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(heavy762 ? 142 : 178, now);
      osc.frequency.exponentialRampToValueAtTime(heavy762 ? 44 : 55, now + (heavy762 ? 0.11 : 0.08));
      oscGain.gain.setValueAtTime(heavy762 ? 0.78 : 0.65, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + (heavy762 ? 0.12 : 0.09));

      noise.start(now);
      noise.stop(now + 0.19);
      osc.start(now);
      osc.stop(now + 0.13);
    }

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    osc.connect(oscGain);
    oscGain.connect(master);
  }

  private playLightMg30Fire(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.32 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1650, now);
    bp.frequency.exponentialRampToValueAtTime(380, now + 0.14);
    bp.Q.value = 0.85;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(1.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.16);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.75, now);
    oGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(oGain);
    oGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private playHeavyMgFire(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.36 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.21);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(1.35, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.23);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(108, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.16);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.92, now);
    oGain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);
    osc.connect(oGain);
    oGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  private playRocketOrMissileLaunch(isGuided: boolean, volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.38 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(isGuided ? 850 : 620, now);
    bp.frequency.exponentialRampToValueAtTime(1850, now + 0.2);
    bp.frequency.exponentialRampToValueAtTime(320, now + 0.58);
    bp.Q.value = 0.7;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(1.4, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.62);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isGuided ? 240 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.36);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(1.0, now);
    oGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    osc.connect(oGain);
    oGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAutocannonFire(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.42 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2100, now);
    lp.frequency.exponentialRampToValueAtTime(190, now + 0.26);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(1.25, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.27);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.28);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.19);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.85, now);
    oGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(oGain);
    oGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playFieldGunFire(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    this.playMechanicalClick(180, 0.08);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, now);
    lp.frequency.exponentialRampToValueAtTime(85, now + 0.78);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.95 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.008, now + 0.82);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.85);

    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.55);
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0.75 * volumeScale, now);
    sGain.gain.exponentialRampToValueAtTime(0.006, now + 0.58);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.6);
  }

  public playLockTone(locked: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = locked ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(locked ? 1680 : 620, now);
    gain.gain.setValueAtTime(locked ? 0.075 : 0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.003, now + (locked ? 0.14 : 0.07));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playJetFlyover() {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(220, now);
    bp.frequency.exponentialRampToValueAtTime(1400, now + 0.85);
    bp.frequency.exponentialRampToValueAtTime(180, now + 2.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.34, now + 0.85);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 2.1);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 2.15);
  }

  public playStreakCue(tier: 1 | 2 | 3) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = tier === 1 ? [587.33, 880] : tier === 2 ? [659.25, 987.77, 1318.5] : [783.99, 1046.5, 1567.98];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.004, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playExplosion(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.58 * volumeScale, now);
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1750, now);
    lp.frequency.exponentialRampToValueAtTime(90, now + 0.9);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(1.35, now);
    nGain.gain.exponentialRampToValueAtTime(0.008, now + 0.95);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.98);

    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.48);
    sGain.gain.setValueAtTime(1.25, now);
    sGain.gain.exponentialRampToValueAtTime(0.006, now + 0.5);
    sub.connect(sGain);
    sGain.connect(master);
    sub.start(now);
    sub.stop(now + 0.52);
  }

  public playCannonFire(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1900, now);
    lp.frequency.exponentialRampToValueAtTime(110, now + 0.55);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.85 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.008, now + 0.58);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.6);

    const osc = ctx.createOscillator();
    const oGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
    oGain.gain.setValueAtTime(0.65 * volumeScale, now);
    oGain.gain.exponentialRampToValueAtTime(0.006, now + 0.38);
    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playVehicleMount(entering: boolean) {
    this.playMechanicalClick(entering ? 320 : 240, 0.06);
    if (entering) {
      window.setTimeout(() => this.playMechanicalClick(140, 0.12), 70);
    }
  }

  public playPinPull() {
    this.playMechanicalClick(920, 0.035);
    window.setTimeout(() => this.playMechanicalClick(1280, 0.025), 55);
  }

  public playGrenadeBounce(volumeScale = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420 + Math.random() * 90, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);
    gain.gain.setValueAtTime(0.11 * volumeScale, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playBulletWhiz() {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3.2;
    bp.frequency.setValueAtTime(3400, now);
    bp.frequency.exponentialRampToValueAtTime(750, now + 0.09);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.095);
    noise.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
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

  public playWallCrumble(volumeScale = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1150, now);
    lp.frequency.exponentialRampToValueAtTime(135, now + 0.85);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.45 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.006, now + 0.9);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.94);

    // Secondary falling masonry thuds
    for (let i = 0; i < 3; i++) {
      const t = now + 0.1 + i * 0.14 + Math.random() * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(92 - i * 14, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.16);
      gain.gain.setValueAtTime(0.28 * volumeScale, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }

  public playRicochet(volumeScale = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startF = 1850 + Math.random() * 950;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(640 + Math.random() * 260, now + 0.11);
    gain.gain.setValueAtTime(0.075 * volumeScale, now);
    gain.gain.exponentialRampToValueAtTime(0.003, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playBarrelHiss(volumeScale = 0.6) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2600, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11 * volumeScale, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + 0.34);
    noise.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.36);
  }

  public playVehicleRam(heavy: boolean, volumeScale = 0.9) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(heavy ? 640 : 980, now);
    bp.frequency.exponentialRampToValueAtTime(140, now + 0.36);
    bp.Q.value = 0.9;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.42 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.006, now + 0.38);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);

    // Metallic crunch clang
    const clang = ctx.createOscillator();
    const cGain = ctx.createGain();
    clang.type = 'sawtooth';
    clang.frequency.setValueAtTime(heavy ? 115 : 165, now);
    clang.frequency.exponentialRampToValueAtTime(34, now + 0.24);
    cGain.gain.setValueAtTime(0.32 * volumeScale, now);
    cGain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
    clang.connect(cGain);
    cGain.connect(ctx.destination);
    clang.start(now);
    clang.stop(now + 0.26);
  }

  public playDigTrench() {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.28;
      // Sharp spade bite + displaced earth scrape
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(920 - i * 80, t);
      bp.frequency.exponentialRampToValueAtTime(260, t + 0.22);
      bp.Q.value = 0.85;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.23);
      noise.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.25);

      const thump = ctx.createOscillator();
      const tGain = ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(110, t);
      thump.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      tGain.gain.setValueAtTime(0.18, t);
      tGain.gain.exponentialRampToValueAtTime(0.004, t + 0.13);
      thump.connect(tGain);
      tGain.connect(ctx.destination);
      thump.start(t);
      thump.stop(t + 0.14);
    }
  }

  public playBeltReload() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Feed tray unlatch + brass belt rattle + tray slam + bolt rack
    const steps: Array<[number, number, OscillatorType, number]> = [
      [0.0, 520, 'square', 0.11],
      [0.25, 1380, 'triangle', 0.08],
      [0.42, 1520, 'triangle', 0.08],
      [0.58, 1290, 'triangle', 0.08],
      [0.95, 360, 'sawtooth', 0.14],
      [1.35, 680, 'square', 0.12],
      [1.52, 840, 'square', 0.13],
    ];
    for (const [offset, freq, type, amp] of steps) {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.075);
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(0.004, t + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
    }
  }

  public playRepairWrench() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1450 + (i % 2) * 320, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.045);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.003, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }

    if (this.noiseBuffer) {
      const spark = ctx.createBufferSource();
      spark.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(3200, now + 0.14);
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.09, now + 0.14);
      sGain.gain.exponentialRampToValueAtTime(0.003, now + 0.34);
      spark.connect(hp);
      hp.connect(sGain);
      sGain.connect(ctx.destination);
      spark.start(now + 0.14);
      spark.stop(now + 0.35);
    }
  }

  public updateHelicopterAudio(active: boolean, rpm: number, climbing: boolean) {
    const ctx = this.ctx;
    if (this.muted || !active || rpm <= 0.02) {
      if (this.heliGain && ctx) {
        this.heliGain.gain.setTargetAtTime(0, ctx.currentTime, 0.09);
      }
      return;
    }
    const readyCtx = this.ensureContext();
    if (!readyCtx) return;

    if (!this.heliTurbineOsc || !this.heliChopOsc || !this.heliLfoOsc || !this.heliLfoGain || !this.heliFilter || !this.heliGain) {
      const turbine = readyCtx.createOscillator();
      const chop = readyCtx.createOscillator();
      const lfo = readyCtx.createOscillator();
      const lfoGain = readyCtx.createGain();
      const filter = readyCtx.createBiquadFilter();
      const gain = readyCtx.createGain();

      turbine.type = 'sawtooth';
      chop.type = 'triangle';
      lfo.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      gain.gain.value = 0;

      // Amplitude-modulate lowpass cutoff at blade pass frequency (~9-15 Hz chop)
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      turbine.connect(filter);
      chop.connect(filter);
      filter.connect(gain);
      gain.connect(readyCtx.destination);

      turbine.start();
      chop.start();
      lfo.start();

      this.heliTurbineOsc = turbine;
      this.heliChopOsc = chop;
      this.heliLfoOsc = lfo;
      this.heliLfoGain = lfoGain;
      this.heliFilter = filter;
      this.heliGain = gain;
    }

    const now = readyCtx.currentTime;
    const clamped = Math.max(0.02, Math.min(1, rpm));
    const collectiveBoost = climbing ? 1.15 : 1.0;
    this.heliTurbineOsc.frequency.setTargetAtTime((86 + clamped * 138) * collectiveBoost, now, 0.08);
    this.heliChopOsc.frequency.setTargetAtTime(22 + clamped * 26, now, 0.08);
    this.heliLfoOsc.frequency.setTargetAtTime(4.5 + clamped * 9.8, now, 0.08);
    this.heliLfoGain.gain.setTargetAtTime(140 * clamped, now, 0.08);
    this.heliFilter.frequency.setTargetAtTime((240 + clamped * 220) * collectiveBoost, now, 0.08);
    this.heliGain.gain.setTargetAtTime(0.032 + clamped * 0.052, now, 0.08);
  }

  public playHeliRocket(volumeScale = 0.95) {
    this.playRocketOrMissileLaunch(false, volumeScale);
  }

  public playChainGun30mm(volumeScale = 0.95) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(920, now);
    bp.frequency.exponentialRampToValueAtTime(210, now + 0.14);
    bp.Q.value = 0.85;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32 * volumeScale, now);
    nGain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);

    const punch = ctx.createOscillator();
    const pGain = ctx.createGain();
    punch.type = 'sawtooth';
    punch.frequency.setValueAtTime(175, now);
    punch.frequency.exponentialRampToValueAtTime(48, now + 0.095);
    pGain.gain.setValueAtTime(0.26 * volumeScale, now);
    pGain.gain.exponentialRampToValueAtTime(0.004, now + 0.1);
    punch.connect(pGain);
    pGain.connect(ctx.destination);
    punch.start(now);
    punch.stop(now + 0.11);
  }

  public playHangarResupply() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pneumatic lift + ordnance rack lock + armor plate chime
    const notes: Array<[number, number, OscillatorType, number]> = [
      [0.0, 220, 'sawtooth', 0.11],
      [0.12, 340, 'sawtooth', 0.12],
      [0.26, 520, 'triangle', 0.11],
      [0.42, 780, 'sine', 0.12],
      [0.56, 1040, 'sine', 0.11],
    ];
    for (const [offset, freq, type, amp] of notes) {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.003, t + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    if (this.noiseBuffer) {
      const air = ctx.createBufferSource();
      air.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(2200, now);
      const aGain = ctx.createGain();
      aGain.gain.setValueAtTime(0.08, now);
      aGain.gain.exponentialRampToValueAtTime(0.003, now + 0.25);
      air.connect(hp);
      hp.connect(aGain);
      aGain.connect(ctx.destination);
      air.start(now);
      air.stop(now + 0.26);
    }
  }
}

export const soundEngine = new SoundEngine();


