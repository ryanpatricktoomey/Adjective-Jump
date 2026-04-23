// ============================================================
// CONTENT ENGINE — phrase generator
// Builds phrases from the adjective/noun databases.
// Curated phrases are preferred for early levels; later levels
// use dynamic generation for replay variety.
// ============================================================
window.AJ = window.AJ || {};

AJ.ContentEngine = class ContentEngine {
  constructor() {
    this.missedPatterns = []; // { categories[], nounWord } — used for Review mode
  }

  // ─── Main Entry Points ──────────────────────────────────

  /**
   * Build phrase data for a level.
   * Returns array of phrase objects ready for Board consumption.
   */
  buildLevelPhrases(levelConfig) {
    const { curatedPhrases, categories, adjPerPhrase, phrasesPerBoard } = levelConfig;

    if (curatedPhrases && curatedPhrases.length > 0) {
      return curatedPhrases.map(p => this._curatedToPhrase(p));
    }
    return this._generatePhrases(categories, adjPerPhrase, phrasesPerBoard);
  }

  /**
   * Build phrases for endless / practice modes.
   */
  buildDynamicPhrases(categories, adjPerPhrase, count) {
    return this._generatePhrases(categories, adjPerPhrase, count);
  }

  /**
   * Build review phrases from previously missed patterns.
   */
  buildReviewPhrases(count = 4) {
    if (this.missedPatterns.length === 0) return null;
    const phrases = [];
    for (let i = 0; i < count; i++) {
      const pattern = this.missedPatterns[i % this.missedPatterns.length];
      phrases.push(this._generateOnePhrase(pattern.categories, pattern.adjPerPhrase));
    }
    return phrases;
  }

  /**
   * Record a missed phrase pattern for review mode.
   */
  recordMiss(categories, adjPerPhrase) {
    const key = categories.slice().sort().join(',') + adjPerPhrase;
    if (!this.missedPatterns.find(p => p.key === key)) {
      this.missedPatterns.push({ key, categories, adjPerPhrase });
      if (this.missedPatterns.length > 20) this.missedPatterns.shift();
    }
  }

  // ─── Internals ──────────────────────────────────────────

  _curatedToPhrase(p) {
    const noun = AJ.NOUNS.find(n => n.word === p.nounWord) || { word: p.nounWord, kr: p.nounWord, emoji: '❓' };
    return {
      adjectives: p.adjs.map(a => ({ word: a.word, category: a.cat, kr: this._adjKr(a.word, a.cat) })),
      noun,
    };
  }

  _generatePhrases(categories, adjPerPhrase, count) {
    const phrases = [];
    const usedNouns = new Set();
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let phrase;
      do {
        phrase = this._generateOnePhrase(categories, adjPerPhrase);
        attempts++;
      } while (usedNouns.has(phrase.noun.word) && attempts < 20);
      usedNouns.add(phrase.noun.word);
      phrases.push(phrase);
    }
    return phrases;
  }

  _generateOnePhrase(categories, adjPerPhrase) {
    // Pick adjPerPhrase categories (no repeat), sorted by grammar order
    const available = categories.filter(c => AJ.ADJECTIVES[c] && AJ.ADJECTIVES[c].length > 0);
    const picked = this._pickN(available, Math.min(adjPerPhrase, available.length));
    picked.sort((a, b) => AJ.GRAMMAR_ORDER.indexOf(a) - AJ.GRAMMAR_ORDER.indexOf(b));

    const adjectives = picked.map(cat => {
      const pool = AJ.ADJECTIVES[cat];
      const item = pool[Math.floor(Math.random() * pool.length)];
      return { word: item.word, category: cat, kr: item.kr };
    });

    const noun = AJ.NOUNS[Math.floor(Math.random() * AJ.NOUNS.length)];
    return { adjectives, noun };
  }

  _pickN(arr, n) {
    const shuffled = arr.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  _adjKr(word, cat) {
    const pool = AJ.ADJECTIVES[cat];
    if (!pool) return word;
    const found = pool.find(a => a.word === word);
    return found ? found.kr : word;
  }

  // ─── Endless Mode Level Generator ───────────────────────

  buildEndlessLevelConfig(levelNumber) {
    const cfg = AJ.ENDLESS_CONFIG;
    const world = Math.floor((levelNumber - 1) / cfg.categoriesUnlockEvery);
    const catCount = Math.min(2 + world, AJ.UNLOCK_ORDER.length);
    const categories = AJ.UNLOCK_ORDER.slice(0, catCount);

    const adjPerPhrase = Math.min(
      cfg.startAdjPerPhrase + Math.floor((levelNumber - 1) / 4),
      cfg.maxAdjPerPhrase
    );
    const phrasesPerBoard = Math.min(
      cfg.startPhrasesPerBoard + Math.floor((levelNumber - 1) / 3),
      cfg.maxPhrasesPerBoard
    );
    const timeDecrease = Math.floor((levelNumber - 1) / cfg.timeLimitDecreaseEvery) * cfg.timeLimitDecreaseBy;
    const timeLimit = Math.max(cfg.startTimeLimit - timeDecrease, cfg.minTimeLimit);

    const totalTiles = phrasesPerBoard * (adjPerPhrase + 1) + Math.floor(levelNumber / 3);
    const cols = Math.min(Math.ceil(Math.sqrt(totalTiles)), cfg.gridColsMax);
    const rows = Math.min(Math.ceil(totalTiles / cols) + 1, cfg.gridRowsMax);

    return {
      id: 100 + levelNumber,
      name: `Endless ${levelNumber}`,
      world: 99,
      categories,
      newCategory: world >= 1 ? AJ.UNLOCK_ORDER[Math.min(world + 1, AJ.UNLOCK_ORDER.length - 1)] : null,
      adjPerPhrase,
      phrasesPerBoard,
      gridCols: cols,
      gridRows: rows,
      timeLimit,
      powerupCount: Math.floor(levelNumber / 3),
      curatedPhrases: [],
    };
  }
};

AJ.contentEngine = new AJ.ContentEngine();
