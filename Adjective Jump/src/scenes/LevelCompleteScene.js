// ============================================================
// LEVEL COMPLETE SCENE — shown after clearing all phrases
// ============================================================
window.AJ = window.AJ || {};

AJ.LevelCompleteScene = class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelCompleteScene' }); }

  init(data) {
    this.summary     = data.summary;
    this.levelConfig = data.levelConfig;
    this.gameMode    = data.mode;
    this.endlessLevel = data.endlessLevel || 1;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._drawBackground(W, H);
    this._drawPanel(W, H);
    this._drawStars(W, H);
    this._drawStats(W, H);
    this._drawButtons(W, H);
    this._spawnConfetti(W, H);
    this.cameras.main.fadeIn(300);
    AJ.audio.playLevelComplete();
  }

  _drawBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2e, 0x0d0d2e, 0x1a0d3d, 0x1a0d3d, 1);
    bg.fillRect(0, 0, W, H);
  }

  _drawPanel(W, H) {
    const pw = 320, ph = 480;
    const px = W / 2 - pw / 2;
    const py = H / 2 - ph / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x12122a, 0.97);
    panel.fillRoundedRect(px, py, pw, ph, 22);
    panel.lineStyle(2.5, 0x4ecdc4, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 22);

    // Animated glow border
    this.tweens.add({
      targets: panel,
      alpha: 0.85,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Clear message
    const msgs = AJ.EXPLANATIONS.levelComplete;
    this.add.text(W / 2, py + 40, msgs[Math.floor(Math.random() * msgs.length)], {
      fontSize: '26px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffd93d',
    }).setOrigin(0.5);

    this.add.text(W / 2, py + 74, this.levelConfig.name, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#888899',
      letterSpacing: 2,
    }).setOrigin(0.5);
  }

  _drawStars(W, H) {
    const stars = this._getStars();
    const starY = H / 2 - 90;
    const starEmojis = ['⭐', '⭐', '⭐'];
    const positions = [-52, 0, 52];

    starEmojis.forEach((s, i) => {
      const earned = i < stars;
      const star = this.add.text(W / 2 + positions[i], starY, s, {
        fontSize: '38px',
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
        alpha: earned ? 1 : 0.2,
      }).setOrigin(0.5).setScale(0);

      if (earned) {
        this.tweens.add({
          targets: star,
          scaleX: 1, scaleY: 1,
          duration: 350,
          delay: 300 + i * 150,
          ease: 'Back.Out',
        });
      } else {
        this.tweens.add({ targets: star, scaleX: 1, scaleY: 1, duration: 200, delay: 200, ease: 'Linear' });
      }
    });
  }

  _drawStats(W, H) {
    const s = this.summary;
    const rows = [
      { label: '최종 점수',  value: s.score.toLocaleString(), color: '#ffd93d' },
      { label: '최고 연속',  value: `${s.streak}회`,          color: '#6bcb77' },
      { label: '실수 횟수',  value: `${s.mistakes}회`,         color: s.mistakes === 0 ? '#6bcb77' : '#ff6b6b' },
      { label: '남은 시간',  value: `${s.timeLeft}초`,         color: '#4ecdc4' },
      { label: '완료 문장',  value: `${s.phrases}개`,          color: '#c77dff' },
    ];

    const startY = H / 2 - 28;
    rows.forEach((row, i) => {
      const y = startY + i * 38;
      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a3a, 0.6);
      bg.fillRoundedRect(W / 2 - 130, y - 14, 260, 28, 8);

      this.add.text(W / 2 - 110, y, row.label, {
        fontSize: '13px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#888899',
      }).setOrigin(0, 0.5);

      const val = this.add.text(W / 2 + 110, y, row.value, {
        fontSize: '15px', fontFamily: 'Segoe UI, Arial, sans-serif',
        fontStyle: 'bold', color: row.color,
      }).setOrigin(1, 0.5).setAlpha(0);

      this.tweens.add({ targets: val, alpha: 1, duration: 300, delay: 200 + i * 80 });
    });
  }

  _drawButtons(W, H) {
    const btnY   = H / 2 + 170;
    const hasNext = this._getNextLevelConfig() !== null;

    if (hasNext) {
      this._makeBtn(W / 2, btnY - 30, '다음 레벨 ▶', 0x4ecdc4, () => {
        AJ.audio.playMenuClick();
        const next = this._getNextLevelConfig();
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(260, () =>
          this.scene.start('GameScene', { levelConfig: next, mode: this.gameMode, endlessLevel: this.endlessLevel + 1 })
        );
      });
    }

    this._makeBtn(W / 2, btnY + (hasNext ? 28 : 0), '다시 하기 🔄', 0xf4a261, () => {
      AJ.audio.playMenuClick();
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () =>
        this.scene.start('GameScene', { levelConfig: this.levelConfig, mode: this.gameMode, endlessLevel: this.endlessLevel })
      );
    });

    this._makeBtn(W / 2, btnY + (hasNext ? 68 : 40), '메뉴로', 0x888899, () => {
      AJ.audio.playMenuClick();
      this.scene.start('MenuScene');
    });
  }

  _makeBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      backgroundColor: '#1a1a3a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    btn.on('pointerout',   () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 }));
    btn.on('pointerdown', cb);
    return btn;
  }

  _spawnConfetti(W, H) {
    const colors = [0xffd93d, 0xff6b9d, 0x4ecdc4, 0x6bcb77, 0xc77dff, 0xf4a261];
    for (let i = 0; i < 30; i++) {
      const piece = this.add.rectangle(
        Math.random() * W,
        -20,
        8 + Math.random() * 8,
        8 + Math.random() * 8,
        colors[Math.floor(Math.random() * colors.length)]
      ).setAlpha(0.9);

      this.tweens.add({
        targets: piece,
        y: H + 30,
        x: piece.x + (Math.random() - 0.5) * 120,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Math.random() * 1000,
        ease: 'Linear',
        onComplete: () => piece.destroy(),
      });
    }
  }

  _getStars() {
    const s = this.summary;
    if (s.mistakes === 0 && s.timeLeft > 20) return 3;
    if (s.mistakes <= 2) return 2;
    return 1;
  }

  _getNextLevelConfig() {
    if (this.gameMode === 'endless') {
      return AJ.contentEngine.buildEndlessLevelConfig(this.endlessLevel + 1);
    }
    if (this.gameMode !== 'adventure') return null;
    const nextId = this.levelConfig.id + 1;
    return AJ.LEVELS.find(l => l.id === nextId) || null;
  }
};
