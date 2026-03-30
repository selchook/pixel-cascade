import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    // Load minimal assets needed for preloader
    this.load.setBaseURL('./');
  }

  create() {
    // Initialize CrazyGames SDK
    this.initSDK();
  }

  async initSDK() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK) {
        await window.CrazyGames.SDK.init();
        console.log('CrazyGames SDK initialized');
      }
    } catch (e) {
      console.log('CrazyGames SDK not available:', e);
    }
    this.scene.start(SCENES.PRELOAD);
  }
}