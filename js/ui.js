// DOM wiring for the composer card, tap-to-start gate, end card, and HUD.
// Message text only ever flows through input.value — never innerHTML.

import { MAX_CHARS, DEFAULT_THEME } from './config.js';
import { sanitizeMessage } from './url.js';

const $ = (id) => document.getElementById(id);

export function initUI(handlers) {
  const els = {
    composer: $('composer'),
    gate: $('gate'),
    endcard: $('endcard'),
    hud: $('hud'),
    input: $('msgInput'),
    charCount: $('charCount'),
    shapePick: $('shapePick'),
    themePick: $('themePick'),
    previewBtn: $('previewBtn'),
    copyBtn: $('copyBtn'),
    beginBtn: $('beginBtn'),
    replayBtn: $('replayBtn'),
    createLink: $('createLink'),
    muteBtn: $('muteBtn'),
    backBtn: $('backBtn'),
  };

  const state = { shape: null, theme: DEFAULT_THEME };

  const message = () => sanitizeMessage(els.input.value);

  function refresh() {
    const len = Array.from(els.input.value).length;
    els.charCount.textContent = `${len} / ${MAX_CHARS}`;
    const ok = !!message();
    els.previewBtn.disabled = !ok;
    els.copyBtn.disabled = !ok;
  }

  function pickIn(container, attr, onPick) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest(`[data-${attr}]`);
      if (!btn) return;
      for (const b of container.children) b.classList.remove('sel');
      btn.classList.add('sel');
      onPick(btn.dataset[attr] || null);
    });
  }

  els.input.addEventListener('input', refresh);
  refresh();

  pickIn(els.shapePick, 'shape', (v) => { state.shape = v; });
  pickIn(els.themePick, 'theme', (v) => {
    state.theme = v || DEFAULT_THEME;
    handlers.onTheme(state.theme);
  });

  els.previewBtn.addEventListener('click', () => {
    const msg = message();
    if (msg) handlers.onPreview({ message: msg, shape: state.shape, theme: state.theme });
  });

  els.copyBtn.addEventListener('click', async () => {
    const msg = message();
    if (!msg) return;
    const link = handlers.makeLink({ message: msg, shape: state.shape, theme: state.theme });
    let copied = false;
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
    } catch {
      const tmp = document.createElement('input');
      tmp.value = link;
      document.body.appendChild(tmp);
      tmp.select();
      copied = document.execCommand('copy');
      tmp.remove();
    }
    els.copyBtn.textContent = copied ? 'Copied!' : 'Copy failed';
    setTimeout(() => { els.copyBtn.textContent = 'Copy link'; }, 1600);
  });

  els.beginBtn.addEventListener('click', handlers.onBegin);
  els.replayBtn.addEventListener('click', handlers.onReplay);
  els.backBtn.addEventListener('click', handlers.onBack);
  els.muteBtn.addEventListener('click', () => {
    els.muteBtn.textContent = handlers.onMute() ? '\u{1F507}' : '\u{1F50A}';
  });
  els.createLink.href = location.origin + location.pathname;

  return {
    state,
    showComposer() {
      els.composer.classList.remove('hidden');
      els.gate.classList.add('hidden');
      els.endcard.classList.add('hidden');
      els.hud.classList.add('hidden');
    },
    showGate() {
      els.gate.classList.remove('hidden');
      els.composer.classList.add('hidden');
      els.endcard.classList.add('hidden');
      els.hud.classList.add('hidden');
    },
    showPlayback({ allowBack }) {
      els.composer.classList.add('hidden');
      els.gate.classList.add('hidden');
      els.endcard.classList.add('hidden');
      els.hud.classList.remove('hidden');
      els.backBtn.classList.toggle('hidden', !allowBack);
    },
    showEndcard() {
      els.endcard.classList.remove('hidden');
      els.hud.classList.remove('hidden');
      els.backBtn.classList.add('hidden');
    },
    setThemeSel(theme) {
      for (const b of els.themePick.children) {
        b.classList.toggle('sel', b.dataset.theme === theme);
      }
    },
  };
}
