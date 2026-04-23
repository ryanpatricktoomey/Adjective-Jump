// ============================================================
// TILE — a single grid tile (adjective, noun, or power-up)
// To replace visuals: edit the draw*() methods.
// The SIZE constant controls tile dimensions.
// ============================================================
window.AJ = window.AJ || {};

AJ.Tile = class Tile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config, size) {
    super(scene, x, y);

    this.word       = config.word;
    this.category   = config.category;      // 'size','color','opinion'... or 'noun' or 'powerup'
    this.tileType   = config.tileType;      // 'adjective' | 'noun' | 'powerup'
    this.phraseIndex = config.phraseIndex;
    this.adjIndex   = config.adjIndex ?? -1;
    this.powerupType = config.powerupType ?? null;
    this.nounEmoji  = config.nounEmoji ?? null;
    this.nounWord   = config.nounWord ?? null;  // English word for noun badge
    this.kr         = config.kr ?? '';
    this.SIZE       = size || 78;
    this.state      = 'inactive';

    this._pulseTween = null;
    this._glowAlpha  = 0;

    // Visual layers
    this.bgGfx     = scene.add.graphics();
    this.glowGfx   = scene.add.graphics();
    this.crackGfx  = scene.add.graphics();
    this.topGfx    = scene.add.graphics();  // category badge

    // Main word text
    this.wordText  = scene.add.text(0, this.tileType === 'noun' ? -4 : 2,
      this.tileType === 'noun' ? (this.nounEmoji || '?') : this.word,
      {
        fontSize: this.tileType === 'noun' ? '28px' : this._wordFontSize(),
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5);

    // Category badge (small label at bottom)
    const badgeLabel = this.tileType === 'noun'
      ? (this.nounWord || this.word)          // show English noun word
      : (AJ.CATEGORY_LABELS[this.category] || this.category);
    this.catText = scene.add.text(0, this.SIZE / 2 - 11, badgeLabel, {
      fontSize: '9px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.7,
      align: 'center',
    }).setOrigin(0.5);

    // Number badge (shows adj order within phrase after selection)
    this.numBadge = scene.add.text(this.SIZE / 2 - 8, -this.SIZE / 2 + 8, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#fff',
    }).setOrigin(0.5).setVisible(false);

    this.add([this.glowGfx, this.bgGfx, this.crackGfx, this.topGfx,
              this.wordText, this.catText, this.numBadge]);

    // Hit area
    this.setSize(this.SIZE, this.SIZE);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this.SIZE / 2, -this.SIZE / 2, this.SIZE, this.SIZE),
      Phaser.Geom.Rectangle.Contains
    );

    scene.add.existing(this);
    this._drawState();
  }

  // ─── State API ──────────────────────────────────────────

  setTileState(state, opts = {}) {
    this.state = state;
    this._stopPulse();
    this._drawState(opts);
  }

  // Convenience setters
  activate()   { this.setTileState('active');    }
  deactivate() { this.setTileState('inactive');  }
  select(idx)  { this.setTileState('selected', { idx }); }
  crack()      { this.setTileState('cracked');   }
  complete()   { this.setTileState('completed'); }

  showBroken(onDone) {
    this.state = 'broken';
    this._stopPulse();
    this.scene.tweens.add({
      targets: this,
      y: this.y + 60,
      alpha: 0,
      angle: Phaser.Math.Between(-30, 30),
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        this.setPosition(this.x, this.y - 60);
        this.setAlpha(1);
        this.setAngle(0);
        this.activate();
        if (onDone) onDone();
      },
    });
  }

  flashWrong() {
    this.scene.tweens.add({
      targets: this,
      x: this.x - 6,
      duration: 40,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
    });
  }

  popComplete() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 100,
      yoyo: true,
      ease: 'Back.Out',
    });
  }

  revealActive() {
    this.setAlpha(0);
    this.setTileState('active');
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.Out',
      delay: Math.random() * 120,
    });
  }

  // ─── Drawing ────────────────────────────────────────────

  _drawState(opts = {}) {
    switch (this.state) {
      case 'inactive':  this._drawInactive();        break;
      case 'active':    this._drawActive();           break;
      case 'selected':  this._drawSelected(opts.idx); break;
      case 'cracked':   this._drawCracked();          break;
      case 'completed': this._drawCompleted();        break;
      case 'powerup':   this._drawPowerup();          break;
    }
  }

  _drawInactive() {
    this.glowGfx.clear();
    this.crackGfx.clear();
    this.topGfx.clear();
    const s = this.SIZE;
    this.bgGfx.clear();
    this.bgGfx.fillStyle(0x1a1a3a, 1);
    this.bgGfx.fillRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.bgGfx.lineStyle(1, 0x2a2a5a, 0.8);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.wordText.setAlpha(0.25);
    this.catText.setAlpha(0.15);
    this.numBadge.setVisible(false);
    this.setAlpha(1);
  }

  _drawActive() {
    const col = this.tileType === 'noun'
      ? AJ.CATEGORY_COLORS.noun
      : (AJ.CATEGORY_COLORS[this.category] || 0x4ecdc4);
    const s = this.SIZE;

    // Glow halo
    this.glowGfx.clear();
    for (let i = 4; i >= 1; i--) {
      this.glowGfx.fillStyle(col, 0.06 * i);
      this.glowGfx.fillRoundedRect(-s / 2 - i * 4, -s / 2 - i * 4, s + i * 8, s + i * 8, 12 + i * 2);
    }

    this.bgGfx.clear();
    this.bgGfx.fillStyle(0x0d0d24, 1);
    this.bgGfx.fillRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.bgGfx.lineStyle(2.5, col, 1);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);

    // Top color bar
    this.topGfx.clear();
    this.topGfx.fillStyle(col, 0.9);
    this.topGfx.fillRoundedRect(-s / 2 + 4, -s / 2 + 4, s - 8, 5, 3);

    this.crackGfx.clear();
    this.wordText.setAlpha(1);
    this.catText.setAlpha(0.8);
    this.numBadge.setVisible(false);

    // Pulse
    this._startPulse();

    if (this.tileType === 'noun') {
      this.catText.setText(this.nounWord || this.word);
    }
  }

  _drawSelected(idx) {
    const col = 0x6bcb77;
    const s   = this.SIZE;

    this.glowGfx.clear();
    for (let i = 3; i >= 1; i--) {
      this.glowGfx.fillStyle(col, 0.07 * i);
      this.glowGfx.fillRoundedRect(-s / 2 - i * 3, -s / 2 - i * 3, s + i * 6, s + i * 6, 12 + i * 2);
    }

    this.bgGfx.clear();
    this.bgGfx.fillStyle(0x1a3d2a, 1);
    this.bgGfx.fillRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.bgGfx.lineStyle(2.5, col, 1);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);

    this.topGfx.clear();
    this.topGfx.fillStyle(col, 0.9);
    this.topGfx.fillRoundedRect(-s / 2 + 4, -s / 2 + 4, s - 8, 5, 3);

    this.crackGfx.clear();
    this.wordText.setAlpha(1);
    this.catText.setAlpha(0.6);

    if (idx !== undefined) {
      this.numBadge.setText(`${idx + 1}`).setVisible(true);
    }
  }

  _drawCracked() {
    this._drawActive();
    const s = this.SIZE;
    // Draw crack lines
    this.crackGfx.clear();
    this.crackGfx.lineStyle(2, 0xff4444, 0.9);
    this.crackGfx.beginPath();
    this.crackGfx.moveTo(-4, -s / 2 + 10);
    this.crackGfx.lineTo(2,  -s / 2 + 28);
    this.crackGfx.lineTo(-6, -s / 2 + 42);
    this.crackGfx.lineTo(4,  -s / 2 + 55);
    this.crackGfx.strokePath();
    this.crackGfx.beginPath();
    this.crackGfx.moveTo(2, -s / 2 + 28);
    this.crackGfx.lineTo(14, -s / 2 + 36);
    this.crackGfx.strokePath();
    this._stopPulse();
    // Red tint on border
    this.bgGfx.lineStyle(2.5, 0xff4444, 1);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);
  }

  _drawCompleted() {
    this._stopPulse();
    const col = 0x2d9c6a;
    const s   = this.SIZE;

    this.glowGfx.clear();
    this.bgGfx.clear();
    this.bgGfx.fillStyle(0x0d2a1f, 1);
    this.bgGfx.fillRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.bgGfx.lineStyle(1.5, col, 0.6);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);

    this.topGfx.clear();
    this.topGfx.fillStyle(col, 0.5);
    this.topGfx.fillRoundedRect(-s / 2 + 4, -s / 2 + 4, s - 8, 5, 3);

    this.crackGfx.clear();
    this.wordText.setAlpha(0.5);
    this.catText.setAlpha(0.3);
    this.numBadge.setVisible(false);
    this.disableInteractive();
  }

  _drawPowerup() {
    const col = AJ.CATEGORY_COLORS.powerup;
    const s   = this.SIZE;

    this.glowGfx.clear();
    for (let i = 4; i >= 1; i--) {
      this.glowGfx.fillStyle(col, 0.05 * i);
      this.glowGfx.fillRoundedRect(-s / 2 - i * 5, -s / 2 - i * 5, s + i * 10, s + i * 10, 14 + i * 2);
    }

    this.bgGfx.clear();
    this.bgGfx.fillStyle(0x2a2010, 1);
    this.bgGfx.fillRoundedRect(-s / 2, -s / 2, s, s, 10);
    this.bgGfx.lineStyle(2.5, col, 1);
    this.bgGfx.strokeRoundedRect(-s / 2, -s / 2, s, s, 10);

    this.topGfx.clear();
    this.topGfx.fillStyle(col, 0.9);
    this.topGfx.fillRoundedRect(-s / 2 + 4, -s / 2 + 4, s - 8, 5, 3);

    this.crackGfx.clear();
    this.wordText.setAlpha(1);
    this.catText.setAlpha(0.8);
    this._startPulse(1.08);
  }

  // ─── Pulse tween ────────────────────────────────────────

  _startPulse(maxScale = 1.04) {
    this._stopPulse();
    this._pulseTween = this.scene.tweens.add({
      targets: this,
      scaleX: maxScale,
      scaleY: maxScale,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _stopPulse() {
    if (this._pulseTween) {
      this._pulseTween.stop();
      this._pulseTween = null;
    }
    this.setScale(1);
  }

  // ─── Helpers ────────────────────────────────────────────

  _wordFontSize() {
    const len = this.word.length;
    if (len <= 4)  return '17px';
    if (len <= 7)  return '14px';
    if (len <= 10) return '12px';
    return '10px';
  }

  destroy() {
    this._stopPulse();
    super.destroy();
  }
};
