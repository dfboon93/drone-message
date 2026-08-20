// Drone swarm: struct-of-arrays particle model with under-damped spring
// steering and a pre-rendered glow sprite (shadowBlur is too slow at 1000+).

import { PHYSICS } from './config.js';

const SPRITE_SIZE = 64;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeGlowSprite({ core, glow }) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const ctx = c.getContext('2d');
  const half = SPRITE_SIZE / 2;
  const [gr, gg, gb] = hexToRgb(glow);
  const [cr, cg, cb] = hexToRgb(core);
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.1, `rgba(${cr},${cg},${cb},0.9)`);
  grad.addColorStop(0.28, `rgba(${gr},${gg},${gb},0.35)`);
  grad.addColorStop(0.6, `rgba(${gr},${gg},${gb},0.08)`);
  grad.addColorStop(1.0, `rgba(${gr},${gg},${gb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

export class Swarm {
  constructor(count, themeColors) {
    this.count = count;
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.tx = new Float32Array(count);
    this.ty = new Float32Array(count);
    this.delay = new Float32Array(count);
    this.stiff = new Float32Array(count);   // per-drone stiffness variation
    this.wobF = new Float32Array(count);    // wobble frequency
    this.wobP = new Float32Array(count);    // wobble phase
    this.twF = new Float32Array(count);     // twinkle frequency
    this.twP = new Float32Array(count);     // twinkle phase
    this.size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.stiff[i] = 0.8 + Math.random() * 0.4;
      this.wobF[i] = 1.5 + Math.random() * 2.5;
      this.wobP[i] = Math.random() * Math.PI * 2;
      this.twF[i] = 0.6 + Math.random() * 1.8;
      this.twP[i] = Math.random() * Math.PI * 2;
      this.size[i] = 5 + Math.random() * 3;
    }
    this.mode = 'idle'; // idle | seek | free
    this.fade = 1;
    this.retargetAt = 0;
    this.sprite = makeGlowSprite(themeColors);
  }

  setTheme(themeColors) {
    this.sprite = makeGlowSprite(themeColors);
  }

  // Slow ambient fireflies behind the composer.
  scatterIdle(W, H) {
    this.mode = 'idle';
    this.fade = 1;
    for (let i = 0; i < this.count; i++) {
      this.x[i] = Math.random() * W;
      this.y[i] = Math.random() * H;
      this.vx[i] = (Math.random() - 0.5) * 12;
      this.vy[i] = (Math.random() - 0.5) * 12;
    }
  }

  // Stage drones just below the bottom edge for the launch.
  placeBottom(W, H) {
    for (let i = 0; i < this.count; i++) {
      this.x[i] = Math.random() * W;
      this.y[i] = H + 10 + Math.random() * 80;
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
  }

  setTargets(points, now, maxStagger = PHYSICS.MAX_STAGGER) {
    this.mode = 'seek';
    this.fade = 1;
    this.retargetAt = now;
    for (let i = 0; i < this.count; i++) {
      this.tx[i] = points[i * 2];
      this.ty[i] = points[i * 2 + 1];
      this.delay[i] = Math.random() * maxStagger;
    }
  }

  // Finale: burst outward from (cx, cy), drift upward, fade out.
  release(cx, cy, fadeSeconds) {
    this.mode = 'free';
    this.fadeRate = 1 / fadeSeconds;
    for (let i = 0; i < this.count; i++) {
      const dx = this.x[i] - cx;
      const dy = this.y[i] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 40 + Math.random() * 100;
      this.vx[i] = (dx / d) * speed;
      this.vy[i] = (dy / d) * speed - 30;
    }
  }

  update(dt, now, W, H) {
    const { count, x, y, vx, vy, tx, ty, delay, stiff } = this;
    const fr = Math.pow(PHYSICS.FRICTION, dt * 60);
    if (this.mode === 'seek') {
      const t = now - this.retargetAt;
      for (let i = 0; i < count; i++) {
        if (t >= delay[i]) {
          const k = PHYSICS.K * stiff[i] * dt;
          vx[i] += (tx[i] - x[i]) * k;
          vy[i] += (ty[i] - y[i]) * k;
        }
        vx[i] *= fr;
        vy[i] *= fr;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      }
    } else if (this.mode === 'free') {
      this.fade = Math.max(0, this.fade - this.fadeRate * dt);
      for (let i = 0; i < count; i++) {
        vy[i] -= 12 * dt; // gentle upward drift
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      }
    } else { // idle fireflies: drift and wrap
      for (let i = 0; i < count; i++) {
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        if (x[i] < -20) x[i] = W + 20; else if (x[i] > W + 20) x[i] = -20;
        if (y[i] < -20) y[i] = H + 20; else if (y[i] > H + 20) y[i] = -20;
      }
    }
  }

  meanDist() {
    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      sum += Math.hypot(this.tx[i] - this.x[i], this.ty[i] - this.y[i]);
    }
    return sum / this.count;
  }

  draw(ctx, now) {
    if (this.fade <= 0) return;
    const { count, x, y, tx, ty, wobF, wobP, twF, twP, size, sprite } = this;
    const seeking = this.mode === 'seek';
    const idle = this.mode === 'idle';
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      // Wobble amplitude scales with distance to target: lively in flight,
      // a subtle shimmer while holding formation.
      let amp = 1.5;
      if (seeking) {
        const d = Math.hypot(tx[i] - x[i], ty[i] - y[i]);
        amp = Math.min(3, 0.6 + d * 0.05);
      }
      const w = now * wobF[i] + wobP[i];
      const px = x[i] + Math.sin(w) * amp;
      const py = y[i] + Math.cos(w * 0.9) * amp;
      const twinkle = 0.7 + 0.3 * Math.sin(now * twF[i] + twP[i]);
      ctx.globalAlpha = twinkle * this.fade * (idle ? 0.35 : 1);
      const s = size[i];
      ctx.drawImage(sprite, px - s / 2, py - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
