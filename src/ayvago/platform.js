// Single entry point for platform features (Ayvago when embedded, no-ops standalone).
// Calls made before the adapter is ready are queued, so nothing is lost during the handshake.
import { createPlatformAdapter } from './adapter.js';

const ready = createPlatformAdapter({ gameId: 'pixelcascade' });

export function onPlatform(action) {
  ready.then(action).catch((error) => console.error('[ayvago] platform call failed', error));
}
