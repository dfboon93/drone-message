// Choreography state machine:
//   launch → (form → hold) per phase → finale burst → done.
// Retargeting with fresh per-drone staggers IS the transition between
// phases — no separate scatter state needed.

import { CHUNK_LEN, TIMINGS, SHAPE_SPIN } from './config.js';
import { textTargets, shapeTargets, scatterTargets } from './targets.js';
import { SHAPES } from './shapes.js';

const cpLen = (s) => Array.from(s).length;

// Greedily pack words into chunks of ≤ CHUNK_LEN code points; an over-long
// word becomes its own chunk (font autofit handles the width).
export function chunkMessage(message) {
  const words = message.toUpperCase().split(' ');
  const chunks = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cpLen(cur) + 1 + cpLen(w) <= CHUNK_LEN) {
      cur += ' ' + w;
    } else {
      chunks.push(cur);
      cur = w;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export class Show {
  constructor(swarm, audio) {
    this.swarm = swarm;
    this.audio = audio;
    this.state = 'idle';
    this.onDone = null;
  }

  get running() {
    return this.state !== 'idle' && this.state !== 'done';
  }

  start(message, shapeId, W, H, now) {
    this.message = message;
    this.shapeId = SHAPES[shapeId] ? shapeId : null;
    this.W = W;
    this.H = H;
    this.phases = chunkMessage(message).map((text) => ({ kind: 'text', text }));
    if (this.shapeId) this.phases.push({ kind: 'shape', id: this.shapeId });
    this.computeTargets();
    this.k = -1;
    this.t = 0;
    this.state = 'launch';
    this.swarm.placeBottom(W, H);
    this.swarm.setTargets(scatterTargets(this.swarm.count, W, H), now, 2.0);
  }

  computeTargets() {
    const { swarm, W, H } = this;
    this.pointSets = this.phases.map((p) =>
      p.kind === 'text'
        ? textTargets(p.text, swarm.count, W, H)
        : shapeTargets(SHAPES[p.id], swarm.count, W, H),
    );
  }

  resize(W, H, now) {
    this.W = W;
    this.H = H;
    if (!this.running) return;
    this.computeTargets();
    if (this.state === 'form' || this.state === 'hold') {
      this.swarm.setTargets(this.pointSets[this.k], now, 0.3);
    }
  }

  holdDuration(phase) {
    if (phase.kind === 'shape') return TIMINGS.SHAPE_HOLD;
    return TIMINGS.HOLD_BASE + TIMINGS.HOLD_PER_CHAR * cpLen(phase.text);
  }

  enterForm(k, now) {
    this.k = k;
    this.t = 0;
    this.theta = 0;
    this.state = 'form';
    this.swarm.setTargets(this.pointSets[k], now);
  }

  // 3D spin: rotate the flat shape's points around a vertical axis through
  // its center, with perspective. Only relX matters for a flat formation:
  //   z = relX·sinθ, scale = f/(f+z), then project back around the center.
  spinShape(dt) {
    this.theta += dt * SHAPE_SPIN;
    const n = this.swarm.count;
    if (!this.projBuf || this.projBuf.length !== n * 2) {
      this.projBuf = new Float32Array(n * 2);
      this.depthBuf = new Float32Array(n);
    }
    const base = this.pointSets[this.k];
    const cx = this.W / 2;
    const cy = this.H * 0.45;
    const f = Math.min(this.W, this.H) * 1.4;
    const cosT = Math.cos(this.theta);
    const sinT = Math.sin(this.theta);
    for (let i = 0; i < n; i++) {
      const relX = base[i * 2] - cx;
      const scale = f / (f + relX * sinT);
      this.projBuf[i * 2] = cx + relX * cosT * scale;
      this.projBuf[i * 2 + 1] = cy + (base[i * 2 + 1] - cy) * scale;
      this.depthBuf[i] = scale;
    }
    this.swarm.updateTargets(this.projBuf, this.depthBuf);
  }

  stop() {
    this.state = 'idle';
  }

  update(dt, now) {
    if (!this.running) return;
    this.t += dt;
    switch (this.state) {
      case 'launch':
        if (this.t >= TIMINGS.LAUNCH) this.enterForm(0, now);
        break;
      case 'form':
        if (this.swarm.meanDist() < 2.5 || this.t >= TIMINGS.FORM_TIMEOUT) {
          this.state = 'hold';
          this.t = 0;
          this.audio.twinkle();
        }
        break;
      case 'hold':
        if (this.phases[this.k].kind === 'shape') this.spinShape(dt);
        if (this.t >= this.holdDuration(this.phases[this.k])) {
          if (this.k + 1 < this.phases.length) {
            this.enterForm(this.k + 1, now);
          } else {
            this.state = 'finale';
            this.t = 0;
            this.swarm.release(this.W / 2, this.H * 0.45, TIMINGS.FINALE_FADE);
            this.audio.twinkle(6);
          }
        }
        break;
      case 'finale':
        if (this.t >= TIMINGS.FINALE_FADE + 0.5) {
          this.state = 'done';
          if (this.onDone) this.onDone();
        }
        break;
    }
  }
}
