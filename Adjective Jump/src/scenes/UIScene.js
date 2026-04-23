// ============================================================
// UI SCENE — HUD overlay (timer, score, streak)
// Runs on top of GameScene as a parallel scene.
// ============================================================
window.AJ = window.AJ || {};

AJ.UIScene = class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const W = this.scale.width;

    // ── HUD background bar ──────────────────────────────
    const hudH = 70;
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x08080e, 0.95);
    hudBg.fillRect(0, 0, W, hudH);
    hudBg.lineStyle(1, 0x222244, 1);
    hudBg.lineBetween(0, hudH, W, hudH);

    // ── Level name ──────────────────────────────────────
    this.levelLabel = this.add.text(W / 2, 13, '', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#555577',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // ── Score ───────────────────────────────────────────
    this.scoreText = this.add.text(16, 24, '0', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.add.text(16, 42, '점수', {
      fontSize: '9px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#444466',
    }).setOrigin(0, 0.5);

    // ── Timer ───────────────────────────────────────────
    this.timerText = this.add.text(W / 2, 38, '—', {
      fontSize: '30px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    // Timer ring (decorative arc)
    this.timerRing = this.add.graphics();
    this._maxTime = 0;  // set on first timeUpdate
    this._drawTimerRing(1, 1);

    // ── Streak ──────────────────────────────────────────
    this.streakText = this.add.text(W - 16, 24, '0', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(1, 0.5);

    this.add.text(W - 16, 42, '연속', {
      fontSize: '9px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#444466',
    }).setOrigin(1, 0.5);

    this.streakFire = this.add.text(W - 16, 54, '', {
      fontSize: '14px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(1, 0.5);

    // ── Audio toggle ────────────────────────────────────
    const audioBtn = this.add.text(W / 2 + 52, 36, '🔊', {
      fontSize: '16px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    audioBtn.on('pointerdown', () => {
      const on = AJ.audio.toggle();
      audioBtn.setText(on ? '🔊' : '🔇');
    });

    // ── Back button ─────────────────────────────────────
    const backBtn = this.add.text(W / 2 + 78, 36, '⏸', {
      fontSize: '16px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this._showPauseMenu(W));

    // ── Listen for updates ──────────────────────────────
    this.events.on('scoreUpdate',  score  => this._updateScore(score));
    this.events.on('timeUpdate',   time   => this._updateTimer(time));
    this.events.on('streakUpdate', streak => this._updateStreak(streak));
    this.events.on('levelName',    name   => { this.levelLabel.setText(name.toUpperCase()); });
  }

  // ─── Update handlers ────────────────────────────────────

  _updateScore(score) {
    const prev = parseInt(this.scoreText.text.replace(/,/g, '')) || 0;
    this.scoreText.setText(score.toLocaleString());
    if (score > prev) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.25, scaleY: 1.25,
        duration: 80,
        yoyo: true,
        ease: 'Back.Out',
      });
    }
  }

  _updateTimer(time) {
    this.timerText.setText(String(Math.ceil(time)));

    if (this._maxTime === 0 || this._maxTime < time) this._maxTime = time;
    this._drawTimerRing(time, this._maxTime);

    if (time <= 10) {
      this.timerText.setColor('#ff6b6b');
      this.tweens.add({
        targets: this.timerText,
        scaleX: 1.15, scaleY: 1.15,
        duration: 100,
        yoyo: true,
      });
    } else if (time <= 20) {
      this.timerText.setColor('#f4a261');
    } else {
      this.timerText.setColor('#4ecdc4');
    }
  }

  _updateStreak(streak) {
    this.streakText.setText(String(streak));

    if (streak === 0) {
      this.streakText.setColor('#ffffff');
      this.streakFire.setText('');
    } else if (streak >= 10) {
      this.streakText.setColor('#ffd93d');
      this.streakFire.setText('🔥🔥');
    } else if (streak >= 5) {
      this.streakText.setColor('#f4a261');
      this.streakFire.setText('🔥');
    } else {
      this.streakText.setColor('#6bcb77');
      this.streakFire.setText('');
    }

    if (streak > 0) {
      this.tweens.add({
        targets: this.streakText,
        scaleX: 1.25, scaleY: 1.25,
        duration: 80,
        yoyo: true,
      });
    }
  }

  _drawTimerRing(current, max) {
    const W = this.scale.width;
    this.timerRing.clear();
    const pct  = max > 0 ? current / max : 0;
    const col  = pct > 0.5 ? 0x4ecdc4 : pct > 0.25 ? 0xf4a261 : 0xff6b6b;
    const cx = W / 2, cy = 38, r = 22;
    // Background ring
    this.timerRing.lineStyle(3, 0x222244, 1);
    this.timerRing.beginPath();
    this.timerRing.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, false);
    this.timerRing.strokePath();
    // Progress arc
    if (pct > 0) {
      this.timerRing.lineStyle(3, col, 1);
      this.timerRing.beginPath();
      this.timerRing.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false);
      this.timerRing.strokePath();
    }
  }

  // ─── Pause Menu ─────────────────────────────────────────

  _showPauseMenu(W) {
    const gameScene = this.scene.get('GameScene');
    if (gameScene) gameScene.scoreSystem?.stopTimer();

    const H = this.scale.height;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x12122a, 1);
    panel.fillRoundedRect(W / 2 - 120, H / 2 - 100, 240, 200, 18);
    panel.lineStyle(2, 0x4ecdc4, 0.7);
    panel.strokeRoundedRect(W / 2 - 120, H / 2 - 100, 240, 200, 18);

    const title = this.add.text(W / 2, H / 2 - 65, '일시정지', {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    const resume = this._pauseBtn(W / 2, H / 2 - 15, '계속하기 ▶', 0x4ecdc4, () => {
      [overlay, panel, title, resume, quit].forEach(o => o.destroy());
      if (gameScene && gameScene.scoreSystem) {
        gameScene.scoreSystem.timerRunning = true;
        const ss = gameScene.scoreSystem;
        ss.startTimer(ss.timeLeft,
          t => gameScene.events.emit('timeUpdate', t),
          () => gameScene._onTimeUp()
        );
      }
    });

    const quit = this._pauseBtn(W / 2, H / 2 + 45, '메뉴로 돌아가기', 0xff6b6b, () => {
      if (gameScene) { gameScene.scoreSystem?.stopTimer(); gameScene.scene.stop('UIScene'); }
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  _pauseBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { AJ.audio.playMenuClick(); cb(); });
    return btn;
  }
};
