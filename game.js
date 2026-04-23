// ============================================================
// GAME ENTRY POINT
// Phaser 3 configuration and scene registration.
// To change screen dimensions: edit width/height below.
// ============================================================

const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#0d0d1a',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    AJ.BootScene,
    AJ.MenuScene,
    AJ.GameScene,
    AJ.UIScene,
    AJ.LevelCompleteScene,
    AJ.GameOverScene,
  ],
  dom: {
    createContainer: false,
  },
  // Disable Phaser's default banner to keep console clean
  banner: false,
};

window.game = new Phaser.Game(config);

// Unlock audio on first interaction (iOS requirement)
document.addEventListener('touchstart', () => {
  if (AJ.audio.ctx && AJ.audio.ctx.state === 'suspended') {
    AJ.audio.ctx.resume();
  }
}, { once: true });

document.addEventListener('pointerdown', () => {
  if (AJ.audio.ctx && AJ.audio.ctx.state === 'suspended') {
    AJ.audio.ctx.resume();
  }
}, { once: true });
