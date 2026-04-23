// ============================================================
// KOREAN EXPLANATIONS DATABASE
// All player-facing teaching text is here. Edit freely.
// Keep messages short — they flash on screen during gameplay.
// ============================================================
window.AJ = window.AJ || {};

AJ.EXPLANATIONS = {

  // Shown when a new category unlocks for the first time
  categoryIntro: {
    size: {
      title: '🆕 크기 형용사 (Size)',
      text: '크기를 나타내는 형용사예요.\n예: big, small, huge, tiny\n크기 형용사는 항상 앞쪽에 와요!',
    },
    color: {
      title: '🆕 색깔 형용사 (Color)',
      text: '색깔을 나타내는 형용사예요.\n예: red, blue, green\n순서: 크기 → 색깔\n예: a big RED ball ✓',
    },
    opinion: {
      title: '🆕 의견 형용사 (Opinion)',
      text: '생각이나 느낌을 나타내는 형용사예요.\n예: cute, scary, beautiful\n의견 형용사는 가장 먼저 와요!\n순서: 의견 → 크기 → 색깔',
    },
    age: {
      title: '🆕 나이 형용사 (Age)',
      text: '나이나 시기를 나타내는 형용사예요.\n예: old, new, ancient, young\n순서: 의견 → 크기 → 나이 → 색깔',
    },
    material: {
      title: '🆕 재료 형용사 (Material)',
      text: '무엇으로 만들어졌는지 나타내요.\n예: wooden, plastic, golden\n색깔 뒤, 명사 앞에 와요!',
    },
    shape: {
      title: '🆕 모양 형용사 (Shape)',
      text: '모양을 나타내는 형용사예요.\n예: round, square, flat\n나이 뒤, 색깔 앞에 와요!',
    },
    origin: {
      title: '🆕 출신 형용사 (Origin)',
      text: '어느 나라 것인지 나타내요.\n예: Korean, French, Japanese\n재료 앞에 와요!',
    },
    purpose: {
      title: '🆕 용도 형용사 (Purpose)',
      text: '무엇을 위한 것인지 나타내요.\n예: running, cooking, sleeping\n명사 바로 앞에 와요!',
    },
  },

  // Mistake feedback — shown after wrong tap
  // Uses category names to build dynamic messages (see ContentEngine)
  orderRule: '올바른 순서: 의견 → 크기 → 나이 → 모양 → 색깔 → 출신 → 재료 → 용도',

  wrongOrder: (tappedCat, expectedCat) => {
    const catKr = AJ.CATEGORY_LABELS;
    return `❌ "${catKr[tappedCat] || tappedCat}"는 아직 차례가 아니에요!\n지금은 "${catKr[expectedCat] || expectedCat}" 형용사 차례예요.`;
  },

  nounTooEarly: '❌ 아직 형용사가 남아 있어요!\n모든 형용사를 먼저 선택하세요.',

  wrongPhraseTile: '❌ 이 타일은 지금 활성화된 문장의 타일이 아니에요.',

  // Streak messages
  streakMessages: {
    3:  '🔥 3연속 정답!',
    5:  '⚡ 5연속!! 대단해요!',
    7:  '🌟 7연속! 완벽해요!',
    10: '💫 10연속!!! 최고예요!!',
    15: '🏆 15연속!!!! 전설이에요!!!!',
  },

  // Phrase complete random praise
  phraseComplete: [
    '✓ 완벽해요!',
    '✓ 훌륭해요!',
    '✓ 맞아요!',
    '✓ 잘했어요!',
    '✓ 정확해요!',
    '✓ 대단해요!',
  ],

  // Level complete
  levelComplete: [
    '🎉 레벨 클리어!',
    '🎊 완벽한 클리어!',
    '⭐ 레벨 완료!',
  ],

  // Game over
  gameOver: '⏰ 시간 초과!',

  // Power-up descriptions (shown briefly on collect)
  powerups: {
    time:   '⏱ +10초 추가!',
    shield: '🛡 실수 방어막 활성화!',
    hint:   '💡 다음 정답에 힌트 표시!',
    repair: '🔧 금 간 타일 수리!',
    double: '⭐ 2배 점수 활성화!',
  },

  // Mode descriptions on menu
  modes: {
    adventure: { title: '모험 모드',  desc: '레벨을 차례로 클리어하세요!' },
    practice:  { title: '연습 모드',  desc: '원하는 카테고리를 연습하세요!' },
    endless:   { title: '무한 모드',  desc: '끝없이 도전하세요!' },
    review:    { title: '복습 모드',  desc: '틀린 패턴을 다시 연습하세요!' },
  },
};
