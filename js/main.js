// Bootstrap: canvas/DPR setup, resize handling, the single RAF loop, and
// wiring URL → mode (composer vs recipient) → show.

import { THEMES, DEFAULT_THEME, TRAIL_FADE, droneCountFor } from './config.js';
import { Swarm } from './drones.js';
import { Show } from './show.js';
import { Starfield } from './stars.js';
import { encodeShare, decodeShare } from './url.js';
import { initUI } from './ui.js';
import * as audio from './audio.js';

const starsCanvas = document.getElementById('stars');
const sceneCanvas = document.getElementById('scene');
const starsCtx = starsCanvas.getContext('2d');
const sceneCtx = sceneCanvas.getContext('2d');

let W = 0, H = 0;

function sizeCanvases() {
  W = window.innerWidth;
  H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const [canvas, ctx] of [[starsCanvas, starsCtx], [sceneCanvas, sceneCtx]]) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

sizeCanvases();

const share = decodeShare(location.search);
const theme = share ? share.theme : DEFAULT_THEME;

const starfield = new Starfield();
starfield.render(starsCtx, W, H);

const swarm = new Swarm(droneCountFor(W, H), THEMES[theme]);
swarm.scatterIdle(W, H);

const show = new Show(swarm, audio);

let mode = share ? 'recipient' : 'composer';
let nowSec = performance.now() / 1000;

function startShow({ message, shape }) {
  show.start(message, shape, W, H, nowSec);
}

const ui = initUI({
  makeLink: (opts) => encodeShare(opts),
  onTheme: (t) => swarm.setTheme(THEMES[t]),
  onPreview: (opts) => {
    audio.ensureAudio();
    ui.showPlayback({ allowBack: true });
    startShow(opts);
  },
  onBegin: () => {
    audio.ensureAudio();
    ui.showPlayback({ allowBack: false });
    startShow(share);
  },
  onReplay: () => {
    ui.showPlayback({ allowBack: mode === 'composer' });
    startShow(mode === 'recipient' ? share : {
      message: show.message,
      shape: show.shapeId,
    });
  },
  onBack: () => {
    show.stop();
    swarm.scatterIdle(W, H);
    ui.showComposer();
  },
  onMute: () => audio.toggleMute(),
});

show.onDone = () => {
  if (mode === 'recipient') {
    ui.showEndcard();
  } else {
    swarm.scatterIdle(W, H);
    ui.showComposer();
  }
};

if (mode === 'recipient') {
  ui.showGate();
} else {
  ui.showComposer();
}
ui.setThemeSel(theme);
if (share) ui.state.theme = theme;

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    sizeCanvases();
    starfield.render(starsCtx, W, H);
    if (show.running) {
      show.resize(W, H, nowSec);
    } else if (swarm.mode === 'idle') {
      swarm.scatterIdle(W, H);
    }
  }, 200);
});

let last = performance.now();
let paused = false;

document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (!paused) last = performance.now();
});

function frame(nowMs) {
  requestAnimationFrame(frame);
  if (paused) return;
  const dt = Math.min((nowMs - last) / 1000, 0.05);
  last = nowMs;
  nowSec = nowMs / 1000;

  // Fade previous frame toward transparent (motion trails) instead of
  // clearing — destination-out keeps the canvas transparent over the stars.
  sceneCtx.globalCompositeOperation = 'destination-out';
  sceneCtx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
  sceneCtx.fillRect(0, 0, W, H);
  sceneCtx.globalCompositeOperation = 'source-over';

  starfield.drawTwinklers(sceneCtx, nowSec);

  show.update(dt, nowSec);
  swarm.update(dt, nowSec, W, H);
  swarm.draw(sceneCtx, nowSec);
}

requestAnimationFrame(frame);
