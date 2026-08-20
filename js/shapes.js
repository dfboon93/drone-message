// Preset formations, drawn as filled white silhouettes so their sampled
// density matches the text phases. Adding a shape = one draw function here.

function heart(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) / 36; // parametric curve spans roughly ±16 x ±17
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const px = cx + x * scale;
    const py = cy - y * scale + scale; // -y: canvas y grows downward
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function star(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.46;
  const r = R * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function moon(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // Carve the crescent out of the disc.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + R * 0.5, cy - R * 0.18, R * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function flower(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.44;
  const petalR = R * 0.3;
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6, petalR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function diamond(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const hw = Math.min(w, h) * 0.34;
  const hh = Math.min(w, h) * 0.46;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fill();
}

export const SHAPES = { heart, star, moon, flower, diamond };
