import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { gameState } from '../GameState.js';

const STEPS = [
  {
    title: 'HOW TO PLAY',
    body: 'Click any group of\n3 or more same-color blocks\nto clear them!',
    color: '#00ffff',
  },
  {
    title: 'SCORE BIG',
    body: 'Bigger groups earn\nmore points.\nFill the bar to beat the level!',
    color: '#00ff88',
  },
  {
    title: 'BEAT THE CLOCK',
    body: 'You have a limited\nnumber of moves.\nUse them wisely!',
    color: '#ffff00',
  },
];

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.ONBOARDING });
    this.step = 0;
  }

  create() {
    this.step = 0;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.showStep(0);
  }

  showStep(index) {
    this.children.removeAll(true);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const s = STEPS[index];

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Card
    bg.fillStyle(0x111133, 1);
    bg.fillRect(cx - 170, cy - 170, 340, 340);
    bg.lineStyle(2, 0x4444aa, 1);
    bg.strokeRect(cx - 170, cy - 170, 340, 340);

    // Corner pixels
    bg.fillStyle(0x00ffff, 1);
    bg.fillRect(cx - 170, cy - 170, 6, 6);
    bg.fillRect(cx + 164, cy - 170, 6, 6);
    bg.fillRect(cx - 170, cy + 164, 6, 6);
    bg.fillRect(cx + 164, cy + 164, 6, 6);

    // Step indicator dots
    STEPS.forEach((_, i) => {
      const dx = cx - (STEPS.length - 1) * 10 + i * 20;
      const dot = this.add.graphics();
      dot.fillStyle(i === index ? 0x00ffff : 0x333355, 1);
      dot.fillRect(dx - 4, cy - 155, 8, 8);
    });

    this.add.text(cx, cy - 120, s.title, {
      fontFamily: '"Courier New", monospace',
      fontSize: '26px',
      color: s.color,
      stroke: '#000044',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, s.body, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ccccff',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    const isLast = index === STEPS.length - 1;
    const btnLabel = isLast ? '[ START GAME ]' : '[    NEXT    ]';
    const btnColor = isLast ? '#00ff88' : '#8888ff';

    const btn = this.add.text(cx, cy + 120, btnLabel, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: btnColor,
      stroke: '#000033',
      strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

    btn.on('pointerover', () => btn.setAlpha(0.75));
    btn.on('pointerout',  () => btn.setAlpha(1));
    btn.on('pointerdown', () => {
      if (isLast) {
        gameState.startGame(0);
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => this.scene.start(SCENES.GAME));
      } else {
        this.step++;
        this.showStep(this.step);
      }
    });

    // Skip link
    const skip = this.add.text(cx, GAME_HEIGHT - 28, '[ SKIP TUTORIAL ]', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#333366',
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    skip.on('pointerover', () => skip.setColor('#555588'));
    skip.on('pointerout',  () => skip.setColor('#333366'));
    skip.on('pointerdown', () => {
      gameState.startGame(0);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start(SCENES.GAME));
    });
  }
}
