# Privacy Policy & Terms of Service
**Retro Pixel Puzzle** | Last Updated: [DATE]

---

# 🔒 Privacy Policy

> **CrazyGames Platform Note:** This game is hosted on CrazyGames.com. CrazyGames operates as an independent data controller for platform-level data collection, advertising, and analytics. Their privacy practices are governed by the [CrazyGames Privacy Policy](https://www.crazygames.com/privacy-policy). This document covers **only** data practices specific to this game beyond what CrazyGames already manages.

---

## 📊 Data Collected

This game collects **minimal data** necessary for core functionality:

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Puzzle progress & level scores | Save game state locally | Session/LocalStorage only |
| High score rankings | Display leaderboard within game | Session duration |
| Audio/visual preferences | Remember player settings | LocalStorage only |
| Gameplay telemetry (aggregate) | Bug fixes & difficulty balancing | 90 days, anonymized |

**We do NOT collect:**
- ❌ Real names or email addresses
- ❌ Passwords or account credentials
- ❌ Payment or financial information
- ❌ Precise geolocation data
- ❌ Device identifiers beyond what CrazyGames SDK provides

> **LocalStorage Notice:** Game preferences and progress are stored directly in your browser's local storage. This data never leaves your device and is not transmitted to our servers.

---

## 🎮 CrazyGames SDK Data

This game integrates the **official CrazyGames SDK**, which independently handles:

- **Advertising delivery** — CrazyGames serves ads in compliance with applicable advertising standards. Ad-related data collection is governed solely by CrazyGames.
- **Platform analytics** — Session counts, geographic aggregates, and engagement metrics collected by CrazyGames.
- **User authentication** — If a player uses a CrazyGames account, all account data is managed exclusively by CrazyGames.
- **Ad break triggering** — The SDK receives signals from our game (e.g., "level complete") to display ads at appropriate moments. No personal player data is transmitted during this process.

> ⚠️ **Developer Note to Self:** Ensure `sdk.game.sdkGameLoadingStop()` and `sdk.game.gameplayStart()` / `sdk.game.gameplayStop()` are correctly implemented so CrazyGames can pause ads during active gameplay per their [SDK requirements](https://developers.crazygames.com/sdk).

**Legal Basis (GDPR):**
CrazyGames acts as a **separate data controller** for SDK-collected data. Players wishing to exercise GDPR rights regarding SDK data (access, erasure, portability) should direct requests to CrazyGames directly at [support@crazygames.com](mailto:support@crazygames.com).

---

## 🔗 Third Parties

This game does **not** independently integrate any third-party services outside of the CrazyGames SDK. Specifically:

- No independent Google Analytics
- No Facebook Pixel or social tracking
- No independent crash reporting SDKs
- No email marketing platforms
- No payment processors

**Future integrations**, if added, will be disclosed here with a policy update and updated "Last Updated" date prior to deployment.

---

## 👶 Children's Privacy (COPPA & GDPR-K)

This game is a **casual puzzle game accessible to general audiences**, including children.

### COPPA Compliance (USA)
- We do **not** knowingly collect personal information from children under the age of **13**.
- No account registration, social features, or direct communication channels exist within the game itself.
- CrazyGames maintains its own COPPA compliance framework for the platform, including contextual-only advertising where required.
- If we become aware that personal data from a child under 13 has been inadvertently collected, we will delete it within **72 hours**.

### GDPR-K Compliance (EU/UK)
- We do **not** collect personal data from children under **16** (or the applicable national age in EU member states).
- No behavioral advertising data is know