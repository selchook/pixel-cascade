# Game Design Document: **PIXEL CASCADE**
### A Retro Puzzle Game for CrazyGames Web Platform
### Engine: Phaser 3 | Version 1.0 | Status: MVP Design

---

## 1. Concept & Hook

### Elevator Pitch
**PIXEL CASCADE** is a falling-block color-chain puzzle game where players rotate and place pixel "glyphs" (2×2 to 3×3 retro sprite-shaped pieces) onto a grid, chaining same-color adjacencies to trigger cascade reactions. Every match explodes into an 8-bit particle burst, chaining into further combos. It is *not* Tetris, *not* Puyo Puyo — it is its own system built around **deliberate placement + explosive chains**.

### What Makes It Unique
| Feature | Description |
|---|---|
| **Glyph Pieces** | Pieces are shaped like mini retro sprites (skull, star, gem, bolt) — each cell of the sprite is a specific color. Players place whole sprites, not abstract blocks. |
| **Cascade Engine** | Connected groups of ≥3 same-color cells explode. Explosions reveal **bonus cells** underneath (gold, rainbow, bomb). Bonus cells trigger secondary cascades. |
| **Pressure Meter** | A side-scrolling pixel "monster" walks toward your grid. Successful combos push it back. No combos = it eats a column. Creates pacing tension without arbitrary timers. |
| **Retro Identity** | CRT scanline overlay, chunky 16×16 pixel art glyphs, chiptune music — but procedurally generated so zero external sprite files needed. |

### Instant Hook (First 5 Seconds)
- Game loads directly into an animated title with a **pre-baked demo cascade** playing in the background (no interaction required to see satisfying explosions)
- A single animated arrow and "CLICK TO PLAY" appears at 3 seconds
- Onboarding begins immediately on first click — no menus to navigate

---

## 2. Core Loop

### Session Structure (2–10 Minutes)

```
LOAD → TITLE (2s demo cascade) → ONBOARDING ROUND (1 level, guided)
  → GAMEPLAY LOOP → LEVEL CLEAR → [AD GATE optional] → NEXT LEVEL
                  ↘ GAME OVER → SCORE SCREEN → RESTART / SHARE
```

### Primary Loop (Per Turn)
```
1. PREVIEW    — Next glyph shown in queue (right panel, 3 ahead)
2. AIM        — Player moves ghost-preview horizontally across grid
3. PLACE      — Player confirms drop position (click/tap/enter)
4. RESOLVE    — Glyph lands, gravity settles, cascade engine fires
5. SCORE      — Points awarded per match group, combo multiplier applied
6. PRESSURE   — Monster position updated based on combo result
7. NEXT TURN  — New glyph enters queue
```

### Replayability Drivers
- **Daily Seed Challenge** — Same glyph sequence for all players that day (shareable score)
- **Cascade Combo Counter** — Personal best tracked in localStorage
- **Unlockable Grid Skins** — CRT Green, Amber, RGB, VHS static (cosmetic only, unlocked by score milestones)
- **Score multipliers** escalate per level, encouraging one-more-run psychology

### Tension & Release Rhythm
| Phase | Duration | Feel |
|---|---|---|
| Early turns | Turns 1–8 | Calm placement, building setup |
| First cascade | Turn ~5 | "OH!" moment — particles, sound burst |
| Monster pressure | Turn 10+ | Urgency rises, music tempo increases |
| Panic zone | Grid 70% full | Survival mode, desperate combos |
| Clear / Collapse | Resolution | Massive relief, dopamine hit |

---

## 3. Mechanics

### 3.1 Grid Specification
- **Grid size:** 10 columns × 16 rows (each cell = 32×32 px at 1080p, scales down)
- **Visible play area:** Columns 1–10, rows