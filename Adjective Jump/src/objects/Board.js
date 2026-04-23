// ============================================================
// BOARD — manages the grid of tiles and phrase state
// ============================================================
window.AJ = window.AJ || {};

AJ.Board = class Board {
  constructor(scene, centerX, centerY, levelConfig) {
    this.scene    = scene;
    this.cx       = centerX;
    this.cy       = centerY;
    this.config   = levelConfig;
    this.tiles    = [];
    this.phrases  = [];   // { adjTiles[], nounTile, mistakes, selectedCount, state }
    this.powerupTiles = [];
    this.currentIdx = 0;
    this.complete   = false;

    // Derived tile size
    const gap = 7;
    const available = Math.min(340, scene.scale.width - 40);
    this.tileSize = Math.min(80, Math.floor((available - (levelConfig.gridCols - 1) * gap) / levelConfig.gridCols));
    this.gap = gap;
  }

  // ─── Build ──────────────────────────────────────────────

  buildFromPhrases(phraseDataArray) {
    const { gridCols, gridRows, powerupCount } = this.config;
    const tileConfigs = [];

    phraseDataArray.forEach((phrase, pIdx) => {
      phrase.adjectives.forEach((adj, aIdx) => {
        tileConfigs.push({
          word: adj.word,
          category: adj.category,
          kr: adj.kr,
          tileType: 'adjective',
          phraseIndex: pIdx,
          adjIndex: aIdx,
        });
      });
      tileConfigs.push({
        word: phrase.noun.emoji || phrase.noun.word,
        nounEmoji: phrase.noun.emoji,
        nounWord: phrase.noun.word,
        category: 'noun',
        tileType: 'noun',
        phraseIndex: pIdx,
      });
    });

    // Power-up tiles
    const puTypes = ['time', 'shield', 'hint', 'repair', 'double'];
    for (let i = 0; i < (powerupCount || 0); i++) {
      const pType = puTypes[i % puTypes.length];
      const icons = { time: '⏱', shield: '🛡', hint: '💡', repair: '🔧', double: '⭐' };
      tileConfigs.push({
        word: icons[pType],
        category: 'powerup',
        tileType: 'powerup',
        powerupType: pType,
        phraseIndex: -1,
      });
    }

    // Place on grid
    const positions = this._gridPositions(gridCols, gridRows);
    Phaser.Utils.Array.Shuffle(tileConfigs);

    tileConfigs.forEach((cfg, i) => {
      const pos = positions[i] || positions[positions.length - 1];
      const tile = new AJ.Tile(this.scene, pos.x, pos.y, cfg, this.tileSize);
      tile.setDepth(5);

      if (cfg.tileType === 'powerup') {
        tile.setTileState('inactive');
        this.powerupTiles.push(tile);
      } else {
        tile.deactivate();
      }

      this.tiles.push(tile);
    });

    // Build phrase objects with tile references
    this.phrases = phraseDataArray.map((pd, pIdx) => {
      const adjTiles = this.tiles
        .filter(t => t.phraseIndex === pIdx && t.tileType === 'adjective')
        .sort((a, b) => a.adjIndex - b.adjIndex);
      const nounTile = this.tiles.find(t => t.phraseIndex === pIdx && t.tileType === 'noun');
      return {
        data: pd,
        adjTiles,
        nounTile,
        mistakes: 0,
        selectedCount: 0,
        state: 'waiting',
      };
    });

    // Register powerup clicks (handled independently of phrase logic)
    this.powerupTiles.forEach(t => {
      t.on('pointerdown', () => this.scene.events.emit('powerupTapped', t.powerupType));
      t.disableInteractive(); // enabled between phrases
    });
  }

  // ─── Phrase Activation ──────────────────────────────────

  activatePhrase(idx, animate = false) {
    this.currentIdx = idx;
    const phrase = this.phrases[idx];
    if (!phrase) return;
    phrase.state = 'active';
    phrase.mistakes = 0;
    phrase.selectedCount = 0;

    this.tiles.forEach(t => {
      if (t.phraseIndex === idx && t.tileType !== 'powerup') {
        if (animate) t.revealActive();
        else t.activate();
      } else if (t.state !== 'completed') {
        t.deactivate();
      }
    });
  }

  getCurrentPhrase() { return this.phrases[this.currentIdx]; }

  // ─── Tap Handling ───────────────────────────────────────

  /**
   * Returns: { result: 'correct'|'wrong'|'phraseComplete'|'ignore', phraseComplete, allComplete, ... }
   */
  handleTap(tile) {
    if (this.complete) return { result: 'ignore' };

    // Power-up tiles are handled separately via events
    if (tile.tileType === 'powerup') return { result: 'ignore' };

    // Ignore taps on non-current-phrase tiles
    if (tile.phraseIndex !== this.currentIdx) return { result: 'ignore' };

    const phrase = this.getCurrentPhrase();
    if (!phrase || phrase.state !== 'active') return { result: 'ignore' };

    const { adjTiles, nounTile, selectedCount } = phrase;

    // Tapping noun before all adj are done
    if (tile === nounTile && selectedCount < adjTiles.length) {
      return this._handleWrong(tile, phrase, 'noun_too_early');
    }

    // Tapping noun at the right time
    if (tile === nounTile && selectedCount === adjTiles.length) {
      return this._handleNoun(tile, phrase);
    }

    // Tapping an adj tile
    if (tile.tileType === 'adjective') {
      const expected = adjTiles[selectedCount];
      if (tile === expected) {
        return this._handleCorrectAdj(tile, phrase);
      } else {
        const expectedCat = expected.category;
        const tappedCat   = tile.category;
        return this._handleWrong(tile, phrase, 'wrong_order', { expectedCat, tappedCat });
      }
    }

    return { result: 'ignore' };
  }

  _handleCorrectAdj(tile, phrase) {
    tile.select(phrase.selectedCount);
    phrase.selectedCount++;
    const done = phrase.selectedCount === phrase.adjTiles.length;
    return {
      result: 'correct',
      tile,
      adjIndex: phrase.selectedCount - 1,
      allAdjDone: done,
    };
  }

  _handleNoun(tile, phrase) {
    tile.select(phrase.adjTiles.length);
    phrase.state = 'animating';

    // Mark all tiles completed (with stagger)
    const allPhraseTiles = [...phrase.adjTiles, phrase.nounTile];
    allPhraseTiles.forEach((t, i) => {
      this.scene.time.delayedCall(i * 60, () => {
        t.complete();
        t.popComplete();
      });
    });

    const isLast = this.currentIdx >= this.phrases.length - 1;
    const wasAllComplete = isLast;

    this.scene.time.delayedCall(allPhraseTiles.length * 60 + 100, () => {
      phrase.state = 'complete';
      if (isLast) {
        this.complete = true;
        this.scene.events.emit('allPhrasesComplete');
      } else {
        this._offerPowerups(() => {
          this.currentIdx++;
          this.activatePhrase(this.currentIdx, true);
          this.scene.events.emit('phraseActivated', this.currentIdx);
        });
      }
    });

    return { result: 'phraseComplete', phraseIndex: this.currentIdx, isLast };
  }

  _handleWrong(tile, phrase, reason, extra = {}) {
    phrase.mistakes++;

    if (phrase.mistakes >= 2) {
      // Second mistake: break + reset
      tile.showBroken(() => {
        this._resetPhrase(phrase);
        this.scene.events.emit('phraseBroken', { phraseIndex: this.currentIdx });
      });
      return { result: 'wrong', tile, reason, fatal: true, mistakes: phrase.mistakes, ...extra };
    }

    // First mistake: crack
    tile.crack();
    tile.flashWrong();
    return { result: 'wrong', tile, reason, fatal: false, mistakes: phrase.mistakes, ...extra };
  }

  _resetPhrase(phrase) {
    phrase.mistakes     = 0;
    phrase.selectedCount = 0;
    phrase.state        = 'active';
    // Reset adj tiles that were selected back to active
    phrase.adjTiles.forEach(t => {
      if (t.state !== 'completed') t.activate();
    });
    if (phrase.nounTile.state !== 'completed') phrase.nounTile.activate();
  }

  // ─── Power-up window ────────────────────────────────────

  _offerPowerups(callback) {
    if (this.powerupTiles.length === 0) { callback(); return; }

    // Light up power-up tiles briefly
    this.powerupTiles.forEach(t => {
      if (t.state !== 'completed') {
        t.setTileState('powerup');
        t.setInteractive();
      }
    });

    // Close window after 2.5 seconds
    this.scene.time.delayedCall(2500, () => {
      this.powerupTiles.forEach(t => {
        if (t.state !== 'completed') {
          t.deactivate();
          t.disableInteractive();
        }
      });
      callback();
    });
  }

  collectPowerup(tile) {
    tile.setTileState('completed');
    tile.disableInteractive();
  }

  // ─── Door Animation (final phrase) ──────────────────────

  playDoorAnimation(nounTile) {
    const scene = this.scene;
    // Sparkle around the noun tile
    const particles = scene.add.particles(nounTile.x, nounTile.y, '__DEFAULT', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      quantity: 2,
      frequency: 30,
      tint: [0xffd93d, 0xff6b9d, 0x4ecdc4],
      emitting: true,
    });

    scene.tweens.add({
      targets: nounTile,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 400,
      ease: 'Back.Out',
      yoyo: false,
    });

    scene.time.delayedCall(1200, () => {
      if (particles && particles.active) particles.destroy();
    });
  }

  // ─── Grid Layout ────────────────────────────────────────

  _gridPositions(cols, rows) {
    const { tileSize: ts, gap } = this;
    const totalW = cols * ts + (cols - 1) * gap;
    const totalH = rows * ts + (rows - 1) * gap;
    const sx = this.cx - totalW / 2 + ts / 2;
    const sy = this.cy - totalH / 2 + ts / 2;

    const positions = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({ x: sx + c * (ts + gap), y: sy + r * (ts + gap) });
      }
    }
    return positions;
  }

  getBoardBounds() {
    const { gridCols, gridRows } = this.config;
    const { tileSize: ts, gap } = this;
    const w = gridCols * ts + (gridCols - 1) * gap;
    const h = gridRows * ts + (gridRows - 1) * gap;
    return { x: this.cx - w / 2, y: this.cy - h / 2, width: w, height: h };
  }

  destroy() {
    this.tiles.forEach(t => t.destroy());
    this.tiles = [];
  }
};
