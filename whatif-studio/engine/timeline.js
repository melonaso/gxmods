// Motor determinista: dado un tiempo t (segundos) dibuja exactamente ese frame.
// El render no depende del reloj real, por lo que puede ir lento sin causar saltos.
import * as THREE from 'three';
import { createWorld } from './world.js';
import * as actors from './actors.js';
import { drawOverlay } from './overlay.js';

export async function createStudio({ episode, W = 1920, H = 1080 }) {
  const base = `../episodes/${episode}/`;
  const script = await (await fetch(base + 'script.json')).json();
  let timing = null;
  try { timing = await (await fetch(base + 'build/timing.json')).json(); } catch { /* sin audio aún */ }
  const ep = await import(base + 'episode.js');

  // Línea de tiempo: duración = audio real de la escena + pausa.
  // Sin narración ("narration": false) o sin audio, se usa el tiempo de lectura: palabras / wps.
  const gap = script.gap ?? 0.35;
  const wps = script.wps ?? 2.6; // palabras por segundo
  if (script.narration === false) timing = null;
  let acc = 0;
  const scenes = script.scenes.map((s, i) => {
    const words = (s.text || '').split(/\s+/).filter(Boolean).length;
    const audio = timing?.[i]?.duration ?? words / wps;
    const dur = Math.max(s.min ?? 0, audio + gap + (s.hold ?? 0));
    const sc = { ...s, index: i, start: acc, audio, dur };
    acc += dur;
    return sc;
  });
  const duration = acc + (script.tail ?? 1.5);

  const glCanvas = document.createElement('canvas');
  glCanvas.width = W; glCanvas.height = H;
  const out = document.getElementById('out');
  out.width = W; out.height = H;
  const ctx2d = out.getContext('2d');

  const world = createWorld(glCanvas, W, H);
  const C = { THREE, world, actors, script, scenes, W, H };
  ep.setup(C);

  function sceneAt(t) {
    for (const s of scenes) if (t < s.start + s.dur) return s;
    return scenes[scenes.length - 1];
  }

  /** Subtítulo: la narración en bloques de ~9 palabras repartidos según el audio. */
  function subtitleAt(s, local) {
    if (!s.text || local > s.audio + 0.2) return null;
    const words = s.text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += 9) chunks.push(words.slice(i, i + 9).join(' '));
    const lens = chunks.map((c) => c.length);
    const total = lens.reduce((a, b) => a + b, 0);
    let pos = (local / Math.max(s.audio, 0.01)) * total;
    for (let i = 0; i < chunks.length; i++) { if (pos < lens[i]) return chunks[i]; pos -= lens[i]; }
    return chunks[chunks.length - 1];
  }

  function renderFrame(t) {
    const s = sceneAt(t);
    const local = t - s.start;
    const p = Math.min(1, Math.max(0, local / s.dur));
    const ov = ep.update(C, { t, scene: s, local, p }) || {};
    world.renderer.render(world.scene, world.camera);
    ctx2d.drawImage(glCanvas, 0, 0);
    drawOverlay(ctx2d, W, H, {
      subtitle: script.subtitles === false ? null : subtitleAt(s, local),
      fade: Math.max(t < 0.6 ? 1 - t / 0.6 : 0, t > duration - 1 ? (t - (duration - 1)) : 0),
      ...ov,
    });
  }

  return { renderFrame, duration, scenes, fps: script.fps ?? 30, frame: (t, q = 0.92) => { renderFrame(t); return out.toDataURL('image/jpeg', q); } };
}

// Utilidades de animación para los episodios.
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
};
export const lerp = (a, b, x) => a + (b - a) * x;
/** Interpolación logarítmica: útil cuando una magnitud crece en órdenes de magnitud. */
export const lerpLog = (a, b, x) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * x);
