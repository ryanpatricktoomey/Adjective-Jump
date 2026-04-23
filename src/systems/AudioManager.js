// ============================================================
// AUDIO MANAGER — all sounds generated with Web Audio API
// No audio files needed. To replace with real audio files:
//   1. Add Phaser audio keys in BootScene preload()
//   2. Replace each play*() method body with this.scene.sound.play('key')
// ============================================================
window.AJ = window.AJ || {};

AJ.AudioManager = class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.7;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ─── Public API ─────────────────────────────────────────

  playCorrect(streakLevel = 0) {
    this._resume();
    const pitchBoost = Math.min(streakLevel * 50, 300);
    this._tone(523 + pitchBoost, 0.08, 'sine', 0.12);
    this._delay(80, () => this._tone(659 + pitchBoost, 0.08, 'sine', 0.15));
  }

  playStreak(level) {
    this._resume();
    const notes = [523, 659, 784, 1047, 1319];
    const count = Math.min(level, notes.length);
    for (let i = 0; i < count; i++) {
      this._delay(i * 55, () => this._tone(notes[i], 0.07, 'sine', 0.12));
    }
  }

  playCrack() {
    this._resume();
    this._noise(0.15, 0.08);
    this._tone(180, 0.1, 'sawtooth', 0.08);
  }

  playBreak() {
    this._resume();
    this._noise(0.25, 0.18);
    this._tone(120, 0.15, 'sawtooth', 0.25);
    this._delay(80, () => this._tone(80, 0.1, 'sawtooth', 0.3));
  }

  playPhraseComplete() {
    this._resume();
    [523, 659, 784, 1047].forEach((f, i) =>
      this._delay(i * 70, () => this._tone(f, 0.09, 'triangle', 0.18))
    );
  }

  playLevelComplete() {
    this._resume();
    const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1047];
    melody.forEach((f, i) =>
      this._delay(i * 90, () => this._tone(f, 0.11, 'triangle', 0.2))
    );
  }

  playPowerup() {
    this._resume();
    [784, 1047, 1319, 1568].forEach((f, i) =>
      this._delay(i * 50, () => this._tone(f, 0.08, 'sine', 0.12))
    );
  }

  playDoor() {
    this._resume();
    [261, 329, 392, 523, 659, 784].forEach((f, i) =>
      this._delay(i * 80, () => this._tone(f, 0.1, 'sine', 0.25))
    );
  }

  playGameOver() {
    this._resume();
    [392, 349, 311, 261].forEach((f, i) =>
      this._delay(i * 120, () => this._tone(f, 0.1, 'sawtooth', 0.3))
    );
  }

  playTimerWarning() {
    this._resume();
    this._tone(880, 0.06, 'square', 0.06);
  }

  playMenuClick() {
    this._resume();
    this._tone(660, 0.05, 'sine', 0.08);
  }

  // ─── Internals ──────────────────────────────────────────

  _tone(freq, gain, type, duration) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain * this.volume, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.01);
    } catch (e) {}
  }

  _noise(gain, duration) {
    if (!this.enabled || !this.ctx) return;
    try {
      const size   = Math.floor(this.ctx.sampleRate * duration);
      const buf    = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain * this.volume, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      src.connect(g);
      g.connect(this.ctx.destination);
      src.start();
    } catch (e) {}
  }

  _delay(ms, fn) {
    if (ms === 0) { fn(); return; }
    setTimeout(fn, ms);
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  toggle()     { this.enabled = !this.enabled; return this.enabled; }
};

// Singleton
AJ.audio = new AJ.AudioManager();
