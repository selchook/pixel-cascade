# PIXEL CASCADE — Technical Architecture Document
## Phaser 3 | CrazyGames Web Platform | MVP v1.0

---

## 1. Engine Choice: Phaser 3

**Rationale:**
- Phaser 3.60+ ships with built-in WebGL renderer with Canvas fallback — satisfies Chromebook 4GB constraint
- Native arcade physics, tween system, and particle emitter cover all cascade/animation needs without plugins
- Scene Manager maps cleanly to the required Boot→Load→Menu→Game→GameOver flow
- Texture generation API (`Graphics`, `RenderTexture`) enables fully procedural asset pipeline — zero external image files
- Web Audio API wrapper with mute/volume controls integrates trivially with CrazyGames `muteAudio` flag
- Tree-shakeable via Vite — only imported modules bundle; achieves ≤1MB JS target
- Active CrazyGames community examples exist in Phaser 3 specifically

**Version:** `phaser@3.60.0` (stable, no breaking changes from 3.55+)

---

## 2. Project File Structure

```
pixel-cascade/
├── index.html                     # Entry point, SDK script tag, canvas mount
├── package.json                   # Vite + Phaser deps
├── vite.config.js                 # Build config, outDir=dist, base="./"
├── dist/                          # Build output (never committed)
│
├── src/
│   ├── main.js                    # Phaser.Game instantiation, config
│   ├── constants.js               # Grid dims, colors, timing, enums
│   ├── GameState.js               # FSM enum + transition table
│   │
│   ├── scenes/
│   │   ├── BootScene.js           # SDK init, loadingStart, minimal preload
│   │   ├── PreloadScene.js        # Procedural texture baking, progress bar
│   │   ├── MenuScene.js           # Title, play button, leaderboard stub
│   │   ├── OnboardingScene.js     # Visual-first tutorial overlay (skippable)
│   │   ├── GameScene.js           # Core gameplay loop
│   │   └── GameOverScene.js       # Score display, restart, ad trigger
│   │
│   ├── entities/
│   │   ├── Glyph.js               # 2×2/3×3 piece definition + rotation matrix
│   │   ├── GlyphRenderer.js       # RenderTexture painter for each glyph shape
│   │   ├── GridCell.js            # Single cell state (color, locked, exploding)
│   │   └── GhostPiece.js          # Drop-preview ghost overlay
│   │
│   ├── systems/
│   │   ├── GridSystem.js          # Board state, placement, flood-fill match
│   │   ├── CascadeSystem.js       # Chain reaction resolver, combo counter
│   │   ├── SpawnSystem.js         # Piece queue, next-3 preview
│   │   ├── ScoreSystem.js         # Points, multiplier, high-score (localStorage)
│   │   ├── InputSystem.js         # Unified keyboard/pointer/touch handler
│   │   └── AudioSystem.js         # SFX synthesis, BGM, muteAudio bridge
│   │
│   ├── ui/
│   │   ├── HUD.js                 # Score, level, lines, next-piece panel
│   │   ├── ComboPopup.js          # Animated combo text burst
│   │   ├── PauseOverlay.js        # Pause menu with resume/restart/mute
│   │   └── PixelFont.js           # BitmapText config (generated bitmap atlas)
│   │
│   ├── fx/
│   │   ├── ParticlePool.js        # Pooled 8-bit square particles
│   │   ├── ExplosionFX.js         # Per-cell explosion burst coordinator
│   