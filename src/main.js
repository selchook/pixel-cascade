import Phaser from 'phaser';
import { BootScene }     from './scenes/BootScene.js';
import { PreloadScene }  from './scenes/PreloadScene.js';
import { MenuScene }     from './scenes/MenuScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { UIScene }       from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const GAME_W = 480;
const GAME_H = 640;

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, MenuScene, UIScene, GameScene, GameOverScene],
};

export const game = new Phaser.Game(config);
