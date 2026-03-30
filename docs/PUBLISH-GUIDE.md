# PUBLISH GUIDE — PIXEL CASCADE
### Phaser 3 | Platforms: CrazyGames, Web

---

# CRAZYGAMES

## Pre-submission Checklist

Complete every item before uploading your build. Incomplete submissions are the #1 cause of delays.

### Legal & Identity
- [ ] CrazyGames developer account created and email verified at [developers.crazygames.com](https://developers.crazygames.com)
- [ ] Developer name / studio name finalized and consistent across all assets
- [ ] You own or have licensed all assets (fonts, SFX, music, sprites)
- [ ] No third-party IP, trademarks, or copyrighted characters used without permission
- [ ] Privacy Policy URL live and publicly accessible
- [ ] GDPR-compliant data handling confirmed (CrazyGames serves EU traffic heavily)

### Build Quality
- [ ] Game is fully playable from first load with zero hard crashes
- [ ] No browser console errors on Chrome 120+, Firefox 120+, Edge 120+
- [ ] Mobile-responsive layout tested at 360×640, 768×1024, and 1280×720 minimum
- [ ] Game does not open new tabs, redirect, or attempt to leave the iframe
- [ ] No external login walls, paywalls, or "download our app" prompts
- [ ] Loading screen present with visible progress indicator
- [ ] All buttons and interactive elements reachable without scrolling
- [ ] Audio mute button functional and defaults to muted on first load (CrazyGames requirement)
- [ ] Game handles browser back button gracefully (no broken state)
- [ ] Tested on both desktop mouse/keyboard and touch input

### SDK
- [ ] CrazyGames SDK v3 integrated (see SDK section below)
- [ ] `sdk.game.sdkGameLoadingStop()` called after assets finish loading
- [ ] `sdk.game.gameplayStart()` called when the player enters active play
- [ ] `sdk.game.gameplayStop()` called on pause, game over, and main menu
- [ ] Ad break requests placed at logical breakpoints (level complete, game over)
- [ ] SDK tested in the CrazyGames preview sandbox, not just localhost

### Assets
- [ ] 280×280 PNG thumbnail prepared (see Cover Images section)
- [ ] 1900×1200 PNG banner prepared (see Cover Images section)
- [ ] At least 3 gameplay screenshots at 1280×720
- [ ] Short gameplay description written (150–300 characters)
- [ ] Full description written (500–1500 characters)
- [ ] Category and tags selected (see Categories section)

### Bundle
- [ ] Initial load payload ≤20 MB (see Bundle section)
- [ ] Game hosted on HTTPS — self-hosted URL or ZIP uploaded
- [ ] All asset paths are relative, not absolute localhost references
- [ ] `index.html` is the entry point at the root of the ZIP

---

## SDK Integration Verification

CrazyGames requires SDK v3. Failure to integrate correctly is the single most common hard rejection reason.

### Installation

```bash
# Via npm
npm install @crazygames/sdk

# Or via CDN — add to index.html <head>
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
```

### Phaser 3 Integration Pattern

Create a dedicated SDK wrapper so Phaser scenes stay clean:

```javascript
// src/CrazySDK.js
export class CrazySDK {
  constructor() {
    this.sdk = null;
    this.adBreakInProgress = false;
  }

  async init() {
    try {
      // CrazyGames injects window.CrazyGames after SDK script loads
      this.sdk = window.CrazyGames?.SDK;
      if (!this.sdk) {
        console.warn('CrazyGames SDK not available — running in dev mode');
        return;
      }
      await this.sdk.init();
      console.log('CrazyGames SDK initialized');
    } catch (err) {
      console.error('SDK init failed:', err);