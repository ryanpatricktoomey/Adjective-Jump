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
    this.reason      = data.reason || 'time';  // 'time' | 'lives'
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const byTime  = this.reason === 'time';
    const icon    = byTime ? '⏰' : '💔';
    const msgKr   = byTime ? '시간 초과!' : '목숨을 모두 잃었어요!';
    const accent  = byTime ? 0xff6b6b : 0xff4488;
    const accentS = byTime ? '#ff6b6b' : '#ff4488';
    const panelBg = byTime ? 0x12080a : 0x120810;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d1a, 0x0d0d1a, byTime ? 0x1a0808 : 0x130813, byTime ? 0x1a0808 : 0x130813, 1);
    bg.fillRect(0, 0, W, H);

    // Panel
    const pw = 300, ph = 380;
    const panel = this.add.graphics();
    panel.fillStyle(panelBg, 0.97);
    panel.fillRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 20);
    panel.lineStyle(2, accent, 0.7);
    panel.strokeRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 20);

    this.add.text(W / 2, H / 2 - 145, icon, {
      fontSize: '52px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 85, msgKr, {
      fontSize: byTime ? '22px' : '18px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: accentS,
    }).setOrigin(0.5);

    // Stats
    const s    = this.summary;
    const rows = [
      { label: '점수',     value: s.score.toLocaleString(), color: '#ffd93d' },
      { label: '최고 연속', value: `${s.streak}회`,         color: '#6bcb77' },
      { label: '완료 문장', value: `${s.phrases}개`,         color: '#4ecdc4' },
      { label: '실수 횟수', value: `${s.mistakes}회`,        color: accentS  },
      ...(this.summary.lives !== undefined
        ? [{ label: '남은 목숨', value: '❤️'.repeat(this.summary.lives || 0) || '없음', color: accentS }]
        : []),
    ];

    rows.forEach((row, i) => {
      const y = H / 2 - 35 + i * 34;
      this.add.text(W / 2 - 90, y, row.label, {
        fontSize: '13px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#666688',
      }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 90, y, row.value, {
        fontSize: '16px',
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Segoe UI, Arial, sans-serif',
        fontStyle: 'bold', color: row.color,
      }).setOrigin(1, 0.5);
    });

    // Buttons
    this._makeBtn(W / 2, H / 2 + 115, '다시 하기 🔄', accent, () => {
      AJ.audio.playMenuClick();
      this.scene.start('GameScene', { levelConfig: this.levelConfig, mode: this.gameMode });
    });

    this._makeBtn(W / 2, H / 2 + 158, '메뉴로', 0x888899, () => {
      AJ.audio.playMenuClick();
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(300);
  }

  _makeBtn(x, y, label, color, cb) {
    return AJ.makeBtn(this, x, y, label, { width: 220, height: 50, color, bgColor: 0x160a14, silent: true }, cb);
  }
};
