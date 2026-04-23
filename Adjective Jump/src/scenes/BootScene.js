// ============================================================
// BOOT SCENE — first scene, generates textures and moves on
// To preload real assets: add this.load.image() calls here.
// ============================================================
window.AJ = window.AJ || {};

AJ.BootScene = class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // ── Add real asset loads here in the future ──
    // this.load.image('character', 'assets/character.png');
    // this.load.audio('bgm', 'assets/bgm.mp3');

    // Progress bar
    const W = this.scale.width;
    const H = this.scale.height;
    const bar = this.add.graphics();

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x4ecdc4, 1);
      bar.fillRoundedRect(W / 2 - 100, H / 2, 200 * v, 12, 6);
    });

    this.load.on('complete', () => bar.destroy());
  }

  create() {
    // Generate a white 1×1 pixel texture (used as particle default)
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('__DEFAULT', 4, 4);
    g.destroy();

    // Persist progress data across scenes via registry
    this.registry.set('progress', {
      unlockedLevels: [1],
      highScores: {},
      currentLevel: 1,
      missedPatterns: [],
    });

    // Load saved progress from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('aj_progress') || 'null');
      if (saved) this.registry.set('progress', saved);
    } catch (e) {}

    this.scene.start('MenuScene');
  }
};
