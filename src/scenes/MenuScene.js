import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants.js';
import { gameState } from '../GameState.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
    this.fallingBlocks = [];
    this.stars = [];
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.createBackground();
    this.createFallingBlocks();
    this.createUI();
    this.createStars();

    // Animate entrance
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  createBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Scanlines
    g.fillStyle(0x000000, 0.1);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      g.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Grid pattern
    g.lineStyle(1, 0x1a1a3a, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      g.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 32) {
      g.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  createStars() {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, alpha);
      g.fillRect(x, y, size, size);

      this.tweens.add({
        targets: g,
        alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
      this.stars.push(g);
    }
  }

  createFallingBlocks() {
    // Decorative falling blocks in background
    for (let i = 0; i < 12; i++) {
      this.spawnDecorBlock();
    }

    this.time.addEvent({
      delay: 600,
      callback: this.spawnDecorBlock,
      callbackScope: this,
      loop: true
    });
  }

  spawnDecorBlock() {
    const colorIdx = Phaser.Math.Between(0, COLORS.length - 1);
    const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
    const g = this.add.graphics();
    const color = COLORS[colorIdx];
    g.fillStyle(color, 0.25);
    g.fillRect(0, 0, 36, 36);
    g.lineStyle(1, color, 0.4);
    g.strokeRect(0, 0, 36, 36);
    g.x = x;
    g.y = -40;

    this.tweens.add({
      targets: g,
      y: GAME_HEIGHT + 60,
      duration: Phaser.Math.Between(3000, 7000),
      ease: 'Linear',
      onComplete: () => { g.destroy(); }
    });
  }

  createUI() {
    const cx = GAME_WIDTH / 2;

    // Title glow effect
    const glowText = this.add.text(cx, 160, 'PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '38px',
      color: '#003366',
    }).setOrigin(0.5).setAlpha(0.5);

    // Main title
    const title = this.add.text(cx, 158, 'PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '38px',
      color: '#00ffff',
      stroke: '#0044aa',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 200, '[ MATCH & CLEAR ]', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#8888ff',
    }).setOrigin(0.5);

    // Decorative pixel art
    this.createPixelDecoration(cx, 115);

    // Title pulsing
    this.tweens.add({
      targets: [title, glowText],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // High score display
    const hsBox = this.add.graphics();
    hsBox.fillStyle(0x111133, 0.8);
    hsBox.fillRect(cx - 110, 220, 220, 40);
    hsBox.lineStyle(2, 0x3333aa, 1);
    hsBox.strokeRect(cx - 110, 220, 220, 40);

    this.add.text(cx - 50, 240, 'BEST:', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#8888ff',
    }).setOrigin(0.5);

    this.add.text(cx + 30, 240, gameState.highScore.toString().padStart(6, '0'), {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffff00',
    }).setOrigin(0.5);

    // Play button
    this.createButton(cx, 320, 'PLAY GAME', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start(SCENES.ONBOARDING);
      });
    }, 0x00ff88, 0x009944);

    // Continue button (if saved progress)
    if (gameState.savedLevel > 0) {
      this.createButton(cx, 395, `CONTINUE (LVL ${gameState.savedLevel + 1})`, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => {
          gameState.startGame(gameState.savedLevel);
          this.scene.start(SCENES.GAME);
        });
      }, 0x88aaff, 0x4455aa);
    }

    // How to play button
    const btnY = gameState.savedLevel > 0 ? 470 : 395;
    this.createButton(cx, btnY, 'HOW TO PLAY', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start(SCENES.ONBOARDING);
      });
    }, 0xffaa00, 0xaa6600);

    // Sound toggle
    this.createSoundToggle();

    // Version
    this.add.text(cx, GAME_HEIGHT - 20, 'v1.0 | PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#333366',
    }).setOrigin(0.5);
  }

  createPixelDecoration(cx, y) {
    const blockColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6];
    const g = this.add.graphics();
    blockColors.forEach((c, i) => {
      const bx = cx - (blockColors.length * 20) / 2 + i * 20;
      g.fillStyle(c, 0.9);
      g.fillRect(bx, y, 16, 16);
      g.lineStyle(1, 0x000000, 0.5);
      g.strokeRect(bx, y, 16, 16);
    });

    this.tweens.add({
      targets: g,
      y: '-=6',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createButton(x, y, label, callback, colorTop, colorBottom) {
    const w = 220;
    const h = 50;

    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x111133, 1);
    bg.fillRect(-w / 2, -h / 2, w, h);

    // Button border with pixel style
    bg.fillStyle(colorTop, 1);
    bg.fillRect(-w / 2, -h / 2, w, 3);
    bg.fillRect(-w / 2, h / 2 - 3, w, 3);
    bg.fillRect(-w / 2, -h / 2, 3, h);
    bg.fillRect(w / 2 - 3, -h / 2, 3, h);

    // Corner accents
    bg.fillStyle(colorTop, 1);
    bg.fillRect(-w / 2, -h / 2, 6, 6);
    bg.fillRect(w / 2 - 6, -h / 2, 6, 6);
    bg.fillRect(-w / 2, h / 2 - 6, 6, 6);
    bg.fillRect(w / 2 - 6, h / 2 - 6, 6, 6);

    // Hover overlay (invisible by default)
    const hover = this.add.graphics();
    hover.fillStyle(0xffffff, 0.12);
    hover.fillRect(-w / 2, -h / 2, w, h);
    hover.setAlpha(0);

    container.add(bg);
    container.add(hover);

    // Label
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    // Hit zone
    const hit = this.add.zone(0, 0, w, h).setInteractive({ cursor: 'pointer' });
    container.add(hit);

    hit.on('pointerover', () => {
      hover.setAlpha(1);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    hit.on('pointerout', () => {
      hover.setAlpha(0);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });
    hit.on('pointerdown', callback);

    return container;
  }

  createSoundToggle() {
    const cx = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 50;

    const label = () => `[ SFX: ${gameState.sfxMuted ? 'OFF' : 'ON'} ]`;
    const btn = this.add.text(cx, y, label(), {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#444466',
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

    btn.on('pointerover', () => btn.setColor('#6666aa'));
    btn.on('pointerout',  () => btn.setColor('#444466'));
    btn.on('pointerdown', () => {
      gameState.toggleSfx();
      btn.setText(label());
    });
  }
}