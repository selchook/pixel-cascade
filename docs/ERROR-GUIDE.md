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

## 7. UI Not Centered on Web / Mobile

### UI_NOT_CENTERED — Canvas drifts off-center on mobile browsers

**Symptom:** The game canvas is not centered — it appears offset (usually top-left) on mobile browsers and some desktop viewports.

**Cause:** `#game-container` uses `height: 100%`, but `html` and `body` have no explicit height. Mobile browsers resolve percentage heights relative to the parent, so without `html { height: 100% }` and `body { height: 100% }`, the container collapses and Phaser's `CENTER_BOTH` has no reference point to center against.

**Fix — `index.html`:**
```html
<style>
  * { box-sizing: border-box; padding: 0; margin: 0; }
  html, body {          /* ← ADD THIS BLOCK */
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
  canvas { display: block; }
  #game-container {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

**Why the combination works:**
- `html, body { width/height: 100% }` gives the fixed container a real 100 vh/vw to reference.
- Flexbox on `#game-container` handles centering at the CSS level.
- Phaser's `Phaser.Scale.FIT` + `autoCenter: Phaser.Scale.CENTER_BOTH` handles centering at the canvas level.
- Both layers are required — omitting either causes misalignment on certain mobile browsers (Safari iOS, Chrome Android).
