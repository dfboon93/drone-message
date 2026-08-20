// Share-link codec: ?m=<base64url UTF-8 message>&s=<shape>&t=<theme>.
// The TextEncoder step is mandatory — plain btoa throws on non-Latin-1
// (emoji, accents). Decoded text is sanitized and only ever reaches
// canvas fillText or input.value, never innerHTML.

import { MAX_CHARS, SHAPE_IDS, THEMES, DEFAULT_THEME } from './config.js';

export function sanitizeMessage(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const msg = Array.from(cleaned).slice(0, MAX_CHARS).join('');
  return msg || null;
}

export function encodeShare({ message, shape, theme }) {
  const bytes = new TextEncoder().encode(message);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const params = new URLSearchParams();
  params.set('m', b64);
  if (shape && SHAPE_IDS.includes(shape)) params.set('s', shape);
  if (theme && theme !== DEFAULT_THEME && THEMES[theme]) params.set('t', theme);
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

// Returns {message, shape, theme} or null (→ composer mode).
export function decodeShare(search) {
  try {
    const params = new URLSearchParams(search);
    const m = params.get('m');
    if (!m) return null;
    const b64 = m.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const message = sanitizeMessage(new TextDecoder().decode(bytes));
    if (!message) return null;
    const s = params.get('s');
    const t = params.get('t');
    return {
      message,
      shape: SHAPE_IDS.includes(s) ? s : null,
      theme: THEMES[t] ? t : DEFAULT_THEME,
    };
  } catch {
    return null;
  }
}
