import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, COLOR_DARK, COLOR_LIGHT, CELL_SIZE } from '../constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    this.createLoadingScreen();

    // Generate all textures programmatically
    this.generateTextures();

    // Simulate brief loading for CrazyGames
    this.time.delayedCall(500, () => {
      // loading complete
    });
  }

  createLoadingScreen() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, w, h);

    // Pixel art title
    const title = this.add.text(w / 2, h * 0.35, 'PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '36px',
      color: '#00ffff',
      stroke: '#0088ff',
      strokeThickness: 4,
      shadow: { offsetX: 3, offsetY: 3, color: '#000044', blur: 0, fill: true }
    }).setOrigin(0.5);

    // Animate title
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Loading bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 1);
    barBg.fillRect(w * 0.2, h * 0.6, w * 0.6, 20);
    barBg.lineStyle(2, 0x4444aa, 1);
    barBg.strokeRect(w * 0.2, h * 0.6, w * 0.6, 20);

    // Loading bar fill
    const barFill = this.add.graphics();

    // Loading text
    const loadText = this.add.text(w / 2, h * 0.6 + 35, 'LOADING...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#8888ff'
    }).setOrigin(0.5);

    // Animate loading bar
    this.load.on('progress', (value) => {
      barFill.clear();
      barFill.fillStyle(0x00ffff, 1);
      barFill.fillRect(w * 0.2 + 2, h * 0.6 + 2, (w * 0.6 - 4) * value, 16);
      loadText.setText(`LOADING... ${Math.floor(value * 100)}%`);
    });
  }

  generateTextures() {
    // Generate block textures for each color
    COLORS.forEach((color, i) => {
      this.generateBlockTexture(`block_${i}`, color, COLOR_DARK[i], COLOR_LIGHT[i], CELL_SIZE);
    });

    // Generate special textures
    this.generateParticleTexture();
    this.generateBgTexture();
    this.generateGridTexture();
    this.generateButtonTexture();
    this.generateGlowTexture();
  }

  generateBlockTexture(key, color, dark, light, size) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Main block body
    g.fillStyle(color, 1);
    g.fillRect(2, 2, size - 4, size - 4);

    // Pixel highlight (top-left)
    g.fillStyle(light, 1);
    g.fillRect(2, 2, size - 4, 4);
    g.fillRect(2, 2, 4, size - 4);

    // Pixel shadow (bottom-right)
    g.fillStyle(dark, 1);
    g.fillRect(2, size - 6, size - 4, 4);
    g.fillRect(size - 6, 2, 4, size - 4);

    // Inner pixel detail
    g.fillStyle(color, 1);
    g.fillRect(6, 6, size - 12, size - 12);

    // Center pixel art pattern
    g.fillStyle(light, 0.4);
    g.fillRect(size / 2 - 4, size / 2 - 4, 4, 4);
    g.fillRect(size / 2, size / 2, 4, 4);

    // Outer border
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

    // Dark gradient background
    g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0d0d2e, 0x0d0d2e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Scanlines for retro effect
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
    const cs = CELL_SIZE;
    const w = cols * cs + 4;
    const h = rows * cs + 4;

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Grid background
    g.fillStyle(0x0a0a22, 0.95);
    g.fillRect(0, 0, w, h);

    // Grid lines
    g.lineStyle(1, 0x222244, 0.8);
    for (let c = 0; c <= cols; c++) {
      g.lineBetween(c * cs + 2, 2, c * cs + 2, h - 2);
    }
    for (let r = 0; r <= rows; r++) {
      g.lineBetween(2, r * cs + 2, w - 2, r * cs + 2);
    }

    // Border
    g.lineStyle(3, 0x4444aa, 1);
    g.strokeRect(1, 1, w - 2, h - 2);

    // Corner accents
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

    // Button body
    g.fillStyle(0x1a1a4e, 1);
    g.fillRect(0, 0, w, h);

    // Pixel border
    g.fillStyle(0x4444cc, 1);
    g.fillRect(0, 0, w, 3);
    g.fillRect(0, h - 3, w, 3);
    g.fillRect(0, 0, 3, h);
    g.fillRect(w - 3, 0, 3, h);

    // Inner highlight
    g.fillStyle(0x6666ee, 0.5);
    g.fillRect(3, 3, w - 6, 3);
    g.fillRect(3, 3, 3, h - 6);

    // Corner pixels
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

    // Create a soft glow circle
    for (let r = size / 2; r > 0; r -= 2) {
      const alpha = (1 - r / (size / 2)) * 0.15;
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(size / 2, size / 2, r);
    }

    g.generateTexture('glow', size, size);
    g.destroy();
  }

  create() {
    // Notify CrazyGames loading complete
    try {
      if (window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {}

    this.scene.start(SCENES.MENU);
  }
}