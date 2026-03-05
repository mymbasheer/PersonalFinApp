// mobile/src/config.ts
// ─────────────────────────────────────────────────
// Centralised runtime configuration.
// Set API_BASE to your backend IP/hostname.
// ─────────────────────────────────────────────────

// Triggering a fresh GitHub Actions build
/** Base URL for the backend REST API (no trailing slash) */
export const API_BASE = 'http://192.168.1.18:3000';

/** App-wide feature flags */
export const FEATURES = {
    /** Enable detailed console logging in development */
    debugLogging: __DEV__,
};
