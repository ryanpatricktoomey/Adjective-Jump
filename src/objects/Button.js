// ============================================================
// BUTTON UTILITY
// AJ.makeBtn(scene, x, y, label, opts, cb) → Container
//
// opts: {
//   width    (default 220)    — visual + hit area width
//   height   (default 48)     — min 44px enforced for mobile
//   color    (default 0x4ecdc4)  — border + text color
//   bgColor  (default 0x12122a) — fill color
//   fontSize (default '16px')
//   radius   (default 12)     — corner radius
//   depth                     — optional setDepth value
//   silent   (false)          — true = skip playMenuClick
//   fontStyle (default 'bold')
// }
//
// The returned container exposes .label (Text) for dynamic updates.
// Callback fires immediately on pointerdown — never delayed.
// ============================================================
window.AJ = window.AJ || {};

AJ.makeBtn = function (scene, x, y, label, opts, cb) {
  opts = opts || {};

  const w     = opts.width    || 220;
  const h     = Math.max(opts.height  || 48, 44);
  const color = opts.color    !== undefined ? opts.color   : 0x4ecdc4;
  const bgCol = opts.bgColor  !== undefined ? opts.bgColor : 0x12122a;
  const fs    = opts.fontSize || '16px';
  const r     = opts.radius   || 12;

  const ctn = scene.add.container(x, y);
  if (opts.depth !== undefined) ctn.setDepth(opts.depth);

  const gfx = scene.add.graphics();

  const paint = (hover) => {
    gfx.clear();
    gfx.fillStyle(hover ? color : bgCol, hover ? 0.18 : 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    gfx.lineStyle(hover ? 2.5 : 2, color, hover ? 1 : 0.65);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  };
  paint(false);

  const txt = scene.add.text(0, 0, label, {
    fontSize: fs,
    fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Segoe UI, Arial, sans-serif',
    fontStyle: opts.fontStyle || 'bold',
    color: Phaser.Display.Color.IntegerToColor(color).rgba,
    align: 'center',
  }).setOrigin(0.5);

  ctn.add([gfx, txt]);
  ctn.label = txt;

  // Explicit hit area — this is the fix for unreliable taps.
  // Phaser text setInteractive() uses raw text bounds (ignoring padding);
  // a Container with an explicit Rectangle always matches the visual.
  ctn.setSize(w, h);
  ctn.setInteractive(
    new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
    Phaser.Geom.Rectangle.Contains
  );
  ctn.input.cursor = 'pointer';

  ctn.on('pointerover', () => {
    paint(true);
    scene.tweens.add({ targets: ctn, scaleX: 1.04, scaleY: 1.04, duration: 80, ease: 'Power1' });
  });
  ctn.on('pointerout', () => {
    paint(false);
    scene.tweens.add({ targets: ctn, scaleX: 1, scaleY: 1, duration: 80, ease: 'Power1' });
  });
  ctn.on('pointerdown', () => {
    // Squash animation fires alongside callback — never blocks the action
    scene.tweens.add({ targets: ctn, scaleX: 0.93, scaleY: 0.93, duration: 55, yoyo: true, ease: 'Power2' });
    if (!opts.silent) AJ.audio?.playMenuClick?.();
    if (cb) cb();
  });

  return ctn;
};
