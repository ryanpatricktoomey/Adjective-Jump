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
    this.phrases  = [];
    this.powerupTiles = [];
    this.currentIdx = 0;
    this.complete   = false;

    const gap       = 7;
    const available = Math.min(340, scene.scale.width - 40);
    this.tileSize   = Math.min(80, Math.floor((available - (levelConfig.gridCols - 1) * gap) / levelConfig.gridCols));
    this.gap        = gap;
  }

  // ─── Build ──────────────────────────────────────────────

  buildFromPhrases(phraseDataArray) {
    const { gridCols, powerupCount } = this.config;
    let   { gridRows }               = this.config;

    const tileConfigs = [];

    phraseDataArray.forEach((phrase, pIdx) => {
      phrase.adjectives.forEach((adj, aIdx) => {
        tileConfigs.push({
          word: adj.word, category: adj.category, kr: adj.kr,
          tileType: 'adjective', phraseIndex: pIdx, adjIndex: aIdx,
        });
      });
      tileConfigs.push({
        word:     phrase.noun.emoji || phrase.noun.word,
        nounEmoji: phrase.noun.emoji,
        nounWord:  phrase.noun.word,
        category: 'noun', tileType: 'noun', phraseIndex: pIdx,
      });
    });

    const puIcons = { time: '⏱', shield: '🛡', hint: '💡', repair: '🔧', double: '⭐' };
    const puTypes = ['time', 'shield', 'hint', 'repair', 'double'];
    for (let i = 0; i < (powerupCount || 0); i++) {
      const pType = puTypes[i % puTypes.length];
      tileConfigs.push({
        word: puIcons[pType], category: 'powerup',
        tileType: 'powerup', powerupType: pType, phraseIndex: -1,
      });
    }

    // ── Grid validation / auto-expand ───────────────────
    const required = tileConfigs.length;
    let   capacity = gridCols * gridRows;
    if (required > capacity) {
      gridRows = Math.ceil(required / gridCols);
      this.config.gridRows = gridRows;
      capacity = gridCols * gridRows;
      if (typeof DEV !== 'undefined') {
        console.warn(`[Board] Grid too small for ${required} tiles. Auto-expanded to ${gridCols}×${gridRows}.`);
      }
    }

    // ── Shuffle and place ────────────────────────────────
    const positions = this._gridPositions(gridCols, gridRows);
    Phaser.Utils.Array.Shuffle(tileConfigs);

    tileConfigs.forEach((cfg, i) => {
      const pos  = positions[i]; // validated: i < capacity
      const tile = new AJ.Tile(this.scene, pos.x, pos.y, cfg, this.tileSize);
      tile.setDepth(5);

      if (cfg.tileType === 'powerup') {
        tile.setTileState('inactive');
        // Guard against re-collection; emit tile reference so GameScene can mark it consumed
        tile.on('pointerdown', () => {
          if (tile.state === 'completed') return;
          this.scene.events.emit('powerupTapped', { type: tile.powerupType, tile });
        });
        tile.disableInteractive();
        this.powerupTiles.push(tile);
      } else {
        tile.deactivate();
      }

      this.tiles.push(tile);
    });

    // ── Build phrase objects ─────────────────────────────
    this.phrases = phraseDataArray.map((pd, pIdx) => {
      const adjTiles = this.tiles
        .filter(t => t.phraseIndex === pIdx && t.tileType === 'adjective')
        .sort((a, b) => a.adjIndex - b.adjIndex);
      const nounTile = this.tiles.find(t => t.phraseIndex === pIdx && t.tileType === 'noun');
      return {
        data: pd,
        adjTiles,
        nounTile,
        mistakes:     0,
        selectedCount: 0,
        hadMistake:   false,  // true = phrase cannot count as perfect
        state:        'waiting',
      };
    });
  }

  // ─── Phrase Activation ──────────────────────────────────

  activatePhrase(idx, animate = false) {
    this.currentIdx = idx;
    const phrase = this.phrases[idx];
    if (!phrase) return;
    phrase.state         = 'active';
    phrase.mistakes      = 0;
    phrase.selectedCount = 0;
    // hadMistake intentionally NOT reset — a fall makes the phrase permanently non-perfect

    this.tiles.forEach(t => {
      if (t.phraseIndex === idx && t.tileType !== 'powerup') {
        if (animate) t.revealActive();
        else         t.activate();
      } else if (t.state !== 'completed') {
        t.deactivate();
      }
    });
  }

  /** Public: activate the next phrase after current completes. */
  activateNextPhrase(animate = true) {
    this.currentIdx++;
    this.activatePhrase(this.currentIdx, animate);
  }

  getCurrentPhrase() { return this.phrases[this.currentIdx]; }

  // ─── Power-up Window (public) ───────────────────────────

  /**
   * Light up available power-up tiles for 2.5 s then call callback.
   * Timer pause/resume is handled by GameScene around this call.
   */
  offerPowerups(callback) {
    const available = this.powerupTiles.filter(t => t.state !== 'completed');
    if (available.length === 0) { callback(); return; }

    available.forEach(t => {
      t.setTileState('powerup');
      t.setInteractive();
    });

    this._puWindowTimer = this.scene.time.delayedCall(2500, () => {
      available.forEach(t => {
        if (t.state !== 'completed') {
          t.deactivate();
          t.disableInteractive();
        }
      });
      callback();
    });
  }

  /** Mark a power-up tile as consumed. */
  collectPowerup(tile) {
    tile.setTileState('completed');
    tile.disableInteractive();
    // Cancel the open power-up window if still running — callback fires after window anyway
    // (don't cancel the timer since other tiles may still be available)
  }

  // ─── Tap Handling ───────────────────────────────────────

  /**
   * Returns: { result: 'correct'|'wrong'|'phraseComplete'|'ignore', ... }
   * Note: does NOT apply shield logic — GameScene pre-checks shield before this call.
   */
  handleTap(tile) {
    if (this.complete)                 return { result: 'ignore' };
    if (tile.tileType === 'powerup')   return { result: 'ignore' };
    if (tile.phraseIndex !== this.currentIdx) return { result: 'ignore' };

    const phrase = this.getCurrentPhrase();
    if (!phrase || phrase.state !== 'active') return { result: 'ignore' };

    const { adjTiles, nounTile, selectedCount } = phrase;

    if (tile === nounTile && selectedCount < adjTiles.length) {
      return this._handleWrong(tile, phrase, 'noun_too_early', {});
    }

    if (tile === nounTile && selectedCount === adjTiles.length) {
      return this._handleNoun(tile, phrase);
    }

    if (tile.tileType === 'adjective') {
      const expected = adjTiles[selectedCount];
      if (tile === expected) {
        return this._handleCorrectAdj(tile, phrase);
      }
      return this._handleWrong(tile, phrase, 'wrong_order', {
        tappedCat:   tile.category,
        expectedCat: expected.category,
      });
    }

    return { result: 'ignore' };
  }

  _handleCorrectAdj(tile, phrase) {
    tile.select(phrase.selectedCount);
    phrase.selectedCount++;
    return {
      result:     'correct',
      tile,
      adjIndex:   phrase.selectedCount - 1,
      allAdjDone: phrase.selectedCount === phrase.adjTiles.length,
    };
  }

  _handleNoun(tile, phrase) {
    tile.select(phrase.adjTiles.length);
    phrase.state = 'animating';

    const allPhraseTiles = [...phrase.adjTiles, phrase.nounTile];
    allPhraseTiles.forEach((t, i) => {
      this.scene.time.delayedCall(i * 60, () => {
        t.complete();
        t.popComplete();
      });
    });

    const isLast   = this.currentIdx >= this.phrases.length - 1;
    const perfect  = !phrase.hadMistake;
    const adjCount = phrase.adjTiles.length;

    // phrase.state is set to 'complete' after tile animations
    this.scene.time.delayedCall(allPhraseTiles.length * 60 + 80, () => {
      phrase.state = 'complete';
      if (isLast) this.complete = true;
    });

    // GameScene controls all subsequent sequencing (character animation, power-up window, next phrase)
    return {
      result:     'phraseComplete',
      phraseIndex: this.currentIdx,
      isLast,
      nounTile:   tile,
      perfect,
      adjCount,
    };
  }

  _handleWrong(tile, phrase, reason, extra) {
    phrase.hadMistake = true;  // phrase is no longer eligible to be perfect
    phrase.mistakes++;

    if (phrase.mistakes >= 2) {
      // Second mistake: break animation, then emit phraseBroken so GameScene can reset
      tile.showBroken(() => {
        this._resetPhrase(phrase);
        this.scene.events.emit('phraseBroken', { phraseIndex: this.currentIdx });
      });
      return { result: 'wrong', tile, reason, fatal: true, mistakes: phrase.mistakes, ...extra };
    }

    tile.crack();
    tile.flashWrong();
    return { result: 'wrong', tile, reason, fatal: false, mistakes: phrase.mistakes, ...extra };
  }

  _resetPhrase(phrase) {
    phrase.mistakes      = 0;
    phrase.selectedCount = 0;
    phrase.state         = 'active';
    // hadMistake NOT reset: a fall = phrase was not perfect, period.
    phrase.adjTiles.forEach(t => {
      if (t.state !== 'completed') t.activate();
    });
    if (phrase.nounTile.state !== 'completed') phrase.nounTile.activate();
  }

  // ─── Door Animation (final phrase) ──────────────────────

  playDoorAnimation(nounTile) {
    try {
      const p = this.scene.add.particles(nounTile.x, nounTile.y, '__DEFAULT', {
        speed:     { min: 50, max: 160 },
        scale:     { start: 0.6, end: 0 },
        lifespan:  600,
        quantity:  2,
        frequency: 30,
        tint:      [0xffd93d, 0xff6b9d, 0x4ecdc4],
        emitting:  true,
      });
      this.scene.tweens.add({
        targets: nounTile, scaleX: 1.4, scaleY: 1.4,
        duration: 400, ease: 'Back.Out',
      });
      this.scene.time.delayedCall(1200, () => { if (p?.active) p.destroy(); });
    } catch (e) {}
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
    if (this._puWindowTimer) this._puWindowTimer.remove(false);
    this.tiles.forEach(t => { try { t.destroy(); } catch (e) {} });
    this.tiles = [];
  }
};
