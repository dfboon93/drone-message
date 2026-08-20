// All tuning constants in one place.

export const MAX_CHARS = 80;      // code points, enforced at encode and decode
export const CHUNK_LEN = 11;      // max chars per formation phase (space included)

export const THEMES = {
  gold: { core: '#fff7e0', glow: '#ffc966' },
  ice:  { core: '#eefcff', glow: '#7dd3fc' },
  rose: { core: '#fff0f5', glow: '#fda4af' },
};
export const DEFAULT_THEME = 'gold';
export const SHAPE_IDS = ['heart', 'star', 'moon', 'flower', 'diamond'];
export const SHAPE_SPIN = 1.1; // rad/s of 3D rotation while a shape holds

export const PHYSICS = {
  K: 12,            // spring stiffness
  FRICTION: 0.90,   // velocity retained per 60fps frame
  MAX_STAGGER: 1.2, // seconds of per-drone retarget delay
};

export const TIMINGS = {
  LAUNCH: 2.8,        // ground → scatter cloud
  FORM_TIMEOUT: 4.0,  // max seconds waiting for a formation to settle
  HOLD_BASE: 1.8,
  HOLD_PER_CHAR: 0.08,
  SHAPE_HOLD: 6.5, // long enough for a full 3D revolution
  FINALE_FADE: 3.0,
};

export const TRAIL_FADE = 0.4; // per-frame alpha erased from the scene canvas

export const TOUCH = {
  RADIUS: 130, // px around a touch/press that drones avoid
  FORCE: 2600, // peak repulsion acceleration (px/s²) at the touch point
};

export function droneCountFor(w, h) {
  return Math.max(400, Math.min(1200, Math.round((w * h) / 900)));
}
