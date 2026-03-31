import {
  SCENES, GAME_WIDTH, GAME_HEIGHT,
  COLS, ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y,
  MIN_MATCH,
} from '../constants.js';
import { gameState } from '../GameState.js';

const FALLBACK_COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22];

// ─── Tetromino detection ─────────────────────────────────────────────────────
// All 19 unique tetromino orientations, stored as sorted normalized cell keys.
const TETROMINO_SHAPES = new Set([
  // I (2)
  '0,0|0,1|0,2|0,3',
  '0,0|1,0|2,0|3,0',
  // O (1)
  '0,0|0,1|1,0|1,1',
  // T (4)
  '0,1|1,0|1,1|1,2',
  '0,0|1,0|1,1|2,0',
  '0,0|0,1|0,2|1,1',
  '0,1|1,0|1,1|2,1',
  // S (2)
  '0,1|0,2|1,0|1,1',
  '0,0|1,0|1,1|2,1',
  // Z (2)
  '0,0|0,1|1,1|1,2',
  '0,1|1,0|1,1|2,0',
  // J (4)
  '0,0|1,0|1,1|1,2',
  '0,0|0,1|1,0|2,0',
  '0,0|0,1|0,2|1,2',
  '0,1|1,1|2,0|2,1',
  // L (4)
  '0,2|1,0|1,1|1,2',
  '0,0|1,0|2,0|2,1',
  '0,0|0,1|0,2|1,0',
  '0,0|0,1|1,1|2,1',
]);

function normalizeShape(cells) {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const norm = cells.map(([r, c]) => [r - minR, c - minC]);
  norm.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
  return norm.map(([r, c]) => `${r},${c}`).join('|');
}

// Returns true if the cells form any standard tetromino orientation.
function isTetromino(cells) {
  if (cells.length !== 4) return false;
  return TETROMINO_SHAPES.has(normalizeShape(cells));
}

// ─── Scene ───────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
    this.grid = [];
    this.sprites = [];
    this.isProcessing = false;
    this.tapsPips = null;
    this.totalTapsThisLevel = 0;
  }

  create() {
    if (!gameState.moves) {
      gameState.startGame(gameState.savedLevel || 0);
    }

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.createBackground();
    this.initGrid();
    this.createSprites();
    this.createHUD();

    this.input.on('pointerdown', this.handleClick, this);
  }

  createBackground() {
    if (this.textures.exists('background')) {
      this.add.image(0, 0, 'background').setOrigin(0, 0);
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(0x0a0a1a, 1);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (this.textures.exists('grid')) {
      this.add.image(GRID_OFFSET_X - 2, GRID_OFFSET_Y - 2, 'grid').setOrigin(0, 0);
    } else {
      const g = this.add.graphics();
      g.lineStyle(1, 0x222244, 0.8);
      for (let c = 0; c <= COLS; c++) {
        g.lineBetween(
          GRID_OFFSET_X + c * CELL_SIZE, GRID_OFFSET_Y,
          GRID_OFFSET_X + c * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE
        );
      }
      for (let r = 0; r <= ROWS; r++) {
        g.lineBetween(
          GRID_OFFSET_X, GRID_OFFSET_Y + r * CELL_SIZE,
          GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + r * CELL_SIZE
        );
      }
    }
  }

  // ─── Board generation helpers ─────────────────────────────────────────────

  // Probability (0–0.75) that a cell rerolls its color when it would match a neighbor.
  // Higher = clusters are rarer = combos harder to spot.
  getColorBias() {
    const lvl = gameState.level;
    if (lvl < 5)  return 0.00;
    if (lvl < 10) return 0.30;
    if (lvl < 15) return 0.50;
    if (lvl < 20) return 0.65;
    return 0.75;
  }

  // Pick a color for (r,c), biased to avoid colors already present in neighbors.
  pickColor(r, c, numColors, bias) {
    let color = Phaser.Math.Between(0, numColors - 1);
    if (bias <= 0) return color;
    const neighborColors = new Set();
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
          this.grid[nr] && this.grid[nr][nc] !== undefined && this.grid[nr][nc] !== -1) {
        neighborColors.add(this.grid[nr][nc]);
      }
    });
    if (neighborColors.has(color) && Math.random() < bias) {
      const alts = [];
      for (let i = 0; i < numColors; i++) { if (!neighborColors.has(i)) alts.push(i); }
      if (alts.length > 0) color = alts[Math.floor(Math.random() * alts.length)];
    }
    return color;
  }

  // Returns true if the current grid has at least one group of >= MIN_MATCH adjacent same-color cells.
  hasAnyValidGroup() {
    const visited = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] < 0) continue;
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        const group = this.findGroup(r, c);
        group.forEach(([gr,gc]) => visited.add(`${gr},${gc}`));
        if (group.length >= MIN_MATCH) return true;
      }
    }
    return false;
  }

  // Last-resort: force 3 horizontally adjacent cells to the same color.
  // Destroys & respawns sprites for any cells that already had one.
  forceGuaranteeMatch(numColors) {
    const color = Phaser.Math.Between(0, numColors - 1);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - MIN_MATCH; c++) {
        for (let i = 0; i < MIN_MATCH; i++) {
          this.grid[r][c + i] = color;
          if (this.sprites && this.sprites[r] && this.sprites[r][c + i]) {
            this.sprites[r][c + i].destroy();
            this.sprites[r][c + i] = null;
          }
          if (this.sprites && this.sprites[r]) this.spawnSprite(r, c + i);
        }
        return;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────

  initGrid() {
    const numColors = (gameState.getLevelData() || {}).colors || 4;
    const bias = this.getColorBias();
    this.sprites = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    let attempts = 0;
    do {
      this.grid = [];
      for (let r = 0; r < ROWS; r++) {
        this.grid[r] = [];
        for (let c = 0; c < COLS; c++) {
          this.grid[r][c] = this.pickColor(r, c, numColors, bias);
        }
      }
    } while (!this.hasAnyValidGroup() && ++attempts < 20);

    // Absolute safety net (sprites are all null here, createSprites handles them)
    if (!this.hasAnyValidGroup()) {
      const color = Phaser.Math.Between(0, numColors - 1);
      this.grid[0][0] = this.grid[0][1] = this.grid[0][2] = color;
    }
  }

  createSprites() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.spawnSprite(r, c);
      }
    }
  }

  spawnSprite(r, c) {
    const colorIdx = this.grid[r][c];
    if (colorIdx === -1) { this.sprites[r][c] = null; return; }
    const x = GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
    const y = GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
    const key = `block_${colorIdx}`;
    const img = this.textures.exists(key)
      ? this.add.image(x, y, key)
      : this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2, FALLBACK_COLORS[colorIdx]);
    this.sprites[r][c] = img;
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  handleClick(pointer) {
    if (this.isProcessing || gameState.isGameOver) return;

    const col = Math.floor((pointer.x - GRID_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((pointer.y - GRID_OFFSET_Y) / CELL_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    if (this.grid[row][col] === -1) return;

    const group = this.findGroup(row, col);

    if (group.length < MIN_MATCH) {
      // ── Idle tap: consumes a move even though no match ──────────────────
      this.isProcessing = true;
      gameState.useMove();
      this.flashInvalid(group);
      this.showMissText(group);
      this.time.delayedCall(260, () => {
        this.checkEndConditions();
        this.isProcessing = false;
      });
      return;
    }

    this.isProcessing = true;
    gameState.useMove();

    const blast = isTetromino(group);

    this.clearGroup(group, blast, () => {
      this.applyGravity(() => {
        this.refill(() => {
          this.checkEndConditions();
          this.isProcessing = false;
        });
      });
    });
  }

  findGroup(startRow, startCol) {
    const color = this.grid[startRow][startCol];
    const visited = new Set();
    const group = [];
    const stack = [[startRow, startCol]];
    while (stack.length) {
      const [r, c] = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (this.grid[r][c] !== color) continue;
      visited.add(key);
      group.push([r, c]);
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
    return group;
  }

  flashInvalid(group) {
    group.forEach(([r, c]) => {
      const s = this.sprites[r][c];
      if (s) this.tweens.add({ targets: s, alpha: 0.2, duration: 65, yoyo: true, repeat: 2 });
    });
  }

  showMissText(group) {
    const [r, c] = group[Math.floor(group.length / 2)];
    const x = GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
    const y = GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
    const t = this.add.text(x, y, 'MISS', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: t, y: y - 42, alpha: 0,
      duration: 550, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  // ─── Match clearing ───────────────────────────────────────────────────────

  // blast=true when group forms a tetromino — triggers special explosion effect
  clearGroup(group, blast, callback) {
    // 2x score multiplier for tetromino shapes
    const points = gameState.addScore(group.length, blast ? 2 : 1);
    if (blast) gameState.recordTetromino();
    this.showScorePopup(group, points, blast);
    this.updateHUD();

    if (blast) {
      this.cameras.main.shake(240, 0.007);
      this.showBlastLabel(group);
    }

    let done = 0;
    const onDone = () => { if (++done === group.length) callback(); };

    group.forEach(([r, c]) => {
      const s = this.sprites[r][c];
      this.grid[r][c] = -1;
      this.sprites[r][c] = null;

      if (!s) { onDone(); return; }

      if (blast) {
        // Gold flash → scale-up → explode outward
        const sx = GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
        const sy = GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
        s.setTint(0xffdd00);
        this.tweens.add({
          targets: s,
          scaleX: 1.6, scaleY: 1.6,
          duration: 100, ease: 'Power2',
          onComplete: () => {
            this.spawnShockwave(sx, sy);
            this.tweens.add({
              targets: s,
              scaleX: 0, scaleY: 0, alpha: 0,
              duration: 220, ease: 'Expo.easeOut',
              onComplete: () => { s.destroy(); onDone(); },
            });
          },
        });
      } else {
        // Normal shrink
        this.tweens.add({
          targets: s,
          scaleX: 0, scaleY: 0, alpha: 0,
          duration: 180, ease: 'Back.easeIn',
          onComplete: () => { s.destroy(); onDone(); },
        });
      }
    });
  }

  spawnShockwave(x, y) {
    const ring = this.add.graphics().setDepth(9);
    ring.lineStyle(3, 0xffdd00, 1);
    ring.strokeCircle(0, 0, 8);
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scaleX: 5, scaleY: 5, alpha: 0,
      duration: 380, ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  showBlastLabel(group) {
    let ax = 0, ay = 0;
    group.forEach(([r, c]) => {
      ax += GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
      ay += GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
    });
    ax /= group.length;
    ay /= group.length;
    const t = this.add.text(ax, ay - 16, 'TETRIS BLAST!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '17px',
      color: '#ffdd00',
      stroke: '#884400',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    this.tweens.add({
      targets: t,
      y: ay - 72, scaleX: 1.25, scaleY: 1.25, alpha: 0,
      duration: 1100, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  showScorePopup(group, points, blast = false) {
    let ax = 0, ay = 0;
    group.forEach(([r, c]) => {
      ax += GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
      ay += GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
    });
    ax /= group.length;
    ay /= group.length;
    const t = this.add.text(ax, ay, `+${points}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: blast ? '22px' : '18px',
      color: blast ? '#ffaa00' : '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: t, y: ay - 60, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  // ─── Physics ──────────────────────────────────────────────────────────────

  applyGravity(callback) {
    let maxDur = 0;
    for (let c = 0; c < COLS; c++) {
      let slot = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== -1) {
          if (r !== slot) {
            this.grid[slot][c] = this.grid[r][c];
            this.grid[r][c] = -1;
            const s = this.sprites[r][c];
            this.sprites[slot][c] = s;
            this.sprites[r][c] = null;
            if (s) {
              const targetY = GRID_OFFSET_Y + slot * CELL_SIZE + CELL_SIZE / 2;
              const dur = 100 + (slot - r) * 35;
              maxDur = Math.max(maxDur, dur);
              this.tweens.add({ targets: s, y: targetY, duration: dur, ease: 'Cubic.easeIn' });
            }
          }
          slot--;
        }
      }
    }
    this.time.delayedCall(maxDur + 60, callback);
  }

  refill(callback) {
    const numColors = (gameState.getLevelData() || {}).colors || 4;
    const bias = this.getColorBias();

    // Step 1 — collect empty positions
    const emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === -1) emptyCells.push([r, c]);
      }
    }

    // Step 2 — assign colors with bias, retry until a valid group exists
    let attempts = 0;
    do {
      for (const [r, c] of emptyCells) {
        this.grid[r][c] = this.pickColor(r, c, numColors, bias);
      }
    } while (!this.hasAnyValidGroup() && ++attempts < 20);

    // Step 3 — absolute fallback if still no valid group
    if (!this.hasAnyValidGroup()) this.forceGuaranteeMatch(numColors);

    // Step 4 — create fall-in sprites for every newly filled cell
    let count = 0;
    for (const [r, c] of emptyCells) {
      if (this.sprites[r][c]) continue; // already handled by forceGuaranteeMatch
      const x = GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
      const y = GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
      const key = `block_${this.grid[r][c]}`;
      const img = this.textures.exists(key)
        ? this.add.image(x, y - CELL_SIZE * 2, key)
        : this.add.rectangle(x, y - CELL_SIZE * 2, CELL_SIZE - 2, CELL_SIZE - 2, FALLBACK_COLORS[this.grid[r][c]]);
      img.setAlpha(0);
      this.sprites[r][c] = img;
      this.tweens.add({
        targets: img, y, alpha: 1,
        duration: 200, delay: count * 15, ease: 'Back.easeOut',
      });
      count++;
    }
    this.time.delayedCall(count * 15 + 250, callback);
  }

  // ─── Level progression ────────────────────────────────────────────────────

  checkEndConditions() {
    this.updateHUD();

    if (gameState.checkLevelComplete()) {
      this.isProcessing = true;
      this.time.delayedCall(600, () => {
        gameState.nextLevel();
        this.showLevelBanner(`LEVEL ${gameState.level + 1}`, '#00ff88', () => {
          this.resetForNextLevel();
        });
      });
    } else if (gameState.checkGameOver()) {
      gameState.isGameOver = true;
      this.time.delayedCall(600, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => this.scene.start(SCENES.GAME_OVER));
      });
    }
  }

  resetForNextLevel() {
    // Levels 1–10: keep existing board, just refresh HUD/pips.
    // Level 11+: repuzzle the whole board with a wipe-and-refill animation.
    if (gameState.level < 10) {
      this.createTapsPips(gameState.getLevelData().moves);
      this.updateHUD();
      this.isProcessing = false;
      return;
    }

    // Collect every live sprite before wiping
    const oldSprites = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.sprites[r][c]) oldSprites.push(this.sprites[r][c]);
        this.sprites[r][c] = null;
      }
    }

    const rebuild = () => {
      this.initGrid(); // fresh colors + bias, sprites reset to null-array inside
      this.createSpritesAnimated(() => {
        this.createTapsPips(gameState.getLevelData().moves);
        this.updateHUD();
        this.isProcessing = false;
      });
    };

    if (oldSprites.length > 0) {
      this.tweens.add({
        targets: oldSprites,
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: 200, ease: 'Back.easeIn',
        onComplete: () => { oldSprites.forEach(s => s.destroy()); rebuild(); },
      });
    } else {
      rebuild();
    }
  }

  // Animates all grid cells falling in from above (used after a full board repuzzle).
  createSpritesAnimated(callback) {
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.sprites[r][c] || this.grid[r][c] === -1) continue;
        const x = GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
        const y = GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
        const key = `block_${this.grid[r][c]}`;
        const img = this.textures.exists(key)
          ? this.add.image(x, y - CELL_SIZE * 2, key)
          : this.add.rectangle(x, y - CELL_SIZE * 2, CELL_SIZE - 2, CELL_SIZE - 2, FALLBACK_COLORS[this.grid[r][c]]);
        img.setAlpha(0);
        this.sprites[r][c] = img;
        this.tweens.add({
          targets: img, y, alpha: 1,
          duration: 200, delay: count * 12, ease: 'Back.easeOut',
        });
        count++;
      }
    }
    if (callback) this.time.delayedCall(count * 12 + 260, callback);
  }

  showLevelBanner(msg, color, callback) {
    const cx = GAME_WIDTH / 2;
    const bannerY = GAME_HEIGHT / 2;
    const levelData = gameState.getLevelData();
    const tetrominosReq = levelData ? (levelData.tetrominosRequired || 0) : 0;
    const bannerH = tetrominosReq ? 88 : 68;

    const bg = this.add.graphics().setDepth(20);
    bg.fillStyle(0x000022, 0.88);
    bg.fillRect(cx - 160, bannerY - 34, 320, bannerH);
    bg.lineStyle(2, tetrominosReq ? 0xffdd00 : 0x00ff88, 1);
    bg.strokeRect(cx - 160, bannerY - 34, 320, bannerH);

    const title = this.add.text(cx, bannerY - 14, msg, {
      fontFamily: '"Courier New", monospace', fontSize: '28px', color,
      stroke: '#000033', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);

    const sub = this.add.text(cx, bannerY + 16, `TARGET ${levelData ? levelData.target.toLocaleString() : ''}  MOVES ${levelData ? levelData.moves : ''}`, {
      fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#8888cc',
    }).setOrigin(0.5).setDepth(21);

    const items = [bg, title, sub];

    if (tetrominosReq) {
      const blastLine = this.add.text(cx, bannerY + 38, `◆ NEED ${tetrominosReq} TETRIS BLAST${tetrominosReq > 1 ? 'S' : ''}`, {
        fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#ffdd00',
        stroke: '#884400', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(21);
      items.push(blastLine);
    }

    items.forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: items, alpha: 1, duration: 180, ease: 'Power2' });

    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: items, alpha: 0, duration: 220, ease: 'Power2',
        onComplete: () => { items.forEach(o => o.destroy()); callback(); },
      });
    });
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  createHUD() {
    const cx = GAME_WIDTH / 2;
    const labelY = 18;
    const valY = labelY + 18;

    this.add.text(cx - 110, labelY, 'SCORE', {
      fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#8888ff',
    }).setOrigin(0.5);
    this.scoreVal = this.add.text(cx - 110, valY, '000000', {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(cx, labelY, 'TAPS', {
      fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#8888ff',
    }).setOrigin(0.5);
    this.movesVal = this.add.text(cx, valY, '20', {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx + 110, labelY, 'LEVEL', {
      fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#8888ff',
    }).setOrigin(0.5);
    this.levelVal = this.add.text(cx + 110, valY, '1', {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#00ff88',
    }).setOrigin(0.5);

    // Taps-remain pip row
    this.tapsPips = this.add.graphics();
    this.createTapsPips(gameState.getLevelData().moves);

    // Score progress bar (top track) + tetromino progress track below it
    const barY = GRID_OFFSET_Y - 8;
    const bgBars = this.add.graphics();
    bgBars.fillStyle(0x222244, 1).fillRect(GRID_OFFSET_X, barY, COLS * CELL_SIZE, 6);
    bgBars.fillStyle(0x221100, 1).fillRect(GRID_OFFSET_X, barY + 7, COLS * CELL_SIZE, 4);
    this.progressBar = this.add.graphics();

    // Tetromino-blast progress counter — stacked under LEVEL, visible only when required (level 11+)
    this.blastLabel = this.add.text(cx + 110, valY + 10, '◆ BLASTS', {
      fontFamily: '"Courier New", monospace', fontSize: '9px', color: '#ffdd00',
    }).setOrigin(0.5).setDepth(5).setVisible(false);
    this.blastVal = this.add.text(cx + 110, valY + 22, '0/0', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#ffaa00',
    }).setOrigin(0.5).setDepth(5).setVisible(false);

    // Pause button
    const pauseBtn = this.add.text(GAME_WIDTH - 20, labelY, '| |', {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#555577',
    }).setOrigin(1, 0.5).setInteractive({ cursor: 'pointer' });
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#8888aa'));
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#555577'));
    pauseBtn.on('pointerdown', () => this.showPause());

    this.updateHUD();
  }

  createTapsPips(totalTaps) {
    this.totalTapsThisLevel = totalTaps;
    this.refreshTapsPips();
  }

  // One pip per available tap. Color shifts blue → orange → red as taps run low.
  refreshTapsPips() {
    if (!this.tapsPips) return;
    const total = this.totalTapsThisLevel;
    const remaining = gameState.moves;
    const barX = GRID_OFFSET_X;
    const barY = GRID_OFFSET_Y - 22;
    const barW = COLS * CELL_SIZE;
    const gap = 2;
    const pipW = Math.max(4, Math.floor((barW - gap * (total - 1)) / total));

    this.tapsPips.clear();
    for (let i = 0; i < total; i++) {
      const x = barX + i * (pipW + gap);
      if (i < remaining) {
        const urgency = remaining / total;
        const color = urgency > 0.4 ? 0x00aaff : urgency > 0.2 ? 0xffaa00 : 0xff4444;
        this.tapsPips.fillStyle(color, 1);
      } else {
        this.tapsPips.fillStyle(0x1a1a33, 1);
      }
      this.tapsPips.fillRect(x, barY, pipW, 8);
    }
  }

  updateHUD() {
    if (this.scoreVal) this.scoreVal.setText(gameState.score.toString().padStart(6, '0'));
    if (this.movesVal) {
      this.movesVal.setText(gameState.moves.toString());
      this.movesVal.setColor(gameState.moves <= 3 ? '#ff4444' : gameState.moves <= 6 ? '#ffaa00' : '#ffffff');
    }
    if (this.levelVal) this.levelVal.setText((gameState.level + 1).toString());

    // Blast progress counter (level 11+)
    const lvlData = gameState.getLevelData();
    const req = lvlData ? (lvlData.tetrominosRequired || 0) : 0;
    if (this.blastLabel && this.blastVal) {
      if (req > 0) {
        const done = gameState.tetrominosThisLevel;
        const met  = done >= req;
        this.blastLabel.setVisible(true);
        this.blastVal.setText(`${done}/${req}`)
          .setColor(met ? '#00ff88' : '#ffaa00').setVisible(true);
      } else {
        this.blastLabel.setVisible(false);
        this.blastVal.setVisible(false);
      }
    }

    if (this.progressBar) {
      const barY = GRID_OFFSET_Y - 8;
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff88, 1);
      this.progressBar.fillRect(GRID_OFFSET_X, barY, COLS * CELL_SIZE * gameState.getProgress(), 6);

      // Second bar segment for tetromino progress when required
      if (req > 0) {
        this.progressBar.fillStyle(0xffdd00, 1);
        this.progressBar.fillRect(GRID_OFFSET_X, barY + 7, COLS * CELL_SIZE * gameState.getTetrominoProgress(), 4);
      }
    }
    this.refreshTapsPips();
  }

  // ─── Pause ────────────────────────────────────────────────────────────────

  showPause() {
    this.isProcessing = true;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.82);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleTxt = this.add.text(cx, cy - 90, 'PAUSED', {
      fontFamily: '"Courier New", monospace', fontSize: '36px', color: '#00ffff',
    }).setOrigin(0.5).setDepth(31);

    const close = () => {
      overlay.destroy(); titleTxt.destroy();
      resumeBtn.destroy(); restartBtn.destroy(); menuBtn.destroy();
      this.isProcessing = false;
    };

    const resumeBtn = this.add.text(cx, cy, '[ RESUME ]', {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#00ff88',
    }).setOrigin(0.5).setDepth(31).setInteractive({ cursor: 'pointer' });
    resumeBtn.on('pointerdown', close);

    const restartBtn = this.add.text(cx, cy + 60, '[ RESTART ]', {
      fontFamily: '"Courier New", monospace', fontSize: '20px', color: '#ffaa00',
    }).setOrigin(0.5).setDepth(31).setInteractive({ cursor: 'pointer' });
    restartBtn.on('pointerdown', () => {
      gameState.startGame(gameState.level);
      this.scene.restart();
    });

    const menuBtn = this.add.text(cx, cy + 120, '[ MAIN MENU ]', {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#ff5555',
    }).setOrigin(0.5).setDepth(31).setInteractive({ cursor: 'pointer' });
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start(SCENES.MENU));
    });
  }
}
