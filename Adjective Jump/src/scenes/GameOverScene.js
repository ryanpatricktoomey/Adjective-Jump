// ============================================================
// GAME OVER SCENE — shown when timer runs out
// ============================================================
window.AJ = window.AJ || {};

AJ.GameOverScene = class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.summary     = data.summary;
    this.levelConfig = data.levelConfig;
    this.gameMode    = data.mode;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d1a, 0x0d0d1a, 0x1a0808, 0x1a0808, 1);
    bg.fillRect(0, 0, W, H);

    // Panel
    const pw = 300, ph = 380;
    const panel = this.add.graphics();
    panel.fillStyle(0x12080a, 0.97);
    panel.fillRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 20);
    panel.lineStyle(2, 0xff6b6b, 0.7);
    panel.strokeRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 20);

    this.add.text(W / 2, H / 2 - 145, '⏰', {
      fontSize: '52px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 85, AJ.EXPLANATIONS.gameOver, {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ff6b6b',
    }).setOrigin(0.5);

    // Stats
    const s    = this.summary;
    const rows = [
      { label: '점수',     value: s.score.toLocaleString(), color: '#ffd93d' },
      { label: '최고 연속', value: `${s.streak}회`,         color: '#6bcb77' },
      { label: '완료 문장', value: `${s.phrases}개`,         color: '#4ecdc4' },
      { label: '실수 횟수', value: `${s.mistakes}회`,        color: '#ff6b6b' },
    ];

    rows.forEach((row, i) => {
      const y = H / 2 - 35 + i * 36;
      this.add.text(W / 2 - 90, y, row.label, {
        fontSize: '13px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#666688',
      }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 90, y, row.value, {
        fontSize: '16px', fontFamily: 'Segoe UI, Arial, sans-serif',
        fontStyle: 'bold', color: row.color,
      }).setOrigin(1, 0.5);
    });

    // Buttons
    this._makeBtn(W / 2, H / 2 + 110, '다시 하기 🔄', 0xff6b6b, () => {
      AJ.audio.playMenuClick();
      this.scene.start('GameScene', { levelConfig: this.levelConfig, mode: this.gameMode });
    });

    this._makeBtn(W / 2, H / 2 + 155, '메뉴로', 0x888899, () => {
      AJ.audio.playMenuClick();
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(300);
  }

  _makeBtn(x, y, label, color, cb) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      backgroundColor: '#1a0a0a',
      padding: { x: 22, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    btn.on('pointerout',   () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 }));
    btn.on('pointerdown', cb);
    return btn;
  }
};
