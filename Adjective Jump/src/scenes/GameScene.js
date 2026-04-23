// ============================================================
// GAME SCENE — core gameplay loop
// ============================================================
window.AJ = window.AJ || {};

AJ.GameScene = class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ─── Lifecycle ──────────────────────────────────────────

  init(data) {
    this.levelConfig  = data.levelConfig;
    this.gameMode     = data.mode || 'adventure';
    this.endlessLevel = data.endlessLevel || 1;
    this._animating   = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._drawBackground(W, H);

    // Score system
    this.scoreSystem = new AJ.ScoreSystem();

    // Show category intro if new
    if (this.levelConfig.newCategory) {
      this._showCategoryIntro(this.levelConfig.newCategory, () => this._setupGame(W, H));
    } else {
      this._setupGame(W, H);
    }
  }

  _setupGame(W, H) {
    // Generate phrases
    const phrases = this.levelConfig._reviewPhrases
      || AJ.contentEngine.buildLevelPhrases(this.levelConfig);

    // Board center: leave room for HUD top and phrase bar bottom
    const boardCenterY = H * 0.47;
    this.board = new AJ.Board(this, W / 2, boardCenterY, this.levelConfig);
    this.board.buildFromPhrases(phrases);

    // Character base: just below board
    const bounds = this.board.getBoardBounds();
    const charBaseY = bounds.y + bounds.height + 34;
    this.character = new AJ.Character(this, W / 2, charBaseY);

    // Board events
    this.events.on('allPhrasesComplete', this._onAllPhrasesComplete, this);
    this.events.on('phraseActivated',    this._onPhraseActivated, this);
    this.events.on('phraseBroken',       this._onPhraseBroken, this);
    this.events.on('powerupTapped',      this._onPowerupTapped, this);

    // Tile tap
    this.input.on('gameobjectdown', (_ptr, obj) => {
      if (obj instanceof AJ.Tile && !this._animating) {
        this._handleTileTap(obj);
      }
    });

    // Phrase progress bar
    this._buildPhraseBar(W, H);

    // Feedback label
    this.feedbackLabel = this.add.text(W / 2, bounds.y - 30, '', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ff6b6b',
      align: 'center',
      wordWrap: { width: W - 40 },
      backgroundColor: '#0d0d2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    // Launch UI
    this.scene.launch('UIScene');
    const ui = this.scene.get('UIScene');
    this.events.on('scoreUpdate',  s  => ui.events.emit('scoreUpdate',  s));
    this.events.on('timeUpdate',   t  => ui.events.emit('timeUpdate',   t));
    this.events.on('streakUpdate', st => ui.events.emit('streakUpdate', st));
    this.events.on('levelName',    n  => ui.events.emit('levelName',    n));

    // Start first phrase
    this.board.activatePhrase(0, true);
    this._updatePhraseBar();

    // Emit initial values after UIScene has had a frame to create listeners
    this.time.delayedCall(50, () => {
      this.events.emit('levelName',  this.levelConfig.name);
      this.events.emit('timeUpdate', this.levelConfig.timeLimit);
      this._emitScore();
    });

    // Start timer
    this.scoreSystem.startTimer(
      this.levelConfig.timeLimit,
      (t) => {
        this.events.emit('timeUpdate', t);
        if (t <= 10) AJ.audio.playTimerWarning();
      },
      () => this._onTimeUp()
    );

    this.cameras.main.fadeIn(300);
  }

  // ─── Tile Tap Handler ───────────────────────────────────

  _handleTileTap(tile) {
    const result = this.board.handleTap(tile);

    if (result.result === 'ignore') return;

    if (result.result === 'correct') {
      const { points, streak } = this.scoreSystem.scoreCorrectTap();
      AJ.audio.playCorrect(streak);
      this._emitScore();
      this.character.jumpTo(tile.x, tile.y);
      this.character.setStreakLevel(streak);

      const streakMsgs = AJ.EXPLANATIONS.streakMessages;
      if (streakMsgs[streak]) this._showFeedback(streakMsgs[streak], '#6bcb77');

      if (result.allAdjDone) {
        // Prompt noun tap
        this._showFeedback('✓ 이제 명사를 찾아요! 🎯', '#ffd93d', 1500);
      }
      this._updatePhraseBar();
    }

    if (result.result === 'phraseComplete') {
      const phrasePoints = this.scoreSystem.scorePhraseComplete(
        this.board.phrases[result.phraseIndex].adjTiles.length
      );
      AJ.audio.playPhraseComplete();
      this._emitScore();
      this.character.jumpTo(tile.x, tile.y);

      const praise = AJ.EXPLANATIONS.phraseComplete;
      this._showFeedback(
        `${praise[Math.floor(Math.random() * praise.length)]} +${phrasePoints}점`,
        '#6bcb77',
        1200
      );

      if (!result.isLast) {
        this.character.celebrate();
        this._spawnPhraseParticles(tile.x, tile.y);
      }
      this._updatePhraseBar();
    }

    if (result.result === 'wrong') {
      const mistakeResult = this.scoreSystem.scoreMistake();
      this._emitScore();

      if (mistakeResult.shielded) {
        this._showFeedback('🛡 방어막으로 실수를 막았어요!', '#c77dff', 1500);
        tile.activate();
        return;
      }

      // Sound: crack on first mistake, break on second (fatal)
      if (result.fatal) {
        AJ.audio.playBreak();
      } else {
        AJ.audio.playCrack();
      }

      // Build Korean feedback
      let msg = '';
      if (result.reason === 'noun_too_early') {
        msg = AJ.EXPLANATIONS.nounTooEarly;
      } else if (result.reason === 'wrong_order') {
        msg = AJ.EXPLANATIONS.wrongOrder(result.tappedCat, result.expectedCat);
        AJ.contentEngine.recordMiss(this.levelConfig.categories, this.levelConfig.adjPerPhrase);
        this._saveProgress();
      } else {
        msg = AJ.EXPLANATIONS.mistakes[0];
      }
      this._showFeedback(msg, '#ff6b6b', 2200);

      if (result.fatal) {
        this.character.fall();
      }
      this._updatePhraseBar();
    }
  }

  // ─── Board Events ───────────────────────────────────────

  _onAllPhrasesComplete() {
    this._animating = true;
    this.scoreSystem.stopTimer();
    AJ.audio.playDoor();

    const lastNoun = this.board.phrases[this.board.phrases.length - 1].nounTile;
    this.board.playDoorAnimation(lastNoun);

    this.time.delayedCall(1400, () => {
      const summary = this.scoreSystem.scoreLevelComplete(this.scoreSystem.timeLeft);
      const total   = this.scoreSystem.getSummary();
      this._saveProgress();

      this.scene.stop('UIScene');
      this.scene.start('LevelCompleteScene', {
        summary: total,
        levelConfig: this.levelConfig,
        mode: this.gameMode,
        endlessLevel: this.endlessLevel,
      });
    });
  }

  _onPhraseActivated(idx) {
    this._updatePhraseBar();
  }

  _onPhraseBroken() {
    this._updatePhraseBar();
    this.character.returnToBase();
    this._emitScore();
  }

  _onPowerupTapped(type) {
    AJ.audio.playPowerup();
    const msg = AJ.EXPLANATIONS.powerups[type] || '';
    this._showFeedback(msg, '#f9c74f', 1500);

    switch (type) {
      case 'time':   this.scoreSystem.addTime(10); break;
      case 'shield': this.scoreSystem.activateShield(); break;
      case 'double': this.scoreSystem.activateDouble(); break;
      case 'hint':   this._activateHint(); break;
      case 'repair': this._repairCracked(); break;
    }
    this._emitScore();
  }

  _activateHint() {
    const phrase = this.board.getCurrentPhrase();
    if (!phrase) return;
    const next = phrase.adjTiles[phrase.selectedCount];
    if (next) {
      this.tweens.add({ targets: next, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true, repeat: 2 });
    }
  }

  _repairCracked() {
    this.board.tiles.forEach(t => {
      if (t.state === 'cracked') t.activate();
    });
  }

  // ─── Timer Expired ──────────────────────────────────────

  _onTimeUp() {
    if (this._animating) return;
    this._animating = true;
    AJ.audio.playGameOver();
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(420, () => {
      this.scene.start('GameOverScene', {
        summary: this.scoreSystem.getSummary(),
        levelConfig: this.levelConfig,
        mode: this.gameMode,
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

    const phrase  = this.board.getCurrentPhrase();
    if (!phrase) return;

    const adjCount = phrase.adjTiles.length;
    const selected = phrase.selectedCount;
    const totalSlots = adjCount + 1; // adjs + noun
    const slotW = Math.min(58, (this.scale.width - 40) / totalSlots - 6);
    const slotH = 34;
    const gap   = 5;
    const totalW = totalSlots * slotW + (totalSlots - 1) * gap;
    const startX = -totalW / 2;

    for (let i = 0; i < adjCount; i++) {
      const tile  = phrase.adjTiles[i];
      const x     = startX + i * (slotW + gap) + slotW / 2;
      const isDone = i < selected;
      const col   = isDone ? 0x6bcb77 : (tile.state === 'cracked' ? 0xff4444 : AJ.CATEGORY_COLORS[tile.category] || 0x4ecdc4);
      const bg    = this.add.graphics();
      bg.fillStyle(col, isDone ? 0.7 : 0.25);
      bg.fillRoundedRect(x - slotW / 2, -slotH / 2, slotW, slotH, 7);
      bg.lineStyle(1.5, col, isDone ? 1 : 0.5);
      bg.strokeRoundedRect(x - slotW / 2, -slotH / 2, slotW, slotH, 7);

      const label = isDone ? tile.word : (AJ.CATEGORY_LABELS[tile.category] || '?');
      const text  = this.add.text(x, 0, label, {
        fontSize: isDone ? '12px' : '10px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.phraseBarContainer.add([bg, text]);
    }

    // Noun slot
    const nx   = startX + adjCount * (slotW + gap) + slotW / 2;
    const noun = phrase.nounTile;
    const nounDone = selected === adjCount && phrase.state === 'complete';
    const nbg = this.add.graphics();
    nbg.fillStyle(AJ.CATEGORY_COLORS.noun, nounDone ? 0.7 : 0.2);
    nbg.fillRoundedRect(nx - slotW / 2, -slotH / 2, slotW, slotH, 7);
    nbg.lineStyle(1.5, AJ.CATEGORY_COLORS.noun, 1);
    nbg.strokeRoundedRect(nx - slotW / 2, -slotH / 2, slotW, slotH, 7);

    const nounLabel = noun ? noun.word || noun.nounEmoji : '?';
    const ntext = this.add.text(nx, 0, nounLabel, {
      fontSize: '16px',
      fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
    }).setOrigin(0.5);
    this.phraseBarContainer.add([nbg, ntext]);

    // Phrase counter
    const counter = this.add.text(0, -slotH / 2 - 10,
      `문장 ${this.board.currentIdx + 1} / ${this.board.phrases.length}`, {
        fontSize: '10px', fontFamily: 'Segoe UI, Arial, sans-serif',
        color: '#666688', align: 'center',
      }).setOrigin(0.5);
    this.phraseBarContainer.add(counter);
  }

  // ─── Feedback Label ─────────────────────────────────────

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

  // ─── Category Intro ─────────────────────────────────────

  _showCategoryIntro(category, onDone) {
    const W = this.scale.width;
    const H = this.scale.height;
    const info = AJ.EXPLANATIONS.categoryIntro[category];
    if (!info) { onDone(); return; }

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 1);
    panel.fillRoundedRect(W / 2 - 155, H / 2 - 120, 310, 240, 20);
    panel.lineStyle(2.5, AJ.CATEGORY_COLORS[category] || 0x4ecdc4, 1);
    panel.strokeRoundedRect(W / 2 - 155, H / 2 - 120, 310, 240, 20);

    const title = this.add.text(W / 2, H / 2 - 85, info.title, {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#ffffff', align: 'center',
    }).setOrigin(0.5);

    const body = this.add.text(W / 2, H / 2 - 20, info.text, {
      fontSize: '14px', fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#ccccdd', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 85, '시작하기 ▶', {
      fontSize: '17px', fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold', color: '#4ecdc4',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      [overlay, panel, title, body, btn].forEach(o => o.destroy());
      onDone();
    });

    this.tweens.add({ targets: [panel, title, body, btn], alpha: { from: 0, to: 1 }, duration: 300 });
  }

  // ─── Particles ──────────────────────────────────────────

  _spawnPhraseParticles(x, y) {
    try {
      const p = this.add.particles(x, y, '__DEFAULT', {
        speed: { min: 60, max: 200 },
        scale: { start: 0.8, end: 0 },
        lifespan: 500,
        quantity: 12,
        tint: [0x6bcb77, 0xffd93d, 0x4ecdc4, 0xff6b9d],
        emitting: false,
      });
      p.explode(12);
      this.time.delayedCall(600, () => { if (p.active) p.destroy(); });
    } catch (e) {}
  }

  // ─── Helpers ────────────────────────────────────────────

  _drawBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a20, 0x0a0a20, 0x12122e, 0x12122e, 1);
    bg.fillRect(0, 0, W, H);

    // Subtle grid dots
    const dot = this.add.graphics();
    dot.fillStyle(0xffffff, 0.03);
    for (let x = 20; x < W; x += 30) {
      for (let y = 120; y < H - 80; y += 30) {
        dot.fillRect(x, y, 2, 2);
      }
    }
  }

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

  shutdown() {
    this.scoreSystem?.stopTimer();
    this.events.off('allPhrasesComplete');
    this.events.off('phraseActivated');
    this.events.off('phraseBroken');
    this.events.off('powerupTapped');
  }
};
