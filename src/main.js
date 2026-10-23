import Phaser from 'phaser';
import { BootScene }     from './scenes/BootScene.js';
import { PreloadScene }  from './scenes/PreloadScene.js';
import { MenuScene }     from './scenes/MenuScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { UIScene }       from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { onPlatform }    from './ayvago/platform.js';

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
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, MenuScene, UIScene, GameScene, GameOverScene],
};

export const game = new Phaser.Game(config);

// Inside Ayvago the platform pauses the game when its tab is hidden and can mute it.
onPlatform((platform) => {
  platform.onPause(() => game.loop.sleep());
  platform.onResume(() => game.loop.wake());
  platform.onMute((muted) => {
    game.sound.mute = muted;
  });
});
