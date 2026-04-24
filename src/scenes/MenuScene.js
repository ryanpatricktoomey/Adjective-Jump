// ============================================================
// MENU SCENE — main menu with mode selection
// ============================================================
window.AJ = window.AJ || {};

AJ.MenuScene = class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._drawBackground(W, H);
    this._drawTitle(W, H);
    this._drawModeButtons(W, H);
    this._drawFooter(W, H);
    this._animateEntrance();
  }

  // ─── Background ─────────────────────────────────────────

  _drawBackground(W, H) {
    // Deep space gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2e, 0x0d0d2e, 0x1a0d3d, 0x1a0d3d, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.5 + 0.3;
      const a = Math.random() * 0.7 + 0.3;
      const star = this.add.circle(x, y, r, 0xffffff, a);
      this.tweens.add({
        targets: star,
        alpha: a * 0.2,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }
  }

  // ─── Title ──────────────────────────────────────────────

  _drawTitle(W, H) {
    // Game logo panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 0.8);
    panel.fillRoundedRect(W / 2 - 160, 60, 320, 120, 20);
    panel.lineStyle(2, 0x4ecdc4, 0.5);
    panel.strokeRoundedRect(W / 2 - 160, 60, 320, 120, 20);

    this.add.text(W / 2, 108, 'Adjective Jump', {
      fontSize: '34px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4ecdc4',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(W / 2, 148, '영어 형용사 순서 게임', {
      fontSize: '15px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    // Mascot
    this.mascot = this.add.text(W / 2, 218, '🐸', {
      fontSize: '52px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.mascot,
      y: 212,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Mode Buttons ───────────────────────────────────────

  _drawModeButtons(W, H) {
    const modes = [
      { key: 'adventure', label: '모험 모드', sub: 'Adventure',  color: 0x4ecdc4, icon: '🗺️' },
      { key: 'practice',  label: '연습 모드', sub: 'Practice',   color: 0xff6b9d, icon: '📝' },
      { key: 'endless',   label: '무한 모드', sub: 'Endless',    color: 0xf4a261, icon: '♾️' },
      { key: 'review',    label: '복습 모드', sub: 'Review',     color: 0xc77dff, icon: '🔁' },
    ];

    const startY = 280;
    const btnH   = 68;
    const gap    = 12;

    this.modeButtons = [];

    modes.forEach((mode, i) => {
      const y = startY + i * (btnH + gap);
      const btn = this._makeButton(W / 2, y, 310, btnH, mode);
      this.modeButtons.push(btn);
    });
  }

  _makeButton(x, y, w, h, mode) {
    const grp = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, mode.color, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    // Left accent
    const accent = this.add.graphics();
    accent.fillStyle(mode.color, 1);
    accent.fillRoundedRect(-w / 2, -h / 2 + 8, 5, h - 16, 3);

    const icon = this.add.text(-w / 2 + 28, 0, mode.icon, {
      fontSize: '28px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);

    const label = this.add.text(-w / 2 + 60, -9, mode.label, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const sub = this.add.text(-w / 2 + 61, 11, mode.sub, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(mode.color).rgba,
    }).setOrigin(0, 0.5);

    const arrow = this.add.text(w / 2 - 20, 0, '›', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    grp.add([bg, accent, icon, label, sub, arrow]);

    // Interaction
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    grp.setSize(w, h);
    grp.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    grp.on('pointerover', () => {
      this.tweens.add({ targets: grp, scaleX: 1.02, scaleY: 1.02, duration: 100 });
      bg.clear();
      bg.fillStyle(mode.color, 0.12);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(2.5, mode.color, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    });

    grp.on('pointerout', () => {
      this.tweens.add({ targets: grp, scaleX: 1, scaleY: 1, duration: 100 });
      bg.clear();
      bg.fillStyle(0x12122a, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(2, mode.color, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    });

    grp.on('pointerdown', () => {
      AJ.audio.playMenuClick();
      this.tweens.add({
        targets: grp,
        scaleX: 0.96, scaleY: 0.96,
        duration: 80,
        yoyo: true,
        onComplete: () => this._launchMode(mode.key),
      });
    });

    return grp;
  }

  _launchMode(key) {
    const progress = this.registry.get('progress');
    let levelConfig;

    if (key === 'adventure') {
      const currentLevel = progress.currentLevel || 1;
      levelConfig = AJ.LEVELS.find(l => l.id === currentLevel) || AJ.LEVELS[0];
      this.scene.start('GameScene', { levelConfig, mode: 'adventure' });

    } else if (key === 'practice') {
      this._showPracticeMenu();

    } else if (key === 'endless') {
      const endlessLevel = progress.endlessLevel || 1;
      levelConfig = AJ.contentEngine.buildEndlessLevelConfig(endlessLevel);
      this.scene.start('GameScene', { levelConfig, mode: 'endless', endlessLevel });

    } else if (key === 'review') {
      const missed = progress.missedPatterns || [];
      AJ.contentEngine.missedPatterns = missed;
      const reviewPhrases = AJ.contentEngine.buildReviewPhrases(4);
      if (!reviewPhrases) {
        this._showNoReviewData();
        return;
      }
      levelConfig = {
        id: 999, name: '복습', world: 0,
        categories: AJ.GRAMMAR_ORDER,
        adjPerPhrase: 3, phrasesPerBoard: 4,
        gridCols: 4, gridRows: 4,
        timeLimit: 120, powerupCount: 0,
        curatedPhrases: [],
        _reviewPhrases: reviewPhrases,
      };
      this.scene.start('GameScene', { levelConfig, mode: 'review' });
    }
  }

  _showPracticeMenu() {
    const W = this.scale.width;
    const H = this.scale.height;

    // group collects every object so destroyAll() cleans up completely
    const group = [];
    const destroyAll = () => group.forEach(o => { try { o.destroy(); } catch (_) {} });

    // Overlay — setInteractive so it blocks the mode buttons sitting behind it
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains
    );
    group.push(overlay);

    const panel = this.add.graphics();
    panel.fillStyle(0x12122a, 0.98);
    panel.fillRoundedRect(W / 2 - 165, 100, 330, H - 140, 20);
    panel.lineStyle(2, 0xff6b9d, 0.6);
    panel.strokeRoundedRect(W / 2 - 165, 100, 330, H - 140, 20);
    group.push(panel);

    const titleTxt = this.add.text(W / 2, 130, '연습 모드 선택', {
      fontSize: '18px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ff6b9d',
    }).setOrigin(0.5);
    group.push(titleTxt);

    AJ.PRACTICE_CONFIGS.forEach((cfg, i) => {
      const btn = this._makePracticeBtn(W / 2, 180 + i * 55, cfg, destroyAll);
      group.push(btn);
    });

    const closeBtn = AJ.makeBtn(this, W / 2, H - 58, '✕ 닫기', {
      width: 170, height: 48, color: 0x888899, bgColor: 0x1a1a3a,
    }, destroyAll);
    group.push(closeBtn);
  }

  _makePracticeBtn(x, y, cfg, onClose) {
    return AJ.makeBtn(this, x, y, cfg.label, {
      width: 290, height: 50, color: 0xff6b9d, bgColor: 0x1a1a3a, fontSize: '15px',
    }, () => {
      onClose();
      const levelConfig = {
        id: 900, name: cfg.label, world: 0,
        categories: cfg.categories, adjPerPhrase: cfg.adjPerPhrase,
        phrasesPerBoard: 5, gridCols: 4, gridRows: Math.ceil(5 * (cfg.adjPerPhrase + 1) / 4) + 1,
        timeLimit: 120, powerupCount: 2, curatedPhrases: [],
      };
      this.scene.start('GameScene', { levelConfig, mode: 'practice' });
    });
  }

  _showNoReviewData() {
    const W = this.scale.width;
    const msg = this.add.text(W / 2, this.scale.height / 2,
      '복습할 데이터가 없어요!\n먼저 모험 모드를 플레이하세요.', {
        fontSize: '18px', fontFamily: 'Segoe UI, Arial, sans-serif',
        color: '#ffffff', align: 'center',
      }).setOrigin(0.5);
    this.time.delayedCall(2500, () => msg.destroy());
  }

  // ─── Footer ─────────────────────────────────────────────

  _drawFooter(W, H) {
    const progress = this.registry.get('progress') || {};
    const unlocked = (progress.unlockedLevels || [1]).length;
    const totalLevels = AJ.LEVELS.length;

    this.add.text(W / 2, H - 50, `레벨 ${unlocked}/${totalLevels} 해금됨`, {
      fontSize: '13px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#555577',
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 28, '형용사 순서: 의견 → 크기 → 나이 → 모양 → 색깔 → 출신 → 재료 → 용도', {
      fontSize: '9px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#333355',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
  }

  // ─── Entrance animation ─────────────────────────────────

  _animateEntrance() {
    this.cameras.main.fadeIn(400);
  }
};
