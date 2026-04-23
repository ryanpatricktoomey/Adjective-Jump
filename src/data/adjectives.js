// ============================================================
// ADJECTIVE DATABASE
// To add words: add an object { word, kr } to any category array.
// To add a category: add a new key here AND add it to AJ.GRAMMAR_ORDER + AJ.UNLOCK_ORDER.
// ============================================================
window.AJ = window.AJ || {};

// English adjective grammar order (fixed by linguistics)
AJ.GRAMMAR_ORDER = ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'];

// Pedagogical unlock order (easier/more common categories first)
AJ.UNLOCK_ORDER = ['size', 'color', 'opinion', 'age', 'material', 'shape', 'origin', 'purpose'];

// Category display colors (hex for Phaser)
AJ.CATEGORY_COLORS = {
  opinion:  0xff6b9d,
  size:     0x4ecdc4,
  age:      0xc77dff,
  shape:    0x80b918,
  color:    0x45b7d1,
  origin:   0xf4a261,
  material: 0xb5838d,
  purpose:  0xe63946,
  noun:     0xffd93d,
  powerup:  0xf9c74f,
};

// Category display labels (Korean)
AJ.CATEGORY_LABELS = {
  opinion:  '의견',
  size:     '크기',
  age:      '나이',
  shape:    '모양',
  color:    '색깔',
  origin:   '출신',
  material: '재료',
  purpose:  '용도',
};

AJ.ADJECTIVES = {
  size: [
    { word: 'big',    kr: '큰' },
    { word: 'small',  kr: '작은' },
    { word: 'tiny',   kr: '아주 작은' },
    { word: 'huge',   kr: '거대한' },
    { word: 'little', kr: '작은' },
    { word: 'large',  kr: '커다란' },
    { word: 'tall',   kr: '높은' },
    { word: 'short',  kr: '짧은' },
    { word: 'long',   kr: '긴' },
    { word: 'wide',   kr: '넓은' },
    { word: 'narrow', kr: '좁은' },
    { word: 'thick',  kr: '두꺼운' },
    { word: 'thin',   kr: '얇은' },
    { word: 'fat',    kr: '통통한' },
    { word: 'slim',   kr: '날씬한' },
  ],
  color: [
    { word: 'red',    kr: '빨간' },
    { word: 'blue',   kr: '파란' },
    { word: 'green',  kr: '초록' },
    { word: 'yellow', kr: '노란' },
    { word: 'white',  kr: '하얀' },
    { word: 'black',  kr: '검은' },
    { word: 'pink',   kr: '분홍' },
    { word: 'purple', kr: '보라' },
    { word: 'orange', kr: '주황' },
    { word: 'brown',  kr: '갈색' },
    { word: 'gray',   kr: '회색' },
    { word: 'golden', kr: '황금색' },
    { word: 'silver', kr: '은색' },
  ],
  opinion: [
    { word: 'beautiful', kr: '아름다운' },
    { word: 'ugly',      kr: '못생긴' },
    { word: 'cute',      kr: '귀여운' },
    { word: 'funny',     kr: '웃긴' },
    { word: 'scary',     kr: '무서운' },
    { word: 'amazing',   kr: '놀라운' },
    { word: 'terrible',  kr: '끔찍한' },
    { word: 'cool',      kr: '멋진' },
    { word: 'lovely',    kr: '사랑스러운' },
    { word: 'strange',   kr: '이상한' },
    { word: 'perfect',   kr: '완벽한' },
    { word: 'fancy',     kr: '화려한' },
    { word: 'silly',     kr: '우스꽝스러운' },
    { word: 'gross',     kr: '역겨운' },
    { word: 'delicious', kr: '맛있어 보이는' },
  ],
  age: [
    { word: 'old',     kr: '오래된' },
    { word: 'new',     kr: '새로운' },
    { word: 'young',   kr: '어린' },
    { word: 'ancient', kr: '고대의' },
    { word: 'modern',  kr: '현대적인' },
    { word: 'antique', kr: '골동품의' },
    { word: 'vintage', kr: '빈티지의' },
    { word: 'baby',    kr: '아기' },
  ],
  material: [
    { word: 'wooden',  kr: '나무로 된' },
    { word: 'metal',   kr: '금속의' },
    { word: 'plastic', kr: '플라스틱의' },
    { word: 'glass',   kr: '유리로 된' },
    { word: 'cotton',  kr: '면으로 된' },
    { word: 'leather', kr: '가죽의' },
    { word: 'stone',   kr: '돌로 된' },
    { word: 'paper',   kr: '종이로 된' },
    { word: 'rubber',  kr: '고무로 된' },
    { word: 'silk',    kr: '비단의' },
    { word: 'iron',    kr: '철로 된' },
    { word: 'velvet',  kr: '벨벳의' },
  ],
  shape: [
    { word: 'round',    kr: '둥근' },
    { word: 'square',   kr: '정사각형의' },
    { word: 'flat',     kr: '납작한' },
    { word: 'curly',    kr: '곱슬곱슬한' },
    { word: 'straight', kr: '곧은' },
    { word: 'pointed',  kr: '뾰족한' },
    { word: 'oval',     kr: '타원형의' },
    { word: 'twisted',  kr: '뒤틀린' },
  ],
  origin: [
    { word: 'Korean',   kr: '한국의' },
    { word: 'American', kr: '미국의' },
    { word: 'French',   kr: '프랑스의' },
    { word: 'Chinese',  kr: '중국의' },
    { word: 'Italian',  kr: '이탈리아의' },
    { word: 'Japanese', kr: '일본의' },
    { word: 'British',  kr: '영국의' },
    { word: 'Spanish',  kr: '스페인의' },
    { word: 'Mexican',  kr: '멕시코의' },
    { word: 'German',   kr: '독일의' },
  ],
  purpose: [
    { word: 'running',  kr: '달리기용' },
    { word: 'cooking',  kr: '요리용' },
    { word: 'sleeping', kr: '잠자리' },
    { word: 'swimming', kr: '수영용' },
    { word: 'camping',  kr: '캠핑용' },
    { word: 'fishing',  kr: '낚시용' },
    { word: 'racing',   kr: '경주용' },
    { word: 'hunting',  kr: '사냥용' },
    { word: 'hiking',   kr: '등산용' },
    { word: 'fighting', kr: '전투용' },
  ],
};
