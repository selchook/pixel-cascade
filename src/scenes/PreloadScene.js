import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, COLOR_DARK, COLOR_LIGHT, CELL_SIZE } from '../constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  // preload() intentionally empty — all assets are procedural, generated in create()
  preload() {}

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x000000, 0.08);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      bg.fillRect(0, y, GAME_WIDTH, 2);
    }

    // ── Title ─────────────────────────────────────────────────────────────────
    const title = this.add.text(cx, cy - 96, 'PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '36px',
      color: '#00ffff',
      stroke: '#0088ff',
      strokeThickness: 4,
      shadow: { offsetX: 3, offsetY: 3, color: '#000044', blur: 0, fill: true },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05, scaleY: 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Progress bar ──────────────────────────────────────────────────────────
    const barX = cx - GAME_WIDTH * 0.3;
    const barW = GAME_WIDTH * 0.6;
    const barY = cy + 64;
    const barH = 18;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x111133, 1);
    barBg.fillRect(barX, barY, barW, barH);
    barBg.lineStyle(2, 0x4444aa, 1);
    barBg.strokeRect(barX, barY, barW, barH);

    this._barFill = this.add.graphics();

    this._stepLabel = this.add.text(cx, barY + barH + 14, 'GENERATING ASSETS...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#6666aa',
    }).setOrigin(0.5);

    this._barX = barX;
    this._barY = barY;
    this._barW = barW;
    this._barH = barH;

    // ── Step queue ────────────────────────────────────────────────────────────
    this._queue = this._buildQueue();
    this._stepIdx = 0;
    this._stepTimer = this.time.addEvent({
      delay: 32,
      callback: this._tick,
      callbackScope: this,
      loop: true,
    });
  }

  // Build ordered list of generation steps — each entry is [label, fn]
  _buildQueue() {
    const steps = [];
    COLORS.forEach((color, i) => {
      steps.push([
        `BLOCK ${i + 1} / ${COLORS.length}`,
        () => this.generateBlockTexture(`block_${i}`, color, COLOR_DARK[i], COLOR_LIGHT[i], CELL_SIZE),
      ]);
    });
    steps.push(['PARTICLE FX',  () => this.generateParticleTexture()]);
    steps.push(['BACKGROUND',   () => this.generateBgTexture()]);
    steps.push(['GRID',         () => this.generateGridTexture()]);
    steps.push(['BUTTONS',      () => this.generateButtonTexture()]);
    steps.push(['GLOW FX',      () => this.generateGlowTexture()]);
    return steps;
  }

  _tick() {
    if (this._stepIdx >= this._queue.length) return;

    const [label, fn] = this._queue[this._stepIdx];
    fn();
    this._stepIdx++;

    const progress = this._stepIdx / this._queue.length;
    this._setProgress(progress, label);

    if (this._stepIdx >= this._queue.length) {
      this._stepTimer.remove();
      this.time.delayedCall(300, () => this._complete());
    }
  }

  _setProgress(value, label) {
    this._barFill.clear();
    this._barFill.fillStyle(0x00ccff, 1);
    this._barFill.fillRect(
      this._barX + 2, this._barY + 2,
      (this._barW - 4) * value, this._barH - 4
    );
    if (label) {
      this._stepLabel.setText(label);
    }
  }

  _complete() {
    this._setProgress(1, 'READY!');

    try {
      if (window.CrazyGames?.SDK) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (_) {}

    this.time.delayedCall(350, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start(SCENES.MENU));
    });
  }

  // ── Texture generators ────────────────────────────────────────────────────

  generateBlockTexture(key, color, dark, light, size) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(2, 2, size - 4, size - 4);
    g.fillStyle(light, 1);
    g.fillRect(2, 2, size - 4, 4);
    g.fillRect(2, 2, 4, size - 4);
    g.fillStyle(dark, 1);
    g.fillRect(2, size - 6, size - 4, 4);
    g.fillRect(size - 6, 2, 4, size - 4);
    g.fillStyle(color, 1);
    g.fillRect(6, 6, size - 12, size - 12);
    g.fillStyle(light, 0.4);
    g.fillRect(size / 2 - 4, size / 2 - 4, 4, 4);
    g.fillRect(size / 2, size / 2, 4, 4);
    g.lineStyle(2, dark, 1);
    g.strokeRect(2, 2, size - 4, size - 4);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  generateParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle', 6, 6);
    g.destroy();
  }

  generateBgTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0d0d2e, 0x0d0d2e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x000000, 0.15);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      g.fillRect(0, y, GAME_WIDTH, 2);
    }
    g.generateTexture('background', GAME_WIDTH, GAME_HEIGHT);
    g.destroy();
  }

  generateGridTexture() {
    const cols = 8;
    const rows = 10;
    const cs   = CELL_SIZE;
    const w    = cols * cs + 4;
    const h    = rows * cs + 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0a0a22, 0.95);
    g.fillRect(0, 0, w, h);
    g.lineStyle(1, 0x222244, 0.8);
    for (let c = 0; c <= cols; c++) g.lineBetween(c * cs + 2, 2, c * cs + 2, h - 2);
    for (let r = 0; r <= rows; r++) g.lineBetween(2, r * cs + 2, w - 2, r * cs + 2);
    g.lineStyle(3, 0x4444aa, 1);
    g.strokeRect(1, 1, w - 2, h - 2);
    g.fillStyle(0x00ffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.fillRect(w - 6, 0, 6, 6);
    g.fillRect(0, h - 6, 6, 6);
    g.fillRect(w - 6, h - 6, 6, 6);
    g.generateTexture('grid', w, h);
    g.destroy();
  }

  generateButtonTexture() {
    const w = 220;
    const h = 56;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a1a4e, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x4444cc, 1);
    g.fillRect(0, 0, w, 3);
    g.fillRect(0, h - 3, w, 3);
    g.fillRect(0, 0, 3, h);
    g.fillRect(w - 3, 0, 3, h);
    g.fillStyle(0x6666ee, 0.5);
    g.fillRect(3, 3, w - 6, 3);
    g.fillRect(3, 3, 3, h - 6);
    g.fillStyle(0x00ffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.fillRect(w - 4, 0, 4, 4);
    g.fillRect(0, h - 4, 4, 4);
    g.fillRect(w - 4, h - 4, 4, 4);
    g.generateTexture('button', w, h);
    g.destroy();
  }

  generateGlowTexture() {
    const size = 64;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    for (let r = size / 2; r > 0; r -= 2) {
      g.fillStyle(0xffffff, (1 - r / (size / 2)) * 0.15);
      g.fillCircle(size / 2, size / 2, r);
    }
    g.generateTexture('glow', size, size);
    g.destroy();
  }
}
