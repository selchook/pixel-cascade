# Error Reference Guide
## Retro Pixel Puzzle Game — Phaser 3 / CrazyGames / Web

---

## 1. npm install / Vite Build Errors

### ERR_MODULE_NOT_FOUND — Phaser not resolved

```
Error: Cannot find module 'phaser'
```

**Fix:**
```bash
npm install phaser@3.87.0
npm install --save-dev vite
```

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  }
})
```

---

### VITE_BUILD_FAILED — Top-level await not supported

```
Error: Top-level await is not available in the configured target environment
```

**Fix:**
```js
// vite.config.js
export default defineConfig({
  build: {
    target: 'esnext'  // change from 'es2015'
  }
})
```

---

### NODE_VERSION_MISMATCH

```
error: The engine "node" is incompatible with this module.
```

**Fix:**
```bash
nvm install 20
nvm use 20
npm install
```

```json
// package.json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

### PEER_DEP_CONFLICT — Dependency tree conflict

```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Fix:**
```bash
npm install --legacy-peer-deps
# or clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 2. Phaser 3 Engine Errors

### PHASER_IMPORT_FAILED — Incorrect import style

```
TypeError: Phaser is not a constructor
SyntaxError: The requested module 'phaser' does not provide an export named 'Game'
```

**Fix:**
```js
// ✅ Correct — default import (namespace)
import Phaser from 'phaser'

// ✅ Also correct — full namespace
import * as Phaser from 'phaser'
```

---

### PHASER_CONFIG_INVALID — Game fails to start silently

**Minimal valid config for retro pixel puzzle game:**
```js
// src/main.js
import Phaser from 'phaser'
import { BootScene }    from './scenes/BootScene.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { MenuScene }    from './scenes/MenuScene.js'
import { GameScene }    from './scenes/GameScene.js'
import { UIScene }      from './scenes/UIScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'

const config = {
  type: Phaser.AUTO,          // WebGL → Canvas fallback
  width: 480,
  height: 640,
  backgroundColor: '#0a0a1a',
  pixelArt: true,             // REQUIRED — disables texture smoothing
  antialias: false,           // REQUIRED — preserves pixel crispness
  roundPixels: true,          // prevents sub-pixel blurring
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, PreloadScene, MenuScene, UIScene, GameScene, GameOverScene]
}

export const game = new Phaser.Game(config)
```

**Common mistakes:**
- Forgetting to close the `config` object (missing `}` before `new Phaser.Game(config)`)
- Omitting the `scene` array entirely — game loads but shows blank screen
- Missing `export const game = new Phaser.Game(config)` — nothing runs

---

## 3. Missing Constants Errors

### MISSING_CONSTANTS — SCENES / STORAGE_KEY / LEVELS not exported

```
SyntaxError: The requested module '../constants.js' does not provide an export named 'SCENES'
TypeError: Cannot read properties of undefined (reading 'BOOT')
TypeError: Cannot read properties of undefined (reading 'moves')
```

**Cause:** `constants.js` was missing the `SCENES` enum, `STORAGE_KEY`, and `LEVELS` array that all scenes and `GameState` depend on.

**Fix — add to `src/constants.js`:**
```js
export const SCENES = {
  BOOT:       'BootScene',
  PRELOAD:    'PreloadScene',
  MENU:       'MenuScene',
  ONBOARDING: 'UIScene',
  GAME:       'GameScene',
  GAME_OVER:  'GameOverScene',
};

export const STORAGE_KEY = 'pixel_cascade_save';

export const LEVELS = [
  { moves: 30, target: 1000,  colors: 3 },
  { moves: 28, target: 2500,  colors: 4 },
  { moves: 26, target: 4000,  colors: 4 },
  { moves: 25, target: 6000,  colors: 5 },
  { moves: 24, target: 8500,  colors: 5 },
  { moves: 23, target: 11000, colors: 5 },
  { moves: 22, target: 14000, colors: 6 },
  { moves: 21, target: 17500, colors: 6 },
  { moves: 20, target: 21000, colors: 6 },
  { moves: 20, target: 25000, colors: 6 },
];
```

**Rules:**
- `SCENES` keys must match the `key` string passed to `super({ key: ... })` in each scene constructor.
- `STORAGE_KEY` is used by `GameState` for `localStorage.getItem/setItem`.
- Each `LEVELS` entry must have `moves` (number of moves allowed) and `target` (score to beat).

---

## 4. Missing Scene Files

### MISSING_SCENE_FILE — Imported scene class not found

```
[vite:build-html] Failed to parse source for import analysis
Error: Cannot find module './scenes/GameScene.js'
Error: Cannot find module './scenes/UIScene.js'
Error: Cannot find module './scenes/GameOverScene.js'
```

**Cause:** `main.js` imports three scenes that did not exist on disk.

**Fix:** Create the missing files:
- `src/scenes/GameScene.js` — core match-3 gameplay (grid, input, cascade, scoring)
- `src/scenes/UIScene.js` — onboarding/tutorial scene (key: `SCENES.ONBOARDING`)
- `src/scenes/GameOverScene.js` — score reveal and retry/menu buttons

**Scene key mapping:**
| File | Constructor key | Used via |
|------|----------------|---------|
| `BootScene.js` | `SCENES.BOOT` | first in scene array |
| `PreloadScene.js` | `SCENES.PRELOAD` | `scene.start(SCENES.PRELOAD)` |
| `MenuScene.js` | `SCENES.MENU` | `scene.start(SCENES.MENU)` |
| `UIScene.js` | `SCENES.ONBOARDING` | `scene.start(SCENES.ONBOARDING)` |
| `GameScene.js` | `SCENES.GAME` | `scene.start(SCENES.GAME)` |
| `GameOverScene.js` | `SCENES.GAME_OVER` | `scene.start(SCENES.GAME_OVER)` |

---

## 5. CommonJS require() in ES Module

### REQUIRE_IN_ESM — `require` is not defined

```
ReferenceError: require is not defined
```

**Cause:** `PreloadScene.js` contained a CommonJS `require()` call inside an ES module file:
```js
// ❌ Wrong — CommonJS require inside ES module
const { COLS, ROWS, CELL_SIZE } = require('../constants.js');
```

**Fix:** Remove the `require()` line. All needed values are already available via the ES `import` at the top of the file, or use hardcoded local variables:
```js
// ✅ Already imported at top of file
import { CELL_SIZE } from '../constants.js';

generateGridTexture() {
  const cols = 8;   // use local constants
  const rows = 10;
  const cs = CELL_SIZE;  // from top-level import
  ...
}
```

---

## 6. Truncated / Incomplete Source Files

### FILE_TRUNCATED — Syntax error from incomplete file

```
[vite:build-html] Failed to parse source for import analysis because the content contains invalid JS syntax.
SyntaxError: Unexpected end of input
```

**Affected files and symptoms:**

| File | Symptom |
|------|---------|
| `src/main.js` | Config object not closed; no `scene` array; no `new Phaser.Game()` call |
| `src/scenes/MenuScene.js` | `createButton()` method cut off mid-statement; `createSoundToggle()` missing entirely; class closing `}` missing |

**Fix for `main.js`:** Close the config object and add the scene array + game instantiation (see §2 above for the complete template).

**Fix for `MenuScene.js`:** Complete the `createButton` method and add `createSoundToggle`:
```js
// Complete corner accents
bg.fillRect(w / 2 - 6, -h / 2, 6, 6);
bg.fillRect(-w / 2, h / 2 - 6, 6, 6);
bg.fillRect(w / 2 - 6, h / 2 - 6, 6, 6);

// Hover overlay
const hover = this.add.graphics();
hover.fillStyle(0xffffff, 0.12);
hover.fillRect(-w / 2, -h / 2, w, h);
hover.setAlpha(0);

container.add(bg);
container.add(hover);

const text = this.add.text(0, 0, label, {
  fontFamily: '"Courier New", monospace',
  fontSize: '16px',
  color: '#ffffff',
}).setOrigin(0.5);
container.add(text);

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
```

```js
// createSoundToggle — add after createButton
createSoundToggle() {
  const cx = GAME_WIDTH / 2;
  const label = () => `[ SFX: ${gameState.sfxMuted ? 'OFF' : 'ON'} ]`;
  const btn = this.add.text(cx, GAME_HEIGHT - 50, label(), {
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
```

---

## 7. UI Not Centered on Web / Mobile (Partial Fix — superseded by §11)

> ⚠️ This section describes a partial fix that did not fully resolve the issue on mobile. See **§11** for the definitive solution.

**Cause identified:** `#game-container` used `height: 100%` without `html` and `body` having explicit heights, causing the container to collapse on mobile.

**Partial fix applied:** Added `html, body { width: 100%; height: 100%; }`. This was necessary but not sufficient.

---

## 8. All Game Scenes Off-Center (Flexbox / Phaser Conflict — superseded by §11)

> ⚠️ This section describes a conflict that was fixed, but `CENTER_BOTH` itself was later found to be unreliable on mobile. See **§11** for the definitive solution.

**Cause identified:** `display: flex` on `#game-container` conflicted with Phaser's `autoCenter: CENTER_BOTH` margin calculations, producing a double-offset.

**Fix applied:** Removed `display: flex` from `#game-container`. This resolved the conflict but `CENTER_BOTH` still failed on some mobile browsers — see §11.

---

## 9. All Scene UI Off-Center (Missing cx / cy Anchors)

### SCENE_UI_NOT_CENTERED — Content drifts from canvas center in every scene

**Symptom:** Menu, Game Over, and loading scenes appear visually unbalanced — text and panels are skewed toward the top or sides rather than being distributed symmetrically around the canvas midpoint.

**Root cause:** Scenes position every element with raw pixel values (e.g. `y = 140`, `y = 220`, `y = 458`) that have no explicit relationship to the canvas center. When `GAME_WIDTH` or `GAME_HEIGHT` changes, or when the canvas is scaled by Phaser's FIT mode and the browser zooms, all elements shift together but there is nothing in the code to guarantee they stay balanced around the center.

**Rule:** Every scene must define `cx` and `cy` at the top of `create()` (or the UI-building method) and express every element position as `cx ± offsetX` / `cy ± offsetY`. This makes centering explicit and keeps layout correct regardless of canvas size.

```js
// ✅ Pattern — define once, use everywhere
const cx = GAME_WIDTH / 2;   // 240  — horizontal center
const cy = GAME_HEIGHT / 2;  // 320  — vertical center

// All elements expressed relative to cx / cy:
this.add.text(cx, cy - 162, 'TITLE', ...).setOrigin(0.5);  // above center
this.add.text(cx, cy,       'PLAY',  ...).setOrigin(0.5);  // at center
this.add.text(cx, cy + 75,  'MORE',  ...).setOrigin(0.5);  // below center
```

```js
// ❌ Anti-pattern — hardcoded absolute values
this.add.text(cx, 158, 'TITLE', ...).setOrigin(0.5);  // works only at GAME_HEIGHT=640
this.add.text(cx, 320, 'PLAY',  ...).setOrigin(0.5);
this.add.text(cx, 395, 'MORE',  ...).setOrigin(0.5);
```

**Fixes applied per scene:**

| Scene | Problem | Fix |
|-------|---------|-----|
| `MenuScene` | No `cy`; all y values hardcoded | Added `cy`; replaced with `cy-205`, `cy-162`, `cy-120`, `cy-100`, `cy-80`, `cy`, `cy+75`, `cy+150` |
| `GameOverScene` | No `cy`; content block 6 px below canvas center | Added `cy`; title → `cy-180`, panel → `cy-100`, buttons → `cy+138` / `cy+208` |
| `PreloadScene` | No `cx`/`cy`; used ad-hoc `w/2`, `h*0.35`, `h*0.6` fractions | Added `cx = w/2`, `cy = h/2`; title → `cy-96`, bar → `cy+64`, label → `cy+99` |
| `UIScene` | Already used `cx`/`cy` correctly | No change needed |
| `GameScene` | HUD intentionally at top; grid placement intentional | No change (layout is by design) |

**Footer / edge elements are exempt:** Elements intentionally pinned to the screen edge (version string, skip link, sound toggle) may continue using `GAME_HEIGHT - N` — they are not part of the centered content block.

---

## 10. Board Repuzzles on Every Level-Up

### BOARD_REPUZZLE_ON_LEVELUP — Whole grid regenerated when advancing a level

**Symptom:** When the player reaches the score target and the level advances, the entire board is destroyed and replaced with a fresh random grid — instead of continuing from the current board state.

**Cause:** `GameScene.resetForNextLevel()` was doing three things it should not have done on level-up:
1. Destroyed every existing sprite (`this.sprites[r][c].destroy()`)
2. Called `this.initGrid()` — a full random re-fill of `this.grid`
3. Recreated and drop-animated all tiles from above the grid

```js
// ❌ Old — wipes and regenerates the whole board on every level advance
resetForNextLevel() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (this.sprites[r][c]) { this.sprites[r][c].destroy(); this.sprites[r][c] = null; }

  this.initGrid();                   // ← generates fresh random grid

  for (let r = 0; r < ROWS; r++)    // ← drops all new tiles in with animation
    for (let c = 0; c < COLS; c++) { ... }

  this.createTapsPips(gameState.getLevelData().moves);
  this.updateHUD();
  this.time.delayedCall((ROWS * COLS) * 12 + 300, () => { this.isProcessing = false; });
}
```

**Fix — keep the board intact, only reset the HUD:**
```js
// ✅ Fixed — board continues unchanged; only move pips + HUD refresh
resetForNextLevel() {
  this.createTapsPips(gameState.getLevelData().moves);
  this.updateHUD();
  this.isProcessing = false;
}
```

**Why this is correct:**
- `gameState.nextLevel()` (called before this) already sets the new move count and saves progress — the grid data in `GameScene` is unaffected.
- `this.grid` and `this.sprites` remain valid for the new level; the player continues clearing the same board.
- Future `refill()` calls will use `gameState.getLevelData().colors` so any new tiles that drop in after clears will draw from the new level's color palette automatically.
- `isProcessing` can be set synchronously (no drop animation delay needed).

---

## 11. Canvas Not Centered on Mobile / Web (Definitive Fix)

### CANVAS_NOT_CENTERED_MOBILE — Canvas off-center despite previous fixes; persists on iOS Safari and Chrome Android

**Symptom:** The game canvas renders correctly at the top-left or shifted corner on mobile browsers and some desktop browsers even after adding `html/body { height: 100% }` and removing flexbox from `#game-container`.

**Root cause — Phaser `CENTER_BOTH` timing bug:**

`Phaser.Scale.ScaleManager.updateCenter()` centers the canvas by calling `canvas.getBoundingClientRect()` to read the canvas's rendered dimensions, then computing:

```js
var offsetX = Math.floor((this.parentSize.width - width) / 2);
var offsetY = Math.floor((this.parentSize.height - height) / 2);
style.marginLeft = offsetX + 'px';
style.marginTop  = offsetY + 'px';
```

On mobile browsers (iOS Safari, Chrome Android), `getBoundingClientRect()` can return `width: 0, height: 0` if called before the browser has completed its first layout pass. When that happens:

```
offsetX = (viewportWidth  - 0) / 2  →  canvas pushed right by half the viewport
offsetY = (viewportHeight - 0) / 2  →  canvas pushed down by half the viewport
```

The canvas ends up in the bottom-right quadrant. Subsequent resize events may or may not re-trigger `updateCenter`, so the bad position can persist for the entire session.

**Definitive fix — replace `CENTER_BOTH` with CSS `transform` centering:**

CSS `transform: translate(-50%, -50%)` is evaluated by the browser's layout engine at paint time, after all elements are sized. It is immune to JavaScript timing issues and works identically on every browser.

**`index.html`:**
```html
<style>
  * { box-sizing: border-box; padding: 0; margin: 0; }
  html, body {
    width: 100%;
    height: 100%;
  }
  body {
    margin: 0;
    overflow: hidden;
    background: #000;
    user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
  #game-container {
    position: fixed;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  /* CSS centers the canvas — do not use Phaser autoCenter with this */
  #game-container canvas {
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
...
<body>
  <div id="game-container"></div>  <!-- no <canvas> element here; Phaser creates its own -->
  <script src="src/main.js" type="module"></script>
</body>
```

**`src/main.js`:**
```js
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.NO_CENTER,  // ← CSS handles centering; Phaser must not write margins
},
```

**Why each part is required:**

| Part | Reason |
|------|--------|
| `autoCenter: NO_CENTER` | Prevents Phaser from writing `marginLeft`/`marginTop` which would override the CSS transform |
| `position: absolute` on canvas | Removes the canvas from normal flow so `top/left` are relative to the fixed container |
| `top: 50%; left: 50%` | Moves the canvas's top-left corner to the viewport center |
| `transform: translate(-50%, -50%)` | Shifts the canvas back by half its own width and height, perfectly centering it |
| No `<canvas>` in HTML | Phaser creates and appends its own canvas to `#game-container`; a pre-existing canvas element would be a second unused element also receiving the centering CSS |

**What NOT to do:**

```js
// ❌ CENTER_BOTH — unreliable on mobile (getBoundingClientRect timing)
autoCenter: Phaser.Scale.CENTER_BOTH

// ❌ flexbox on parent — conflicts with Phaser's margin writes
#game-container { display: flex; align-items: center; justify-content: center; }

// ❌ mixing both — double-offset on every resize
```
