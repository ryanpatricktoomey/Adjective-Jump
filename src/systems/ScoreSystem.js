// ============================================================
// SCORE SYSTEM
// Tuning knobs marked with ← TUNE: comments.
// ============================================================
window.AJ = window.AJ || {};

AJ.ScoreSystem = class ScoreSystem {
  constructor() { this.reset(); }

  reset() {
    this.score        = 0;
    this.streak       = 0;
    this.maxStreak    = 0;
    this.mistakes     = 0;
    this.phrasesCleared = 0;
    this.timeLeft     = 60;
    this.timerRunning = false;

    // Lives
    this.lives          = 3;          // ← TUNE: starting lives
    this.maxLives       = 3;          // ← TUNE: max lives cap

    // Perfect phrase chain
    this.perfectPhraseChain    = 0;
    this.PERFECT_CHAIN_THRESHOLD = 3; // ← TUNE: perfect phrases needed for reward

    // Power-up state
    this._shieldActive = false;
    this._doubleActive = false;

    // Internal timer state
    this._onTick   = null;
    this._onExpire = null;
    this._timerHandle = null;
  }

  // ─── Timer ──────────────────────────────────────────────

  startTimer(seconds, onTick, onExpire) {
    this.timeLeft     = seconds;
    this._onTick      = onTick;
    this._onExpire    = onExpire;
    this.timerRunning = true;
    clearInterval(this._timerHandle);
    this._timerHandle = setInterval(() => {
      if (!this.timerRunning) return;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this._onTick) this._onTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.timerRunning = false;
        clearInterval(this._timerHandle);
        if (this._onExpire) this._onExpire();
      }
    }, 1000);
  }

  stopTimer() {
    this.timerRunning = false;
    clearInterval(this._timerHandle);
    this._timerHandle = null;
  }

  /** Pause without clearing callbacks — use resumeTimer() to continue. */
  pauseTimer() {
    this.timerRunning = false;
    clearInterval(this._timerHandle);
    this._timerHandle = null;
  }

  /** Resume after pauseTimer(). Re-uses stored callbacks. */
  resumeTimer() {
    if (!this._onTick || this.timeLeft <= 0) return;
    this.timerRunning = true;
    clearInterval(this._timerHandle);
    this._timerHandle = setInterval(() => {
      if (!this.timerRunning) return;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      if (this._onTick) this._onTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.timerRunning = false;
        clearInterval(this._timerHandle);
        if (this._onExpire) this._onExpire();
      }
    }, 1000);
  }

  addTime(seconds) {
    this.timeLeft += seconds;
    if (this._onTick) this._onTick(this.timeLeft);
  }

  // ─── Lives ──────────────────────────────────────────────

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  /** @returns {boolean} true = life gained, false = was already at max */
  gainLife() {
    if (this.lives < this.maxLives) {
      this.lives++;
      return true;
    }
    return false;
  }

  // ─── Perfect phrase chain ───────────────────────────────

  /**
   * Called after every phrase completes.
   * @param {boolean} perfect - no crack/break/fall occurred
   * @returns {{ lifeGained?: boolean, atMax?: boolean, chainCount: number }}
   */
  recordPhraseResult(perfect) {
    if (!perfect) {
      this.perfectPhraseChain = 0;
      return { chainCount: 0 };
    }
    this.perfectPhraseChain++;
    if (this.perfectPhraseChain >= this.PERFECT_CHAIN_THRESHOLD) {
      this.perfectPhraseChain = 0;
      const gained = this.gainLife();
      return gained ? { lifeGained: true, chainCount: 0 } : { atMax: true, chainCount: 0 };
    }
    return { chainCount: this.perfectPhraseChain };
  }

  // ─── Scoring ────────────────────────────────────────────

  scoreCorrectTap() {
    const base        = 10;              // ← TUNE
    const streakBonus = Math.floor(this.streak / 3) * 5;
    const multiplier  = this._doubleActive ? 2 : 1;
    const points      = (base + streakBonus) * multiplier;
    this.score       += points;
    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    return { points, streak: this.streak };
  }

  scorePhraseComplete(adjCount) {
    const base       = 50 + adjCount * 20; // ← TUNE
    const multiplier = this._doubleActive ? 2 : 1;
    const points     = base * multiplier;
    this.score      += points;
    this.phrasesCleared++;
    return points;
  }

  scoreMistake() {
    // Shield is pre-consumed in GameScene before board.handleTap, so this
    // will never be shielded — kept defensive for safety.
    if (this._shieldActive) {
      this._shieldActive = false;
      return { shielded: true };
    }
    this.mistakes++;
    this.streak = 0;
    return { shielded: false };
  }

  scoreLevelComplete(timeLeft) {
    const timeBonus   = timeLeft * 5;   // ← TUNE
    const streakBonus = this.maxStreak * 10;
    const bonus       = timeBonus + streakBonus;
    this.score       += bonus;
    return { timeBonus, streakBonus, total: bonus };
  }

  // ─── Power-ups ──────────────────────────────────────────

  activateShield()  { this._shieldActive = true; }
  consumeShield()   { this._shieldActive = false; }
  isShieldActive()  { return this._shieldActive; }

  activateDouble(durationMs = 15000) { // ← TUNE: double duration
    this._doubleActive = true;
    clearTimeout(this._doubleTimer);
    this._doubleTimer = setTimeout(() => { this._doubleActive = false; }, durationMs);
  }
  isDoubleActive() { return this._doubleActive; }

  // ─── Summary ────────────────────────────────────────────

  getSummary() {
    return {
      score:    this.score,
      streak:   this.maxStreak,
      mistakes: this.mistakes,
      phrases:  this.phrasesCleared,
      timeLeft: this.timeLeft,
      lives:    this.lives,
    };
  }

  getStars() {
    if (this.mistakes === 0 && this.timeLeft > 20) return 3;
    if (this.mistakes <= 2) return 2;
    return 1;
  }
};
