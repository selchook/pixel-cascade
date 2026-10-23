// Generated from selchook/ayvago packages/platform-adapter (tsc build). Do not edit; copy a new build.
/**
 * Ayvago platform adapter (protocol 2, v1-compatible GHA_* messages).
 *
 * A single, dependency-free file that games vendor (copy) into their own repository. At runtime
 * it decides whether the game runs inside Ayvago (embedded in an iframe on an allowed platform
 * origin that answers the handshake) or standalone (its own URL), and exposes the same API in
 * both cases so a game ships one build.
 *
 * Source of truth: selchook/ayvago, packages/platform-adapter/src/adapter.ts.
 * Update vendored copies by copying this file; do not edit them in place.
 */
export const ADAPTER_VERSION = '2.0.0';
export const PROTOCOL_VERSION = 2;
/** Origins allowed to host games. "*" matches one DNS label segment (letters, digits, "-"). */
export const DEFAULT_PLATFORM_ORIGINS = [
    'https://ayvago.com',
    'https://www.ayvago.com',
    'https://ayvago-*.vercel.app',
    'http://localhost:3000',
];
function originMatches(origin, pattern) {
    if (!pattern.includes('*'))
        return origin === pattern;
    const escaped = pattern.replace(/[.+?^${}()|[\]\\/]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
    return new RegExp(`^${escaped}$`).test(origin);
}
export function isAllowedPlatformOrigin(origin, patterns) {
    return patterns.some((pattern) => originMatches(origin, pattern));
}
export function browserEnv() {
    var _a;
    const w = window;
    let embedded = false;
    try {
        embedded = w.self !== w.top;
    }
    catch {
        // Accessing window.top can throw for cross-origin parents in old browsers: we are embedded.
        embedded = true;
    }
    let parentOrigin = null;
    const ancestors = w.location.ancestorOrigins;
    if (ancestors && ancestors.length > 0)
        parentOrigin = (_a = ancestors[0]) !== null && _a !== void 0 ? _a : null;
    else if (document.referrer) {
        try {
            parentOrigin = new URL(document.referrer).origin;
        }
        catch {
            parentOrigin = null;
        }
    }
    return {
        embedded,
        parentOrigin,
        language: (navigator.language || 'en').slice(0, 2).toLowerCase(),
        post: (message, targetOrigin) => w.parent.postMessage(message, targetOrigin),
        listen: (handler) => {
            const onMessage = (event) => handler(event.data, event.origin, event.source === w.parent);
            w.addEventListener('message', onMessage);
            return () => w.removeEventListener('message', onMessage);
        },
        setTimeout: (callback, ms) => w.setTimeout(callback, ms),
        clearTimeout: (handle) => w.clearTimeout(handle),
        rootStyle: document.documentElement.style,
    };
}
class Emitter {
    constructor() {
        this.listeners = new Set();
    }
    add(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    emit(value) {
        this.listeners.forEach((listener) => {
            try {
                listener(value);
            }
            catch (error) {
                // A failing game callback must not break the bridge.
                console.error('[ayvago] callback failed', error);
            }
        });
    }
}
class StandaloneAdapter {
    constructor(locale) {
        this.locale = locale;
        this.name = 'standalone';
        this.config = null;
    }
    loadingProgress() { }
    gameplayStart() { }
    gameplayStop() { }
    submitScore() { }
    endGame() { }
    requestRewarded() {
        return Promise.resolve(false);
    }
    requestInterstitial() {
        return Promise.resolve();
    }
    celebrate() { }
    openLeaderboard() { }
    onPause() {
        return () => { };
    }
    onResume() {
        return () => { };
    }
    onMute() {
        return () => { };
    }
    onThemeChange() {
        return () => { };
    }
    onLocaleChange() {
        return () => { };
    }
    applyThemeTokens() { }
}
class AyvagoAdapter {
    constructor(env, origin, config, adTimeoutMs) {
        this.env = env;
        this.origin = origin;
        this.adTimeoutMs = adTimeoutMs;
        this.name = 'ayvago';
        this.nextAdId = 1;
        this.pendingAds = new Map();
        this.pause = new Emitter();
        this.resume = new Emitter();
        this.mute = new Emitter();
        this.theme = new Emitter();
        this.localeChange = new Emitter();
        this.currentConfig = config;
        this.currentLocale = config.locale;
        env.listen((data, messageOrigin, fromParent) => {
            if (fromParent && messageOrigin === origin)
                this.handle(data);
        });
    }
    get config() {
        return this.currentConfig;
    }
    get locale() {
        return this.currentLocale;
    }
    send(type, payload = {}) {
        this.env.post({ type, ...payload }, this.origin);
    }
    handle(data) {
        if (typeof data !== 'object' || data === null)
            return;
        const msg = data;
        switch (msg.type) {
            case 'GHA_START':
                if (isStartConfig(msg.config))
                    this.currentConfig = msg.config;
                break;
            case 'GHA_PAUSE':
                this.pause.emit();
                break;
            case 'GHA_RESUME':
                this.resume.emit();
                break;
            case 'GHA_MUTE':
                if (typeof msg.muted === 'boolean')
                    this.mute.emit(msg.muted);
                break;
            case 'GHA_THEME_CHANGE':
                if (typeof msg.theme === 'string' && isColorMode(msg.colorMode) && isTokenMap(msg.tokens)) {
                    const info = {
                        theme: msg.theme,
                        colorMode: msg.colorMode,
                        tokens: msg.tokens,
                    };
                    this.currentConfig = { ...this.currentConfig, ...info };
                    this.theme.emit(info);
                }
                break;
            case 'GHA_LOCALE_CHANGE':
                if (typeof msg.locale === 'string') {
                    this.currentLocale = msg.locale;
                    this.localeChange.emit(msg.locale);
                }
                break;
            case 'GHA_AD_RESULT': {
                const settle = typeof msg.id === 'number' ? this.pendingAds.get(msg.id) : undefined;
                if (settle)
                    settle(msg.rewarded === true, msg.shown === true);
                break;
            }
            default:
                break;
        }
    }
    requestAd(format, placement) {
        if (!this.currentConfig.adsEnabled)
            return Promise.resolve(false);
        const id = this.nextAdId++;
        return new Promise((resolve) => {
            const timer = this.env.setTimeout(() => finish(false), this.adTimeoutMs);
            const finish = (rewarded) => {
                this.env.clearTimeout(timer);
                this.pendingAds.delete(id);
                resolve(rewarded);
            };
            this.pendingAds.set(id, (rewarded) => finish(rewarded));
            this.send('GHA_AD_REQUEST', { id, format, placement });
        });
    }
    loadingProgress(progress) {
        if (Number.isFinite(progress)) {
            this.send('GHA_LOADING', { progress: Math.min(1, Math.max(0, progress)) });
        }
    }
    gameplayStart() {
        this.send('GHA_SESSION_START');
    }
    gameplayStop() {
        this.send('GHA_GAMEPLAY_STOP');
    }
    submitScore(score) {
        if (Number.isFinite(score))
            this.send('GHA_SCORE', { score });
    }
    endGame(result) {
        const score = typeof result.score === 'number' && Number.isFinite(result.score) ? result.score : null;
        this.send('GHA_END', { score, won: result.won, message: result.message });
    }
    async requestRewarded(placement) {
        return this.requestAd('rewarded', placement);
    }
    async requestInterstitial(placement) {
        await this.requestAd('interstitial', placement);
    }
    celebrate() {
        this.send('GHA_HAPPY_TIME');
    }
    openLeaderboard() {
        this.send('GHA_OPEN_LEADERBOARD');
    }
    onPause(callback) {
        return this.pause.add(callback);
    }
    onResume(callback) {
        return this.resume.add(callback);
    }
    onMute(callback) {
        return this.mute.add(callback);
    }
    onThemeChange(callback) {
        return this.theme.add(callback);
    }
    onLocaleChange(callback) {
        return this.localeChange.add(callback);
    }
    applyThemeTokens(target = this.env.rootStyle ? { style: this.env.rootStyle } : undefined) {
        if (!target)
            return;
        for (const [name, value] of Object.entries(this.currentConfig.tokens)) {
            if (name.startsWith('--'))
                target.style.setProperty(name, value);
        }
    }
}
function isColorMode(value) {
    return value === 'light' || value === 'dark';
}
function isTokenMap(value) {
    return (typeof value === 'object' &&
        value !== null &&
        Object.values(value).every((v) => typeof v === 'string'));
}
function isStartConfig(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const c = value;
    return (typeof c.locale === 'string' &&
        typeof c.theme === 'string' &&
        isColorMode(c.colorMode) &&
        isTokenMap(c.tokens) &&
        typeof c.adsEnabled === 'boolean');
}
/**
 * Creates the adapter. Inside Ayvago it sends GHA_READY and waits for GHA_START; on any other
 * host (own URL, unknown parent, no answer) it resolves to the standalone adapter.
 */
export function createPlatformAdapter(options) {
    var _a, _b;
    const env = (_a = options.env) !== null && _a !== void 0 ? _a : browserEnv();
    const patterns = (_b = options.platformOrigins) !== null && _b !== void 0 ? _b : DEFAULT_PLATFORM_ORIGINS;
    const standalone = new StandaloneAdapter(env.language);
    const origin = env.parentOrigin;
    if (!env.embedded || !origin || !isAllowedPlatformOrigin(origin, patterns)) {
        return Promise.resolve(standalone);
    }
    return new Promise((resolve) => {
        var _a;
        let settled = false;
        const stop = env.listen((data, messageOrigin, fromParent) => {
            var _a;
            if (settled || !fromParent || messageOrigin !== origin)
                return;
            const msg = data;
            if (msg && msg.type === 'GHA_START' && isStartConfig(msg.config)) {
                settled = true;
                env.clearTimeout(timer);
                stop();
                resolve(new AyvagoAdapter(env, origin, msg.config, (_a = options.adTimeoutMs) !== null && _a !== void 0 ? _a : 90000));
            }
        });
        const timer = env.setTimeout(() => {
            if (settled)
                return;
            settled = true;
            stop();
            resolve(standalone);
        }, (_a = options.handshakeTimeoutMs) !== null && _a !== void 0 ? _a : 3000);
        env.post({ type: 'GHA_READY', gameId: options.gameId, adapter: ADAPTER_VERSION }, origin);
    });
}
