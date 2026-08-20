// Night-sky backdrop: ~300 static stars pre-rendered once to the bottom
// canvas (redrawn only on resize), plus a small set of twinklers drawn on
// the scene canvas every frame.

const STATIC_COUNT = 300;
const TWINKLER_COUNT = 50;

export class Starfield {
  constructor() {
    this.twinklers = [];
  }

  render(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < STATIC_COUNT; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.1 + 0.2;
      ctx.globalAlpha = 0.05 + Math.random() * 0.25;
      ctx.fillStyle = Math.random() < 0.15 ? '#cfe4ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.twinklers = [];
    for (let i = 0; i < TWINKLER_COUNT; i++) {
      this.twinklers.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.4,
        f: 0.5 + Math.random() * 1.5,
        p: Math.random() * Math.PI * 2,
      });
    }
  }

  drawTwinklers(ctx, now) {
    ctx.fillStyle = '#ffffff';
    for (const s of this.twinklers) {
      ctx.globalAlpha = 0.08 + 0.22 * (0.5 + 0.5 * Math.sin(now * s.f + s.p));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
