// Text/shape → target point sets. Everything is rasterized to an offscreen
// canvas as a white silhouette, pixel-sampled on a grid, normalized to the
// exact drone count, then scaled and centered into the viewport.

const off = document.createElement('canvas');
const octx = off.getContext('2d', { willReadFrequently: true });

function collect(data, w, h, step) {
  const pts = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        pts.push(
          x + (Math.random() - 0.5) * step,
          y + (Math.random() - 0.5) * step,
        );
      }
    }
  }
  return pts;
}

function shufflePairs(pts) {
  const n = pts.length / 2;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const xi = pts[i * 2], yi = pts[i * 2 + 1];
    pts[i * 2] = pts[j * 2]; pts[i * 2 + 1] = pts[j * 2 + 1];
    pts[j * 2] = xi; pts[j * 2 + 1] = yi;
  }
}

// Sample a silhouette drawn by drawFn onto a cw×ch canvas; return exactly
// `count` points mapped into rect {cx, cy, w, h} of the viewport.
function raster(cw, ch, drawFn, count, rect) {
  off.width = cw;
  off.height = ch;
  octx.clearRect(0, 0, cw, ch);
  octx.fillStyle = '#fff';
  drawFn(octx, cw, ch);

  const data = octx.getImageData(0, 0, cw, ch).data;
  let step = 4;
  let pts = collect(data, cw, ch, step);
  // Keep the shuffle cheap when a big silhouette wildly over-samples.
  while (pts.length / 2 > count * 4 && step < 12) {
    step += 2;
    pts = collect(data, cw, ch, step);
  }
  if (pts.length === 0) return null;

  shufflePairs(pts);
  let m = pts.length / 2;
  if (m > count) {
    pts.length = count * 2;
    m = count;
  } else if (m < count) {
    // Duplicate random points with jitter: short words render denser/brighter.
    for (let i = m; i < count; i++) {
      const j = (Math.random() * m) | 0;
      pts.push(
        pts[j * 2] + (Math.random() - 0.5) * step * 2,
        pts[j * 2 + 1] + (Math.random() - 0.5) * step * 2,
      );
    }
  }

  // Bounding box → scale-and-center into the target rect, preserving aspect.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const px = pts[i * 2], py = pts[i * 2 + 1];
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const bw = Math.max(maxX - minX, 1);
  const bh = Math.max(maxY - minY, 1);
  const scale = Math.min(rect.w / bw, rect.h / bh);
  const bcx = (minX + maxX) / 2;
  const bcy = (minY + maxY) / 2;

  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2] = rect.cx + (pts[i * 2] - bcx) * scale;
    out[i * 2 + 1] = rect.cy + (pts[i * 2 + 1] - bcy) * scale;
  }
  return out;
}

export function textTargets(text, count, W, H) {
  const cw = 1600, ch = 500;
  return raster(cw, ch, (ctx) => {
    let size = 300;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px Arial, "Helvetica Neue", sans-serif`;
    const width = ctx.measureText(text).width;
    if (width > cw * 0.92) {
      size = Math.floor(size * (cw * 0.92) / width);
      ctx.font = `900 ${size}px Arial, "Helvetica Neue", sans-serif`;
    }
    ctx.fillText(text, cw / 2, ch / 2);
  }, count, {
    cx: W / 2,
    cy: H * 0.45,
    w: W * 0.8,
    h: H * 0.4,
  });
}

export function shapeTargets(drawFn, count, W, H) {
  const s = 900;
  const side = Math.min(W * 0.62, H * 0.55);
  return raster(s, s, drawFn, count, {
    cx: W / 2,
    cy: H * 0.45,
    w: side,
    h: side,
  });
}

// Loose cloud in the upper sky — the post-launch gathering formation.
export function scatterTargets(count, W, H) {
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2] = W * (0.1 + Math.random() * 0.8);
    out[i * 2 + 1] = H * (0.08 + Math.random() * 0.52);
  }
  return out;
}
