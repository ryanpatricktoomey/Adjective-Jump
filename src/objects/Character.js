// ============================================================
// CHARACTER — the player avatar that jumps between tiles
// REPLACE ASSET: Change this.bodyText to a Phaser sprite.
//   In BootScene.preload():  this.load.image('character', 'assets/character.png')
//   In constructor:          this.body = scene.add.image(0,0,'character').setScale(0.5)
// ============================================================
window.AJ = window.AJ || {};

AJ.Character = class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.baseX = x;
    this.baseY = y;

    // ── Placeholder art: emoji-based character ──
    // Shadow
    this.shadow = scene.add.ellipse(0, 22, 36, 10, 0x000000, 0.3);

    // Body
    this.bodyText = scene.add.text(0, 0, '🐸', {
      fontSize: '40px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
    }).setOrigin(0.5);

    // Streak fire indicator (hidden by default)
    this.fireText = scene.add.text(16, -20, '', {
      fontSize: '16px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
    }).setOrigin(0.5).setVisible(false);

    this.add([this.shadow, this.bodyText, this.fireText]);

    this.setDepth(20);
    scene.add.existing(this);

    this._jumpTween   = null;
    this._idleTween   = null;
    this._streakLevel = 0;
    this._startIdle();
  }

  // ─── Movement ───────────────────────────────────────────

  jumpTo(tx, ty, onArrive) {
    if (this._jumpTween) { this._jumpTween.stop(); }
    if (this._idleTween) { this._idleTween.stop(); this._idleTween = null; }
    this.shadow.setAlpha(0);

    const startX = this.x;
    const startY = this.y;

    this.setScale(1.1, 0.9); // squash at launch

    // Animate only x; manually compute y with arc in onUpdate
    this._jumpTween = this.scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 260,
      ease: 'Power2',
      onUpdate: (tween, target) => {
        const p   = target.t;
        const arc = Math.sin(p * Math.PI) * 55;
        this.x    = Phaser.Math.Linear(startX, tx, p);
        this.y    = Phaser.Math.Linear(startY, ty, p) - arc;
      },
      onComplete: () => {
        this.x = tx; this.y = ty;
        this.setScale(0.9, 1.1); // squash on land
        this.scene.tweens.add({
          targets: this,
          scaleX: 1, scaleY: 1,
          duration: 100,
          ease: 'Back.Out',
          onComplete: () => {
            this.shadow.setAlpha(0.3);
            this._startIdle();
            if (onArrive) onArrive();
          },
        });
      },
    });
  }

  fall(onDone) {
    if (this._idleTween) this._idleTween.stop();
    if (this._jumpTween) this._jumpTween.stop();

    this.scene.tweens.add({
      targets: this,
      y: this.y + 120,
      alpha: 0,
      angle: Phaser.Math.Between(-40, 40),
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.setPosition(this.baseX, this.baseY);
        this.setAlpha(0);
        this.setAngle(0);
        this.setScale(1);
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          y: this.baseY - 30,
          duration: 300,
          ease: 'Back.Out',
          onComplete: () => {
            this.setPosition(this.baseX, this.baseY);
            this.shadow.setAlpha(0.3);
            this._startIdle();
            if (onDone) onDone();
          },
        });
      },
    });
  }

  /** Celebrate in place on the current tile. Does NOT teleport to base. */
  celebrate(onDone) {
    if (this._idleTween) { this._idleTween.stop(); this._idleTween = null; }
    const startY = this.y;
    this.scene.tweens.add({
      targets: this,
      y: startY - 22,
      duration: 170,
      yoyo: true,
      repeat: 1,       // 2 bounces = ~680ms total, snappy and satisfying
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.y = startY;  // snap back to exact tile y (no drift)
        this._startIdle();
        if (onDone) onDone();
      },
    });
  }

  returnToBase(onDone) {
    this.scene.tweens.add({
      targets: this,
      x: this.baseX,
      y: this.baseY,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        this._startIdle();
        if (onDone) onDone();
      },
    });
  }

  // ─── Streak Visual ──────────────────────────────────────

  setStreakLevel(level) {
    this._streakLevel = level;
    if (level >= 7) {
      this.fireText.setText('🔥').setVisible(true);
    } else if (level >= 4) {
      this.fireText.setText('✨').setVisible(true);
    } else {
      this.fireText.setVisible(false);
    }
  }

  // ─── Idle bob ───────────────────────────────────────────

  _startIdle() {
    if (this._idleTween) return;
    this._idleTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  destroy() {
    if (this._idleTween) this._idleTween.stop();
    if (this._jumpTween) this._jumpTween.stop();
    super.destroy();
  }
};
