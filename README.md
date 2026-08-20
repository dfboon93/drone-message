# drone-message

An app for sending people messages "written" by drones — replicating the real-life drone light show trend, but built entirely with frontend code.

Instead of physical drones and LEDs, this app simulates the effect in the browser: hundreds of glowing "drone" lights launch from the ground, gather in the night sky, and fly into formation to spell out a custom message — phase by phase for longer messages, just like real shows — optionally closing with a heart or star formation.

## How it works

- **Send**: type a message, pick an optional closing shape (♥ / ★) and a light color, then **Copy link**. The message is encoded in the URL itself — no backend, no storage.
- **Receive**: open the link, tap to begin, and watch the swarm spell it out over a twinkling starfield with ambient WebAudio sound (synthesized in the browser — no audio files).

## Tech

Vanilla HTML/CSS/JS + Canvas 2D. No frameworks, no build step, no dependencies.

- Text and shapes are rasterized to an offscreen canvas and pixel-sampled into target points; every phase uses the exact same drone count so transitions read like one continuous swarm.
- Drones are simulated with under-damped springs (struct-of-arrays `Float32Array`s), staggered per-drone delays, and a pre-rendered additive glow sprite for 60 fps at 1000+ drones.
- Messages are base64url-encoded UTF-8 (`?m=…&s=heart&t=ice`), sanitized on decode, and only ever drawn to canvas.

## Run locally

ES modules need a server (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Host on GitHub Pages

Settings → Pages → Deploy from branch → `main` / root. The site is fully static.
