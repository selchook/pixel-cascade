import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

const BLOCK_COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    this.load.setBaseURL('./');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x000000, 0.08);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      bg.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Animated pixel-block row
    const blocks = this.add.graphics();
    const bCount = BLOCK_COLORS.length;
    const bSize  = 14;
    const bGap   = 4;
    const rowW   = bCount * (bSize + bGap) - bGap;
    BLOCK_COLORS.forEach((color, i) => {
      const bx = cx - rowW / 2 + i * (bSize + bGap);
      blocks.fillStyle(color, 0.9);
      blocks.fillRect(bx, cy - 110, bSize, bSize);
      blocks.lineStyle(1, 0x000000, 0.45);
      blocks.strokeRect(bx, cy - 110, bSize, bSize);
    });
    this.tweens.add({
      targets: blocks, y: '-=6',
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Title
    this.add.text(cx, cy - 62, 'PIXEL CASCADE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '38px',
      color: '#00ffff',
      stroke: '#0044aa',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 22, '[ MATCH & CLEAR ]', {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#8888ff',
    }).setOrigin(0.5);

    // "LOADING" label
    this.add.text(cx, cy + 55, 'LOADING', {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#444466',
    }).setOrigin(0.5);

    // Dot-pip progress animation
    this._dots = this.add.graphics();
    this._dotTick = 0;
    this._dotTimer = this.time.addEvent({
      delay: 180, callback: this._stepDots, callbackScope: this, loop: true,
    });
    this._stepDots();

    // SDK init + hand off to PreloadScene
    this._boot();
  }

  _stepDots() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const total = 6;
    const lit   = (this._dotTick % (total + 1));
    const dotW  = 7;
    const gap   = 5;
    const rowW  = total * dotW + (total - 1) * gap;

    this._dots.clear();
    for (let i = 0; i < total; i++) {
      this._dots.fillStyle(i < lit ? 0x00ccff : 0x1a1a33, 1);
      this._dots.fillRect(cx - rowW / 2 + i * (dotW + gap), cy + 75, dotW, dotW);
    }
    this._dotTick++;
  }

  async _boot() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.start(SCENES.PRELOAD));
  }
}
