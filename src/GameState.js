import { STORAGE_KEY, getLevelConfig } from './constants.js';

class GameState {
  constructor() {
    this.reset();
    this.load();
  }

  reset() {
    this.score = 0;
    this.level = 0;
    this.moves = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalCleared = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.lastPoints = 0;
    this.tetrominosThisLevel = 0;
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.highScore = data.highScore || 0;
        this.savedLevel = data.level || 0;
        this.musicMuted = data.musicMuted || false;
        this.sfxMuted = data.sfxMuted || false;
      } else {
        this.highScore = 0;
        this.savedLevel = 0;
        this.musicMuted = false;
        this.sfxMuted = false;
      }
    } catch (e) {
      this.highScore = 0;
      this.savedLevel = 0;
      this.musicMuted = false;
      this.sfxMuted = false;
    }
  }

  save() {
    try {
      const data = {
        highScore: this.highScore,
        level: this.savedLevel,
        musicMuted: this.musicMuted,
        sfxMuted: this.sfxMuted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  startGame(level = 0) {
    this.reset();
    this.level = level;
    this.moves = getLevelConfig(level).moves;
    this.tetrominosThisLevel = 0;
  }

  recordTetromino() {
    this.tetrominosThisLevel++;
  }

  addScore(cells, combo) {
    const base = cells * 100;
    const comboBonus = combo > 1 ? Math.floor(base * (combo - 1) * 0.5) : 0;
    const points = base + comboBonus;
    this.score += points;
    this.lastPoints = points;
    this.combo = combo;
    if (combo > this.maxCombo) this.maxCombo = combo;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.save();
    }
    return points;
  }

  useMove() {
    this.moves--;
    if (this.moves <= 0) {
      this.moves = 0;
    }
  }

  checkLevelComplete() {
    const lvl = getLevelConfig(this.level);
    if (this.score < lvl.target) return false;
    if (lvl.tetrominosRequired && this.tetrominosThisLevel < lvl.tetrominosRequired) return false;
    return true;
  }

  checkGameOver() {
    return this.moves <= 0 && !this.checkLevelComplete();
  }

  nextLevel() {
    this.level++;
    this.moves = getLevelConfig(this.level).moves;
    this.combo = 0;
    this.tetrominosThisLevel = 0;
    this.savedLevel = this.level;
    this.save();
    return true;
  }

  getLevelData() {
    return getLevelConfig(this.level);
  }

  getProgress() {
    const lvl = getLevelConfig(this.level);
    return Math.min(1, this.score / lvl.target);
  }

  // Returns 0–1 progress toward the tetromino requirement (1 if no requirement).
  getTetrominoProgress() {
    const req = getLevelConfig(this.level).tetrominosRequired || 0;
    if (!req) return 1;
    return Math.min(1, this.tetrominosThisLevel / req);
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    this.save();
    return this.musicMuted;
  }

  toggleSfx() {
    this.sfxMuted = !this.sfxMuted;
    this.save();
    return this.sfxMuted;
  }
}

export const gameState = new GameState();