// Tiny localStorage wrapper. Storage can be unavailable (private mode, blocked
// site data), so every access is guarded and falls back to memory.

const memory = new Map();
const PREFIX = 'nyq:';

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? (memory.has(key) ? memory.get(key) : fallback) : JSON.parse(raw);
  } catch {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

export function set(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* memory only */
  }
}

/** Fake network latency so the UI exercises its loading states. */
export const fakeRequest = (ms = 900, fail = false) =>
  new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error('network')) : resolve()), ms));

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Kept free of three.js imports so pages can check before loading 3D chunks. */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
