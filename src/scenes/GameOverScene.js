import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { gameState } from '../GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Scanlines
    bg.fillStyle(0x000000, 0.06);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      bg.fillRect(0, y, GAME_WIDTH, 2);
    }

    const isVictory = gameState.checkLevelComplete();
    const titleText  = isVictory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = isVictory ? '#00ff88'  : '#ff4444';

    // Title — anchored above vertical center
    const title = this.add.text(cx, cy - 180, titleText, {
      fontFamily: '"Courier New", monospace',
      fontSize: '44px',
      color: titleColor,
      stroke: '#000033',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 200 });

    // Stats panel — centered on canvas
    const panelY = cy - 100;
    const panel = this.add.graphics();
    panel.fillStyle(0x111133, 0.92);
    panel.fillRect(cx - 155, panelY, 310, 190);
    panel.lineStyle(2, 0x4444aa, 1);
    panel.strokeRect(cx - 155, panelY, 310, 190);

    // Score row
    this.add.text(cx - 100, panelY + 35, 'SCORE', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#8888ff',
    }).setOrigin(0, 0.5);
    const scoreDisp = this.add.text(cx + 110, panelY + 35, '000000', {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#ffff00',
    }).setOrigin(1, 0.5);

    // Best row
    this.add.text(cx - 100, panelY + 80, 'BEST', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#8888ff',
    }).setOrigin(0, 0.5);
    this.add.text(cx + 110, panelY + 80, gameState.highScore.toString().padStart(6, '0'), {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(1, 0.5);

    // Level row
    this.add.text(cx - 100, panelY + 125, 'LEVEL', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#8888ff',
    }).setOrigin(0, 0.5);
    this.add.text(cx + 110, panelY + 125, (gameState.level + 1).toString(), {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#00ff88',
    }).setOrigin(1, 0.5);

    // New high score badge
    if (gameState.score > 0 && gameState.score >= gameState.highScore) {
      const badge = this.add.text(cx, panelY + 168, '★  NEW HIGH SCORE!  ★', {
        fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#ffff00',
      }).setOrigin(0.5);
      this.tweens.add({ targets: badge, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }

    // Animate score count-up
    this.countUp(scoreDisp, gameState.score, 1200);

    // Buttons — anchored below vertical center
    const retryBtn = this.add.text(cx, cy + 138, '[ PLAY AGAIN ]', {
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color: '#00ff88',
      stroke: '#004422',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    retryBtn.on('pointerover', () => retryBtn.setAlpha(0.75));
    retryBtn.on('pointerout',  () => retryBtn.setAlpha(1));
    retryBtn.on('pointerdown', () => {
      gameState.startGame(0);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start(SCENES.GAME));
    });

    const menuBtn = this.add.text(cx, cy + 208, '[ MAIN MENU ]', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#8888ff',
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    menuBtn.on('pointerover', () => menuBtn.setAlpha(0.75));
    menuBtn.on('pointerout',  () => menuBtn.setAlpha(1));
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start(SCENES.MENU));
    });

    // Notify CrazyGames
    try {
      if (window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (_) {}
  }

  countUp(textObj, target, duration) {
    const obj = { v: 0 };
    this.tweens.add({
      targets: obj,
      v: target,
      duration,
      ease: 'Power2',
      onUpdate: () => textObj.setText(Math.floor(obj.v).toString().padStart(6, '0')),
      onComplete: () => textObj.setText(target.toString().padStart(6, '0')),
    });
  }
}
