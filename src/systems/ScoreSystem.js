// ============================================================
// SCORE SYSTEM — tracks score, streak, timer, and mistakes
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
    this._timerCb     = null;
    this._doubleActive = false;
    this._shieldActive = false;
  }

  // ─── Timer ──────────────────────────────────────────────

  startTimer(seconds, onTick, onExpire) {
    this.timeLeft     = seconds;
    this.timerRunning = true;
    this._onTick      = onTick;
    this._onExpire    = onExpire;
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
  }

  addTime(seconds) {
    this.timeLeft += seconds;
    if (this._onTick) this._onTick(this.timeLeft);
  }

  // ─── Scoring ────────────────────────────────────────────

  scoreCorrectTap() {
    const base       = 10;
    const multiplier = this._doubleActive ? 2 : 1;
    const streakBonus = Math.floor(this.streak / 3);
    const points     = (base + streakBonus * 5) * multiplier;
    this.score       += points;
    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    return { points, streak: this.streak };
  }

  scorePhraseComplete(adjCount) {
    const base        = 50 + adjCount * 20;
    const multiplier  = this._doubleActive ? 2 : 1;
    const points      = base * multiplier;
    this.score        += points;
    this.phrasesCleared++;
    return points;
  }

  scoreMistake() {
    if (this._shieldActive) {
      this._shieldActive = false;
      return { shielded: true };
    }
    this.mistakes++;
    this.streak = 0;
    return { shielded: false };
  }

  scoreLevelComplete(timeLeft) {
    const timeBonus = timeLeft * 5;
    const streakBonus = this.maxStreak * 10;
    const bonus = timeBonus + streakBonus;
    this.score += bonus;
    return { timeBonus, streakBonus, total: bonus };
  }

  // ─── Power-ups ──────────────────────────────────────────

  activateDouble(duration = 15000) {
    this._doubleActive = true;
    clearTimeout(this._doubleTimer);
    this._doubleTimer = setTimeout(() => { this._doubleActive = false; }, duration);
  }

  activateShield() {
    this._shieldActive = true;
  }

  isDoubleActive() { return this._doubleActive; }
  isShieldActive() { return this._shieldActive; }

  // ─── Summary ────────────────────────────────────────────

  getSummary() {
    return {
      score:    this.score,
      streak:   this.maxStreak,
      mistakes: this.mistakes,
      phrases:  this.phrasesCleared,
      timeLeft: this.timeLeft,
    };
  }

  getStars() {
    if (this.mistakes === 0 && this.timeLeft > 20) return 3;
    if (this.mistakes <= 2) return 2;
    return 1;
  }
};
