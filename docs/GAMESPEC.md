# PIXEL CASCADE — Implementation Specification
## Phaser 3 | MVP v1.0

---

## 1. File Map

| Path | Description |
|------|-------------|
| `src/main.js` | Phaser game config, canvas mount, scene registration, global scale manager setup |
| `src/constants.js` | All magic numbers, color palettes, grid dimensions, timing values, SDK event strings |
| `src/GameState.js` | Singleton state machine managing BOOT→GAME_OVER transitions and serialized save data |
| `src/scenes/BootScene.js` | Minimal scene that inits CrazyGames SDK, sets pixel-art render flags, advances to LOAD |
| `src/scenes/PreloadScene.js` | Procedural texture generation, progress bar draw, all RenderTexture baking |
| `src/scenes/MenuScene.js` | Animated logo, best-score display, play/settings buttons, idle particle loop |
| `src/scenes/OnboardingScene.js` | Three-step tutorial overlay drawn with Graphics primitives, skippable after step 1 |
| `src/scenes/GameScene.js` | Core gameplay: grid, cascade engine, input, scoring, combo, level progression |
| `src/scenes/GameOverScene.js` | Final score reveal, retry/menu buttons, SDK score submit call |
| `src/game/Grid.js` | 2D array model for tile state; owns swap, match-find, gravity, and refill logic |
| `src/game/Tile.js` | Single tile entity: color id, type flag, tween handles, sprite reference |
| `src/game/CascadeEngine.js` | Orchestrates Grid calls in async waterfall: match→clear→drop→refill→re-check loop |
| `src/game/ScoreManager.js` | Points formula, multiplier chain, level threshold table, high-score persistence |
| `src/game/ComboTracker.js` | Tracks consecutive cascade depth, emits `combo` events, resets on idle |
| `src/game/InputHandler.js` | Unified pointer + keyboard input; translates screen coords to grid cells |
| `src/game/ParticlePool.js` | Pre-allocated Phaser `Particles.ParticleEmitter` instances for tile-burst FX |
| `src/game/AudioManager.js` | Synth-only sound engine using Web Audio API; plays all tones via procedural oscillators |
| `src/ui/HUD.js` | In-game overlay: score counter, level badge, move counter, pause button |
| `src/ui/PauseOverlay.js` | Dimmed panel with resume/restart/menu options, rendered over GameScene |
| `src/ui/TweenHelper.js` | Reusable tween presets (bounce-in, shake, float-up score text) used across scenes |

---

## 2. Scene Lifecycle

### Transition Table

```
BOOT  ──► LOAD  ──► MENU  ──► ONBOARDING  ──► GAME  ──► GAME_OVER
                      ▲                          │           │
                      └──────────────────────────┘           │
                                   ▲                         │
                                   └─────────────────────────┘
```

### BootScene
- **`create()`**
  1. Set `this.game.renderer.pipelines` pixel-art flag: `roundPixels: true`
  2. Call `GameState.transition(STATES.BOOT)`
  3. Initialize CrazyGames SDK: `window.CrazyGames.SDK.init()` → on resolve fire `loadingStart`
  4. `this.scene.start('PreloadScene')`

### PreloadScene
- **`preload()`** — nothing to load from disk; all assets are procedural
- **`create()`**
  1. `GameState.transition(STATES.LOAD)`
  2. Draw progress bar via `Graphics` (see §10)
  3. Call `TextureFactory.bakeAll(this)` — generates all `Render