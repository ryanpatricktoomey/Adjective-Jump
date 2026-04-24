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

    this.add.text(16, 40, '점수', {
      fontSize: '9px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#444466',
    }).setOrigin(0, 0.5);

    // ── Lives (hearts) ──────────────────────────────────
    this.heartTexts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(16 + i * 18, 56, '❤️', {
        fontSize: '13px',
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
      }).setOrigin(0, 0.5);
      this.heartTexts.push(h);
    }

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

    // ── HUD icon buttons ────────────────────────────────
    // These are icon-only buttons. We keep them as Text objects but give each
    // an explicit Rectangle hit area much larger than the rendered glyph.
    // Minimum 48×52 px so they're reliable on mobile.
    const iconHitRect = new Phaser.Geom.Rectangle(-24, -26, 48, 52);

    const audioBtn = this.add.text(W / 2 + 55, 35, '🔊', {
      fontSize: '20px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
    }).setOrigin(0.5);
    audioBtn.setInteractive(iconHitRect, Phaser.Geom.Rectangle.Contains);
    audioBtn.input.cursor = 'pointer';
    audioBtn.on('pointerdown', () => {
      const on = AJ.audio.toggle();
      audioBtn.setText(on ? '🔊' : '🔇');
    });

    const pauseBtn = this.add.text(W / 2 + 105, 35, '⏸', {
      fontSize: '20px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
    }).setOrigin(0.5);
    pauseBtn.setInteractive(iconHitRect, Phaser.Geom.Rectangle.Contains);
    pauseBtn.input.cursor = 'pointer';
    pauseBtn.on('pointerdown', () => this._showPauseMenu(W));

    // ── Listen for updates ──────────────────────────────
    this.events.on('scoreUpdate',  score  => this._updateScore(score));
    this.events.on('timeUpdate',   time   => this._updateTimer(time));
    this.events.on('streakUpdate', streak => this._updateStreak(streak));
    this.events.on('levelName',    name   => { this.levelLabel.setText(name.toUpperCase()); });
    this.events.on('livesUpdate',  lives  => this._updateLives(lives));
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

  _updateLives(lives) {
    const prev = this._prevLives ?? lives;
    this.heartTexts.forEach((h, i) => {
      h.setText(i < lives ? '❤️' : '🤍');
    });
    // Flash the heart that was just lost
    if (lives < prev) {
      const lostHeart = this.heartTexts[lives]; // index = new count = last now-empty heart
      if (lostHeart) {
        this.tweens.add({
          targets: lostHeart,
          alpha: 0,
          duration: 120,
          yoyo: true,
          repeat: 2,
        });
      }
    }
    this._prevLives = lives;
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
    // pauseTimer (not stopTimer) so resumeTimer() can restore it cleanly
    gameScene?.scoreSystem?.pauseTimer();

    const H = this.scale.height;

    // Overlay blocks all HUD input while paused (depth 199)
    const overlay = this.add.graphics().setDepth(199);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains
    );

    const panel = this.add.graphics().setDepth(200);
    panel.fillStyle(0x12122a, 1);
    panel.fillRoundedRect(W / 2 - 120, H / 2 - 110, 240, 225, 18);
    panel.lineStyle(2, 0x4ecdc4, 0.7);
    panel.strokeRoundedRect(W / 2 - 120, H / 2 - 110, 240, 225, 18);

    const titleTxt = this.add.text(W / 2, H / 2 - 73, '일시정지', {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);

    let resumeBtn, quitBtn;

    resumeBtn = AJ.makeBtn(this, W / 2, H / 2 - 15, '계속하기 ▶', {
      width: 200, height: 52, color: 0x4ecdc4, bgColor: 0x0a1a1a, depth: 201, silent: true,
    }, () => {
      [overlay, panel, titleTxt, resumeBtn, quitBtn].forEach(o => o?.destroy());
      gameScene?.scoreSystem?.resumeTimer();
    });

    quitBtn = AJ.makeBtn(this, W / 2, H / 2 + 52, '메뉴로 돌아가기', {
      width: 200, height: 52, color: 0xff6b6b, bgColor: 0x1a0a0a, depth: 201,
    }, () => {
      [overlay, panel, titleTxt, resumeBtn, quitBtn].forEach(o => o?.destroy());
      gameScene?.scoreSystem?.stopTimer();
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }
};
