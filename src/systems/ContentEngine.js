// ============================================================
// CONTENT ENGINE — phrase generator
// ============================================================
window.AJ = window.AJ || {};

AJ.ContentEngine = class ContentEngine {
  constructor() {
    // Each entry: { key, tappedCat, expectedCat, reason, categories, adjPerPhrase }
    this.missedPatterns = [];
  }

  // ─── Main Entry Points ──────────────────────────────────

  buildLevelPhrases(levelConfig) {
    const { curatedPhrases, categories, adjPerPhrase, phrasesPerBoard } = levelConfig;
    if (curatedPhrases && curatedPhrases.length > 0) {
      return curatedPhrases.map(p => this._curatedToPhrase(p));
    }
    return this._generatePhrases(categories, adjPerPhrase, phrasesPerBoard);
  }

  buildDynamicPhrases(categories, adjPerPhrase, count) {
    return this._generatePhrases(categories, adjPerPhrase, count);
  }

  /**
   * Build targeted review phrases from recorded mistake patterns.
   * Returns null if no patterns have been recorded yet.
   */
  buildReviewPhrases(count = 6) {
    // Filter to patterns that have the enriched format (tappedCat + expectedCat)
    const rich = this.missedPatterns.filter(p => p.tappedCat && p.expectedCat);
    if (rich.length === 0 && this.missedPatterns.length === 0) return null;

    const source = rich.length > 0 ? rich : this.missedPatterns;
    const phrases = [];

    for (let i = 0; i < count; i++) {
      const pattern = source[i % source.length];
      let cats;

      if (pattern.tappedCat && pattern.expectedCat) {
        // Drill the specific confusion pair, sorted by grammar order
        const confused = [pattern.expectedCat, pattern.tappedCat]
          .filter(c => AJ.ADJECTIVES[c])
          .sort((a, b) => AJ.GRAMMAR_ORDER.indexOf(a) - AJ.GRAMMAR_ORDER.indexOf(b));

        // Fill remaining adj slots with contextual categories from the session
        const extra = (pattern.categories || [])
          .filter(c => !confused.includes(c) && AJ.ADJECTIVES[c]);
        const slots = Math.max(2, pattern.adjPerPhrase || 2);
        cats = [...confused, ...extra].slice(0, slots);
      } else {
        // Older format — use category group
        cats = pattern.categories || AJ.GRAMMAR_ORDER.slice(0, 3);
      }

      phrases.push(this._generateOnePhrase(cats, cats.length));
    }
    return phrases;
  }

  /**
   * Record a specific mistake pattern for review mode drilling.
   * @param {{ tappedCat, expectedCat, reason, categories, adjPerPhrase }} opts
   */
  recordMiss({ tappedCat, expectedCat, reason, categories, adjPerPhrase }) {
    const key = `${tappedCat}_${expectedCat}_${reason}`;
    const existing = this.missedPatterns.find(p => p.key === key);
    if (existing) {
      // Update context (category set can evolve as player progresses)
      existing.categories  = categories;
      existing.adjPerPhrase = adjPerPhrase;
    } else {
      this.missedPatterns.push({ key, tappedCat, expectedCat, reason, categories, adjPerPhrase });
      if (this.missedPatterns.length > 20) this.missedPatterns.shift();
    }
  }

  // ─── Endless Mode Level Generator ───────────────────────

  buildEndlessLevelConfig(levelNumber) {
    const cfg      = AJ.ENDLESS_CONFIG;
    const world    = Math.floor((levelNumber - 1) / cfg.categoriesUnlockEvery);
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
    const timeLimit    = Math.max(cfg.startTimeLimit - timeDecrease, cfg.minTimeLimit);
    const powerupCount = Math.floor(levelNumber / 3);

    const totalTiles = phrasesPerBoard * (adjPerPhrase + 1) + powerupCount;
    const cols = Math.min(Math.ceil(Math.sqrt(totalTiles * 1.2)), cfg.gridColsMax);
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
      powerupCount,
      curatedPhrases: [],
    };
  }

  // ─── Internals ──────────────────────────────────────────

  _curatedToPhrase(p) {
    const noun = AJ.NOUNS.find(n => n.word === p.nounWord)
      || { word: p.nounWord, kr: p.nounWord, emoji: '❓' };
    return {
      adjectives: p.adjs.map(a => ({
        word: a.word,
        category: a.cat,
        kr: this._adjKr(a.word, a.cat),
      })),
      noun,
    };
  }

  _generatePhrases(categories, adjPerPhrase, count) {
    const usedNouns = new Set();
    const phrases   = [];
    for (let i = 0; i < count; i++) {
      let phrase, attempts = 0;
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
    const available = categories.filter(c => AJ.ADJECTIVES[c]?.length > 0);
    const picked    = this._pickN(available, Math.min(adjPerPhrase, available.length));
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
    return arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
  }

  _adjKr(word, cat) {
    const found = (AJ.ADJECTIVES[cat] || []).find(a => a.word === word);
    return found ? found.kr : word;
  }
};

AJ.contentEngine = new AJ.ContentEngine();
