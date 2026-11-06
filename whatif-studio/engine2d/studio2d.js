// Motor 2D para Shorts (vertical 1080×1920). Misma interfaz que el motor 3D (window.studio),
// así sirven igual tools/render.mjs, tools/qa.mjs y tools/build.sh.
// Cada episodio 2D exporta setup(C) y draw(ctx, C, { t, scene, local, p }) → capa de texto.
import { drawOverlay } from '../engine/overlay.js';
import { splitCues, readTime, ease, lerp } from '../engine/text.js';
import * as kit from './kit.js';

export async function createStudio2D({ episode, W = 1080, H = 1920 }) {
  const base = `../episodes/${episode}/`;
  const script = await (await fetch(base + 'script.json')).json();
  const ep = await import(base + 'episode.js');

  // Línea de tiempo por lectura (igual que en 3D, sin narración).
  const gap = script.gap ?? 0.35;
  let acc = 0;
  const scenes = script.scenes.map((s, i) => {
    const cues = splitCues(s.text || '', script.cueChars ?? 80);
    const reading = cues.map((c) => readTime(c, script.cps ?? 14, script.cueMin ?? 2.2));
    const audio = reading.reduce((a, b) => a + b, 0);
    const total = audio || 1;
    let c0 = 0;
    const cueTimes = reading.map((r) => { const st = c0; c0 += (r / total) * audio; return [st, c0]; });
    const dur = Math.max(s.min ?? 0, audio + gap + (s.hold ?? 0));
    const sc = { ...s, index: i, start: acc, audio, dur, cues, cueTimes };
    acc += dur;
    return sc;
  });
  const duration = acc + (script.tail ?? 1.5);

  const out = document.getElementById('out');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');
  const C = { W, H, script, scenes, kit, ease, lerp };
  await (ep.setup?.(C));

  const sceneAt = (t) => scenes.find((s) => t < s.start + s.dur) || scenes[scenes.length - 1];
  function subtitleAt(s, local) {
    for (let i = 0; i < s.cues.length; i++) {
      const [a, b0] = s.cueTimes[i];
      const b = i === s.cues.length - 1 ? s.dur : b0;
      if (local >= a && local < b) return { text: s.cues[i], alpha: Math.max(0, Math.min(1, (local - a) / 0.18, (b - local) / 0.18)) };
    }
    return null;
  }

  function renderFrame(t, { bare = false } = {}) {
    const s = sceneAt(t);
    const local = t - s.start;
    const p = Math.min(1, Math.max(0, local / s.dur));
    ctx.save();
    const ov = ep.draw(ctx, C, { t, scene: s, local, p }) || {};
    ctx.restore();
    if (bare) return;
    drawOverlay(ctx, W, H, {
      subtitle: subtitleAt(s, local),
      fade: Math.max(t < 0.5 ? 1 - t / 0.5 : 0, t > duration - 1 ? t - (duration - 1) : 0),
      ...ov,
    });
  }

  return {
    renderFrame, duration, scenes, fps: script.fps ?? 30, overlaps: () => [],
    frame: (t, q = 0.92) => { renderFrame(t); return out.toDataURL('image/jpeg', q); },
  };
}
