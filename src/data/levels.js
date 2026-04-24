// ============================================================
// LEVEL CONFIGURATION
// Grid rule: gridCols × gridRows must be ≥ phrasesPerBoard × (adjPerPhrase + 1) + powerupCount
// Board.buildFromPhrases auto-expands gridRows if config is too small.
//
// To add a level: copy an entry and adjust values.
// To add curated phrases: add to curatedPhrases array.
//   Each phrase: { adjs: [{word, cat}, ...], nounWord: 'cat' }
//   Empty array = fully dynamic generation.
// ============================================================
window.AJ = window.AJ || {};

AJ.LEVELS = [

  // ─── WORLD 1: Size + Color (2 adj per phrase) ───────────
  // Tile budget per phrase = 3. Keep early difficulty from few categories, not short boards.
  {
    id: 1, name: 'Level 1', world: 1,
    categories: ['size', 'color'],
    newCategory: 'size',
    adjPerPhrase: 2, phrasesPerBoard: 6,
    gridCols: 4, gridRows: 5,   // capacity 20, need 18
    timeLimit: 90, powerupCount: 0,
    curatedPhrases: [
      { adjs: [{ word: 'big',   cat: 'size' }, { word: 'red',    cat: 'color' }], nounWord: 'ball'   },
      { adjs: [{ word: 'small', cat: 'size' }, { word: 'blue',   cat: 'color' }], nounWord: 'cat'    },
      { adjs: [{ word: 'tiny',  cat: 'size' }, { word: 'green',  cat: 'color' }], nounWord: 'frog'   },
      { adjs: [{ word: 'huge',  cat: 'size' }, { word: 'yellow', cat: 'color' }], nounWord: 'duck'   },
      { adjs: [{ word: 'long',  cat: 'size' }, { word: 'purple', cat: 'color' }], nounWord: 'snake'  },
      { adjs: [{ word: 'tall',  cat: 'size' }, { word: 'white',  cat: 'color' }], nounWord: 'horse'  },
    ],
  },
  {
    id: 2, name: 'Level 2', world: 1,
    categories: ['size', 'color'],
    newCategory: 'color',
    adjPerPhrase: 2, phrasesPerBoard: 7,
    gridCols: 4, gridRows: 6,   // capacity 24, need 22+1
    timeLimit: 85, powerupCount: 1,
    curatedPhrases: [],
  },
  {
    id: 3, name: 'Level 3', world: 1,
    categories: ['size', 'color'],
    newCategory: null,
    adjPerPhrase: 2, phrasesPerBoard: 8,
    gridCols: 5, gridRows: 6,   // capacity 30, need 24+2
    timeLimit: 80, powerupCount: 2,
    curatedPhrases: [],
  },

  // ─── WORLD 2: + Opinion (3 adj per phrase) ──────────────
  {
    id: 4, name: 'Level 4', world: 2,
    categories: ['opinion', 'size', 'color'],
    newCategory: 'opinion',
    adjPerPhrase: 3, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 5,   // capacity 25, need 24+1
    timeLimit: 95, powerupCount: 1,
    curatedPhrases: [
      { adjs: [{ word: 'cute',      cat: 'opinion' }, { word: 'big',   cat: 'size' }, { word: 'white',  cat: 'color' }], nounWord: 'bear'   },
      { adjs: [{ word: 'scary',     cat: 'opinion' }, { word: 'huge',  cat: 'size' }, { word: 'black',  cat: 'color' }], nounWord: 'wolf'   },
      { adjs: [{ word: 'beautiful', cat: 'opinion' }, { word: 'small', cat: 'size' }, { word: 'pink',   cat: 'color' }], nounWord: 'flower' },
      { adjs: [{ word: 'cool',      cat: 'opinion' }, { word: 'long',  cat: 'size' }, { word: 'blue',   cat: 'color' }], nounWord: 'snake'  },
      { adjs: [{ word: 'funny',     cat: 'opinion' }, { word: 'tiny',  cat: 'size' }, { word: 'green',  cat: 'color' }], nounWord: 'frog'   },
      { adjs: [{ word: 'amazing',   cat: 'opinion' }, { word: 'tall',  cat: 'size' }, { word: 'golden', cat: 'color' }], nounWord: 'crown'  },
    ],
  },
  {
    id: 5, name: 'Level 5', world: 2,
    categories: ['opinion', 'size', 'color'],
    newCategory: null,
    adjPerPhrase: 3, phrasesPerBoard: 7,
    gridCols: 5, gridRows: 6,   // capacity 30, need 28+2
    timeLimit: 88, powerupCount: 2,
    curatedPhrases: [],
  },
  {
    id: 6, name: 'Level 6', world: 2,
    categories: ['opinion', 'size', 'color'],
    newCategory: null,
    adjPerPhrase: 3, phrasesPerBoard: 8,
    gridCols: 5, gridRows: 7,   // capacity 35, need 32+2
    timeLimit: 85, powerupCount: 2,
    curatedPhrases: [],
  },

  // ─── WORLD 3: + Age ─────────────────────────────────────
  {
    id: 7, name: 'Level 7', world: 3,
    categories: ['opinion', 'size', 'age', 'color'],
    newCategory: 'age',
    adjPerPhrase: 3, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 6,   // capacity 30, need 24+2
    timeLimit: 95, powerupCount: 2,
    curatedPhrases: [
      { adjs: [{ word: 'cute',      cat: 'opinion' }, { word: 'old',    cat: 'age' }, { word: 'gray',   cat: 'color' }], nounWord: 'owl'    },
      { adjs: [{ word: 'cool',      cat: 'opinion' }, { word: 'new',    cat: 'age' }, { word: 'blue',   cat: 'color' }], nounWord: 'robot'  },
      { adjs: [{ word: 'funny',     cat: 'opinion' }, { word: 'young',  cat: 'age' }, { word: 'green',  cat: 'color' }], nounWord: 'frog'   },
      { adjs: [{ word: 'scary',     cat: 'opinion' }, { word: 'ancient',cat: 'age' }, { word: 'black',  cat: 'color' }], nounWord: 'wolf'   },
      { adjs: [{ word: 'beautiful', cat: 'opinion' }, { word: 'old',    cat: 'age' }, { word: 'golden', cat: 'color' }], nounWord: 'crown'  },
      { adjs: [{ word: 'strange',   cat: 'opinion' }, { word: 'young',  cat: 'age' }, { word: 'pink',   cat: 'color' }], nounWord: 'rabbit' },
    ],
  },
  {
    id: 8, name: 'Level 8', world: 3,
    categories: ['opinion', 'size', 'age', 'color'],
    newCategory: null,
    adjPerPhrase: 3, phrasesPerBoard: 8,
    gridCols: 5, gridRows: 7,   // capacity 35, need 32+3
    timeLimit: 88, powerupCount: 3,
    curatedPhrases: [],
  },

  // ─── WORLD 4: + Material ────────────────────────────────
  {
    id: 9, name: 'Level 9', world: 4,
    categories: ['opinion', 'size', 'color', 'material'],
    newCategory: 'material',
    adjPerPhrase: 3, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 6,   // capacity 30, need 24+2
    timeLimit: 95, powerupCount: 2,
    curatedPhrases: [],
  },
  {
    id: 10, name: 'Level 10', world: 4,
    categories: ['opinion', 'size', 'age', 'color', 'material'],
    newCategory: null,
    adjPerPhrase: 4, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 7,   // capacity 35, need 30+3
    timeLimit: 95, powerupCount: 3,
    curatedPhrases: [],
  },

  // ─── WORLD 5: + Shape ───────────────────────────────────
  {
    id: 11, name: 'Level 11', world: 5,
    categories: ['opinion', 'size', 'age', 'shape', 'color'],
    newCategory: 'shape',
    adjPerPhrase: 3, phrasesPerBoard: 7,
    gridCols: 5, gridRows: 7,   // capacity 35, need 28+3
    timeLimit: 92, powerupCount: 3,
    curatedPhrases: [],
  },
  {
    id: 12, name: 'Level 12', world: 5,
    categories: ['opinion', 'size', 'age', 'shape', 'color', 'material'],
    newCategory: null,
    adjPerPhrase: 4, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 7,   // capacity 35, need 30+3
    timeLimit: 95, powerupCount: 3,
    curatedPhrases: [],
  },

  // ─── WORLD 6: + Origin ──────────────────────────────────
  {
    id: 13, name: 'Level 13', world: 6,
    categories: ['opinion', 'size', 'age', 'color', 'origin', 'material'],
    newCategory: 'origin',
    adjPerPhrase: 4, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 7,   // capacity 35, need 30+3
    timeLimit: 98, powerupCount: 3,
    curatedPhrases: [],
  },

  // ─── WORLD 7: + Purpose (Master) ────────────────────────
  {
    id: 14, name: 'Level 14', world: 7,
    categories: ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'],
    newCategory: 'purpose',
    adjPerPhrase: 4, phrasesPerBoard: 7,
    gridCols: 5, gridRows: 8,   // capacity 40, need 35+4
    timeLimit: 100, powerupCount: 4,
    curatedPhrases: [],
  },
  {
    id: 15, name: 'Level 15', world: 7,
    categories: ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'],
    newCategory: null,
    adjPerPhrase: 5, phrasesPerBoard: 6,
    gridCols: 5, gridRows: 8,   // capacity 40, need 36+4
    timeLimit: 120, powerupCount: 4,
    curatedPhrases: [],
  },
];

// ─── Endless mode config ─────────────────────────────────
// ← TUNE: any of these values
AJ.ENDLESS_CONFIG = {
  startCategories:        ['size', 'color'],
  categoriesUnlockEvery:  3,         // levels between category unlocks
  startAdjPerPhrase:      2,
  maxAdjPerPhrase:        5,
  startPhrasesPerBoard:   6,         // ← TUNE: was 3, now 6
  maxPhrasesPerBoard:     10,
  startTimeLimit:         90,
  minTimeLimit:           60,
  timeLimitDecreaseEvery: 5,
  timeLimitDecreaseBy:    5,
  gridColsMax:            5,
  gridRowsMax:            8,
};

// ─── Practice configs ────────────────────────────────────
AJ.PRACTICE_CONFIGS = [
  { label: 'Size + Color',           categories: ['size', 'color'],                        adjPerPhrase: 2 },
  { label: 'Opinion + Size',         categories: ['opinion', 'size'],                      adjPerPhrase: 2 },
  { label: 'Opinion + Color',        categories: ['opinion', 'color'],                     adjPerPhrase: 2 },
  { label: 'Opinion + Size + Color', categories: ['opinion', 'size', 'color'],             adjPerPhrase: 3 },
  { label: 'Size + Age + Color',     categories: ['size', 'age', 'color'],                 adjPerPhrase: 3 },
  { label: 'Color + Material',       categories: ['color', 'material'],                    adjPerPhrase: 2 },
  { label: '4-Category Mix',         categories: ['opinion', 'size', 'color', 'material'], adjPerPhrase: 4 },
  { label: 'All Categories',         categories: AJ.GRAMMAR_ORDER,                         adjPerPhrase: 4 },
];
