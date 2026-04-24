// ============================================================
// GAME SCENE — core gameplay loop
// ============================================================
window.AJ = window.AJ || {};

AJ.GameScene = class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ─── Lifecycle ──────────────────────────────────────────

  init(data) {
    this.levelConfig   = data.levelConfig;
    this.gameMode      = data.mode || 'adventure';
    this.endlessLevel  = data.endlessLevel || 1;
    this._animating    = false;
    this._fallingRecovery = false; // prevents _onPhraseBroken from calling returnToBase
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._drawBackground(W, H);

    this.scoreSystem = new AJ.ScoreSystem();

    if (this.levelConfig.newCategory) {
      this._showCategoryIntro(this.levelConfig.newCategory, () => this._setupGame(W, H));
    } else {
      this._setupGame(W, H);
    }
  }

  _setupGame(W, H) {
    // ── Generate phrases ───────────────────────────────
    const phrases = this.levelConfig._reviewPhrases
      || AJ.contentEngine.buildLevelPhrases(this.levelConfig);

    // ── Board ──────────────────────────────────────────
    const boardCenterY = H * 0.46;
    this.board = new AJ.Board(this, W / 2, boardCenterY, this.levelConfig);
    this.board.buildFromPhrases(phrases);

    // ── Character ──────────────────────────────────────
    const bounds    = this.board.getBoardBounds();
    const charBaseY = Math.min(bounds.y + bounds.height + 34, H - 110);
    this.character  = new AJ.Character(this, W / 2, charBaseY);

    // ── Events from Board ──────────────────────────────
    this.events.on('phraseBroken',  this._onPhraseBroken,  this);
    this.events.on('powerupTapped', this._onPowerupTapped,  this);

    // ── Tile tap via scene input ────────────────────────
    this._tapHandler = (_ptr, obj) => {
      if (obj instanceof AJ.Tile && !this._animating) {
        this._handleTileTap(obj);
      }
    };
    this.input.on('gameobjectdown', this._tapHandler);

    // ── Phrase progress bar ────────────────────────────
    this._buildPhraseBar(W, H);

    // ── Feedback label ─────────────────────────────────
    this.feedbackLabel = this.add.text(W / 2, bounds.y - 28, '', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ff6b6b',
      align: 'center',
      wordWrap: { width: W - 40 },
      backgroundColor: '#0d0d2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    // ── Launch UIScene as overlay ──────────────────────
    this.scene.launch('UIScene');
    const ui = this.scene.get('UIScene');
    const fwd = (ev) => this.events.on(ev, val => ui.events.emit(ev, val));
    ['scoreUpdate', 'timeUpdate', 'streakUpdate', 'levelName', 'livesUpdate'].forEach(fwd);

    // ── First phrase ───────────────────────────────────
    this.board.activatePhrase(0, true);
    this._updatePhraseBar();

    // Emit initial HUD values after UIScene has had a frame to register listeners
    this.time.delayedCall(50, () => {
      this.events.emit('levelName',    this.levelConfig.name);
      this.events.emit('timeUpdate',   this.levelConfig.timeLimit);
      this.events.emit('livesUpdate',  this.scoreSystem.lives);
      this._emitScore();
    });

    // ── Timer ──────────────────────────────────────────
    this.scoreSystem.startTimer(
      this.levelConfig.timeLimit,
      (t) => {
        this.events.emit('timeUpdate', t);
        if (t <= 10) AJ.audio.playTimerWarning();
      },
      () => this._triggerGameOver('time')
    );

    this.cameras.main.fadeIn(300);
  }

  // ─── Tile Tap ───────────────────────────────────────────

  _handleTileTap(tile) {
    // ── Shield pre-check (BEFORE board commits any damage) ──
    if (this._wouldTapBeWrong(tile) && this.scoreSystem.isShieldActive()) {
      this.scoreSystem.consumeShield();
      this._showFeedback('🛡 방어막이 실수를 막았어요!', '#c77dff', 1800);
      AJ.audio.playPowerup();
      return;
    }

    const result = this.board.handleTap(tile);
    if (result.result === 'ignore') return;

    // ── Correct adjective ──────────────────────────────
    if (result.result === 'correct') {
      const { points, streak } = this.scoreSystem.scoreCorrectTap();
      AJ.audio.playCorrect(streak);
      this._emitScore();
      this.character.jumpTo(tile.x, tile.y);
      this.character.setStreakLevel(streak);

      const streakMsg = AJ.EXPLANATIONS.streakMessages[streak];
      if (streakMsg) this._showFeedback(streakMsg, '#6bcb77');
      if (result.allAdjDone) this._showFeedback('✓ 이제 명사를 찾아요! 🎯', '#ffd93d', 1500);

      this._updatePhraseBar();
    }

    // ── Phrase complete ────────────────────────────────
    if (result.result === 'phraseComplete') {
      this._animating = true;
      this.scoreSystem.pauseTimer();

      const phrasePoints = this.scoreSystem.scorePhraseComplete(result.adjCount);
      const praise       = AJ.EXPLANATIONS.phraseComplete;
      this._showFeedback(
        `${praise[Math.floor(Math.random() * praise.length)]} +${phrasePoints}점`,
        '#6bcb77', 1200
      );
      AJ.audio.playPhraseComplete();
      this._emitScore();
      this._updatePhraseBar();

      // Board tile animations take (adjCount*60 + 100)ms
      // Character jump takes ~260ms. Wait the difference after landing.
      const boardAnimMs = result.adjCount * 60 + 100;
      const extraWait   = Math.max(0, boardAnimMs - 260);

      this.character.jumpTo(result.nounTile.x, result.nounTile.y, () => {
        this.time.delayedCall(extraWait, () => {
          this.character.celebrate(() => {
            this._afterPhraseComplete(result);
          });
        });
      });
    }

    // ── Wrong tap ─────────────────────────────────────
    if (result.result === 'wrong') {
      if (result.fatal) {
        AJ.audio.playBreak();
      } else {
        AJ.audio.playCrack();
      }

      this.scoreSystem.scoreMistake();
      this._emitScore();

      // Korean feedback
      let msg = '';
      if (result.reason === 'noun_too_early') {
        msg = AJ.EXPLANATIONS.nounTooEarly;
      } else if (result.reason === 'wrong_order') {
        msg = AJ.EXPLANATIONS.wrongOrder(result.tappedCat, result.expectedCat);
        AJ.contentEngine.recordMiss({
          tappedCat:   result.tappedCat,
          expectedCat: result.expectedCat,
          reason:      result.reason,
          categories:  this.levelConfig.categories,
          adjPerPhrase: this.levelConfig.adjPerPhrase,
        });
        this._saveProgress();
      } else {
        msg = AJ.EXPLANATIONS.mistakes[0];
      }
      this._showFeedback(msg, '#ff6b6b', 2200);

      if (result.fatal) {
        // Lose a life; character falls; Board will reset phrase and emit phraseBroken
        const livesLeft = this.scoreSystem.loseLife();
        this.events.emit('livesUpdate', livesLeft);

        this._fallingRecovery = true; // tell _onPhraseBroken to skip returnToBase
        this.character.fall(() => {
          this._fallingRecovery = false;
          if (livesLeft <= 0) {
            this._triggerGameOver('lives');
          }
          // Phrase already reset by Board; UI updated by _onPhraseBroken
        });
      }

      this._updatePhraseBar();
    }
  }

  // ─── Shield pre-check helper ────────────────────────────

  _wouldTapBeWrong(tile) {
    if (tile.tileType === 'powerup')            return false;
    if (tile.phraseIndex !== this.board.currentIdx) return false;
    const phrase = this.board.getCurrentPhrase();
    if (!phrase || phrase.state !== 'active')   return false;

    const { adjTiles, nounTile, selectedCount } = phrase;
    if (tile === nounTile)         return selectedCount < adjTiles.length;
    if (tile.tileType === 'adjective') return tile !== adjTiles[selectedCount];
    return false;
  }

  // ─── After phrase complete sequence ─────────────────────

  _afterPhraseComplete(result) {
    this._spawnPhraseParticles(result.nounTile.x, result.nounTile.y);

    // Perfect phrase chain check
    const chainResult = this.scoreSystem.recordPhraseResult(result.perfect);
    this._handleChainResult(chainResult);

    if (result.isLast) {
      // All phrases done — play door effect and go to level complete
      AJ.audio.playDoor();
      this.board.playDoorAnimation(result.nounTile);
      this.scoreSystem.stopTimer();
      this.time.delayedCall(1400, () => {
        const bonus = this.scoreSystem.scoreLevelComplete(this.scoreSystem.timeLeft);
        const total = this.scoreSystem.getSummary();
        this._saveProgress();
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          summary:      total,
          levelConfig:  this.levelConfig,
          mode:         this.gameMode,
          endlessLevel: this.endlessLevel,
        });
      });
      return;
    }

    // Power-up window (timer already paused), then next phrase
    this.board.offerPowerups(() => {
      this.scoreSystem.resumeTimer();
      this.board.activateNextPhrase(true);
      this.events.emit('phraseActivated', this.board.currentIdx);
      this._updatePhraseBar();
      this._animating = false;
    });
  }

  _handleChainResult(chainResult) {
    if (!chainResult) return;
    if (chainResult.lifeGained) {
      this.events.emit('livesUpdate', this.scoreSystem.lives);
      this._showFeedback('💚 퍼펙트 3연속! 하트 +1!', '#6bcb77', 2200);
      AJ.audio.playPowerup();
    } else if (chainResult.atMax) {
      // Already at max lives — give time bonus instead
      this.scoreSystem.addTime(5);
      this._showFeedback('💚 퍼펙트 3연속! +5초 보너스!', '#6bcb77', 2200);
      AJ.audio.playPowerup();
    } else if (chainResult.chainCount === 2) {
      this._showFeedback('✨ 퍼펙트 2연속! 한 번 더!', '#c77dff', 1500);
    }
    // chainCount === 1 is intentionally silent (no noise on first perfect)
  }

  // ─── Board Events ───────────────────────────────────────

  _onPhraseBroken() {
    this._updatePhraseBar();
    this._emitScore();
    // Character.fall() called it already handles animation.
    // Only call returnToBase if we are NOT in the falling recovery path.
    if (!this._fallingRecovery) {
      this.character.returnToBase();
    }
  }

  _onPowerupTapped({ type, tile }) {
    // Mark consumed immediately (prevents re-collection)
    this.board.collectPowerup(tile);
    AJ.audio.playPowerup();

    const msg = AJ.EXPLANATIONS.powerups[type] || '';
    this._showFeedback(msg, '#f9c74f', 1500);

    switch (type) {
      case 'time':
        this.scoreSystem.addTime(10);
        break;
      case 'shield':
        this.scoreSystem.activateShield();
        break;
      case 'double':
        this.scoreSystem.activateDouble();
        break;
      case 'hint':
        this._activateHint();
        break;
      case 'repair':
        this._repairCracked();
        break;
    }
    this._emitScore();
  }

  _activateHint() {
    const phrase = this.board.getCurrentPhrase();
    if (!phrase) return;
    const next = phrase.adjTiles[phrase.selectedCount];
    if (next) {
      this.tweens.add({ targets: next, scaleX: 1.35, scaleY: 1.35, duration: 180, yoyo: true, repeat: 2 });
    }
  }

  _repairCracked() {
    const phrase = this.board.getCurrentPhrase();
    if (!phrase || phrase.state !== 'active') return;
    // Reset mistake count AND restore tile visuals
    phrase.mistakes = 0;
    phrase.adjTiles.forEach(t => {
      if (t.state === 'cracked') t.activate();
    });
  }

  // ─── Game Over ──────────────────────────────────────────

  _triggerGameOver(reason = 'time') {
    if (this._animating && reason === 'time') return; // don't interrupt a fall sequence
    this._animating = true;
    this.scoreSystem.stopTimer();
    AJ.audio.playGameOver();
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(420, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        summary:     this.scoreSystem.getSummary(),
        levelConfig: this.levelConfig,
        mode:        this.gameMode,
        reason,
      });
    });
  }

  // ─── Phrase Progress Bar ────────────────────────────────

  _buildPhraseBar(W, H) {
    this.phraseBarContainer = this.add.container(W / 2, H - 52).setDepth(30);
    this._updatePhraseBar();
  }

  _updatePhraseBar() {
    if (!this.phraseBarContainer) return;
    this.phraseBarContainer.removeAll(true);

    const phrase = this.board.getCurrentPhrase();
    if (!phrase) return;

    const adjCount   = phrase.adjTiles.length;
    const selected   = phrase.selectedCount;
    const totalSlots = adjCount + 1;
    const W          = this.scale.width;
    const slotW      = Math.min(56, (W - 40) / totalSlots - 5);
    const slotH      = 32;
    const gap        = 5;
    const totalW     = totalSlots * slotW + (totalSlots - 1) * gap;
    const startX     = -totalW / 2;

    // Adjective slots
    for (let i = 0; i < adjCount; i++) {
      const tile   = phrase.adjTiles[i];
      const x      = startX + i * (slotW + gap) + slotW / 2;
      const isDone = i < selected;
      const isCrack = tile.state === 'cracked';
      const col    = isDone  ? 0x6bcb77
                   : isCrack ? 0xff4444
                   : (AJ.CATEGORY_COLORS[tile.category] || 0x4ecdc4);

      const bg = this.add.graphics();
      bg.fillStyle(col, isDone ? 0.75 : 0.2);
      bg.fillRoundedRect(x - slotW / 2, -slotH / 2, slotW, slotH, 6);
      bg.lineStyle(1.5, col, isDone ? 1 : 0.5);
      bg.strokeRoundedRect(x - slotW / 2, -slotH / 2, slotW, slotH, 6);

      const label = isDone ? tile.word : (AJ.CATEGORY_LABELS[tile.category] || '?');
      const txt   = this.add.text(x, 0, label, {
        fontSize: isDone ? '12px' : '10px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      this.phraseBarContainer.add([bg, txt]);
    }

    // Noun slot
    const nx   = startX + adjCount * (slotW + gap) + slotW / 2;
    const noun = phrase.nounTile;
    const nbg  = this.add.graphics();
    nbg.fillStyle(AJ.CATEGORY_COLORS.noun, 0.2);
    nbg.fillRoundedRect(nx - slotW / 2, -slotH / 2, slotW, slotH, 6);
    nbg.lineStyle(1.5, AJ.CATEGORY_COLORS.noun, 1);
    nbg.strokeRoundedRect(nx - slotW / 2, -slotH / 2, slotW, slotH, 6);

    const ntxt = this.add.text(nx, 0, noun ? (noun.nounEmoji || noun.word || '?') : '?', {
      fontSize: '18px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);
    this.phraseBarContainer.add([nbg, ntxt]);

    // Phrase counter
    const counter = this.add.text(0, -slotH / 2 - 10,
      `문장 ${this.board.currentIdx + 1} / ${this.board.phrases.length}`, {
        fontSize: '10px', fontFamily: 'Segoe UI, Arial, sans-serif',
        color: '#555577', align: 'center',
      }).setOrigin(0.5);
    this.phraseBarContainer.add(counter);
  }

  // ─── Feedback label ─────────────────────────────────────

  _showFeedback(text, color = '#ffffff', duration = 1800) {
    if (!this.feedbackLabel) return;
    this.feedbackLabel.setText(text).setColor(color);
    this.tweens.killTweensOf(this.feedbackLabel);
    this.feedbackLabel.setAlpha(1);
    this.tweens.add({
      targets: this.feedbackLabel,
      alpha: 0,
      delay: duration - 300,
      duration: 300,
    });
  }

  // ─── Category intro overlay ─────────────────────────────

  _showCategoryIntro(category, onDone) {
    const W = this.scale.width;
    const H = this.scale.height;
    const info = AJ.EXPLANATIONS.categoryIntro[category];
    if (!info) { onDone(); return; }

    const accentColor = AJ.CATEGORY_COLORS[category] || 0x4ecdc4;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 1);
    panel.fillRoundedRect(W / 2 - 155, H / 2 - 120, 310, 250, 20);
    panel.lineStyle(2.5, accentColor, 1);
    panel.strokeRoundedRect(W / 2 - 155, H / 2 - 120, 310, 250, 20);

    const title = this.add.text(W / 2, H / 2 - 85, info.title, {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ffffff', align: 'center',
    }).setOrigin(0.5);

    const body = this.add.text(W / 2, H / 2 - 18, info.text, {
      fontSize: '14px', fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ccccdd', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    // Proper container button with explicit hit area — reliable on mobile
    const startBtn = AJ.makeBtn(this, W / 2, H / 2 + 95, '시작하기 ▶', {
      width: 190, height: 52, color: accentColor, bgColor: 0x0a0a20, silent: true,
    }, () => {
      [overlay, panel, title, body, startBtn].forEach(o => { try { o.destroy(); } catch (_) {} });
      onDone();
    });

    this.tweens.add({ targets: [panel, title, body, startBtn], alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // ─── Particles ──────────────────────────────────────────

  _spawnPhraseParticles(x, y) {
    try {
      const p = this.add.particles(x, y, '__DEFAULT', {
        speed: { min: 60, max: 200 },
        scale: { start: 0.8, end: 0 },
        lifespan: 500,
        quantity: 10,
        tint: [0x6bcb77, 0xffd93d, 0x4ecdc4, 0xff6b9d],
        emitting: false,
      });
      p.explode(10);
      this.time.delayedCall(600, () => { if (p?.active) p.destroy(); });
    } catch (e) {}
  }

  // ─── Background ─────────────────────────────────────────

  _drawBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a20, 0x0a0a20, 0x12122e, 0x12122e, 1);
    bg.fillRect(0, 0, W, H);
    const dot = this.add.graphics();
    dot.fillStyle(0xffffff, 0.03);
    for (let x = 20; x < W; x += 30) {
      for (let y = 120; y < H - 80; y += 30) {
        dot.fillRect(x, y, 2, 2);
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────

  _emitScore() {
    this.events.emit('scoreUpdate',  this.scoreSystem.score);
    this.events.emit('streakUpdate', this.scoreSystem.streak);
  }

  _saveProgress() {
    const progress = this.registry.get('progress') || {};
    const summary  = this.scoreSystem.getSummary();

    if (this.gameMode === 'adventure') {
      const id = this.levelConfig.id;
      if (!progress.unlockedLevels) progress.unlockedLevels = [1];
      const nextId = id + 1;
      if (!progress.unlockedLevels.includes(nextId) && AJ.LEVELS.find(l => l.id === nextId)) {
        progress.unlockedLevels.push(nextId);
      }
      progress.currentLevel = Math.min(nextId, AJ.LEVELS[AJ.LEVELS.length - 1].id);
      if (!progress.highScores) progress.highScores = {};
      if ((progress.highScores[id] || 0) < summary.score) progress.highScores[id] = summary.score;
    }

    if (this.gameMode === 'endless') {
      progress.endlessLevel = (progress.endlessLevel || 1) + 1;
    }

    progress.missedPatterns = AJ.contentEngine.missedPatterns;
    this.registry.set('progress', progress);
    try { localStorage.setItem('aj_progress', JSON.stringify(progress)); } catch (e) {}
  }

  // ─── Cleanup ────────────────────────────────────────────

  shutdown() {
    this.scoreSystem?.stopTimer();
    if (this._tapHandler) this.input.off('gameobjectdown', this._tapHandler);
    this.events.off('phraseBroken',  this._onPhraseBroken,  this);
    this.events.off('powerupTapped', this._onPowerupTapped,  this);
    this.events.removeAllListeners('scoreUpdate');
    this.events.removeAllListeners('timeUpdate');
    this.events.removeAllListeners('streakUpdate');
    this.events.removeAllListeners('levelName');
    this.events.removeAllListeners('livesUpdate');
    this.events.removeAllListeners('phraseActivated');
    this.board?.destroy();
  }
};
