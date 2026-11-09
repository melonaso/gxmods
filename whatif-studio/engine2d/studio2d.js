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

  // Con voz grabada ("voice" en el guion), tools/voice.py deja build/timing.json con lo que dura la
  // voz de cada escena y cuándo empieza cada subtítulo: la escena dura lo que dura su voz.
  // Sin voz, la línea de tiempo sale del tiempo de lectura (igual que en 3D).
  // (Mientras no llegue el audio, se usa el tiempo de lectura para poder revisar el video.)
  const tres = script.voice ? await fetch(base + 'build/timing.json') : null;
  const timing = tres && tres.ok ? await tres.json() : null;
  const gap = timing ? (script.voice.gap ?? 0.22) : (script.gap ?? 0.35);
  let acc = 0;
  const scenes = script.scenes.map((s, i) => {
    // "caps": frases ya cortadas a mano (Shorts de ritmo rápido); si no, se cortan por oraciones.
    const cues = s.caps ?? splitCues(s.text || '', script.cueChars ?? 80);
    let audio, cueTimes, minDur = s.min ?? 0;
    if (timing) {
      audio = timing[i].dur; cueTimes = timing[i].cues; minDur = s.min ?? script.voice.min ?? 0;
    } else {
      const reading = cues.map((c) => readTime(c.replace(/\*/g, ''), script.cps ?? 14, script.cueMin ?? 2.2));
      audio = reading.reduce((a, b) => a + b, 0);
      const total = audio || 1;
      let c0 = 0;
      cueTimes = reading.map((r) => { const st = c0; c0 += (r / total) * audio; return [st, c0]; });
    }
    const dur = Math.max(minDur, audio + gap + (s.hold ?? 0));
    const sc = { ...s, index: i, start: acc, audio, dur, cues, cueTimes };
    acc += dur;
    return sc;
  });
  const duration = acc + (script.tail ?? 1.5);

  // Efectos de sonido: "whoosh" en cada corte de escena (script.sfx) y golpes puntuales que pide
  // cada escena en "fx": [{ type, cue, at }] (cue = índice de la frase; at = segundos extra).
  const sfx = [];
  for (const s of scenes) {
    if (script.sfx && s.index > 0) sfx.push({ t: s.start, type: 'whoosh' });
    for (const f of s.fx || []) sfx.push({ t: s.start + (f.cue != null ? s.cueTimes[f.cue][0] : 0) + (f.at ?? 0), type: f.type });
  }
  sfx.sort((a, b) => a.t - b.t);

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
      if (local >= a && local < b) {
        if (script.captions === 'pop') return { text: s.cues[i], style: 'pop', age: local - a, alpha: Math.max(0, Math.min(1, (b - local) / 0.08)) };
        return { text: s.cues[i], alpha: Math.max(0, Math.min(1, (local - a) / 0.18, (b - local) / 0.18)) };
      }
    }
    return null;
  }

  function renderFrame(t, { bare = false } = {}) {
    const s = sceneAt(t);
    const local = t - s.start;
    const p = Math.min(1, Math.max(0, local / s.dur));
    ctx.save();
    // "punch": al empezar cada escena la imagen entra un poco ampliada y se asienta (corte con golpe).
    if (script.punch && s.index > 0) {
      const k = 1 + script.punch * Math.pow(Math.max(0, 1 - local / 0.22), 2);
      ctx.translate(W / 2, H * 0.42); ctx.scale(k, k); ctx.translate(-W / 2, -H * 0.42);
    }
    // "hookZoom": el primer fotograma ya se está moviendo (acercamiento que se asienta en ~0.6 s).
    if (script.hookZoom && s.index === 0) {
      const k = 1 + script.hookZoom * Math.pow(Math.max(0, 1 - local / 0.6), 2);
      ctx.translate(W / 2, H * 0.42); ctx.scale(k, k); ctx.translate(-W / 2, -H * 0.42);
    }
    const ov = ep.draw(ctx, C, { t, scene: s, local, p }) || {};
    ctx.restore();
    if (bare) return;
    // "hookTitle": la pregunta en grande, arriba, desde el fotograma 1 y durante toda la primera escena
    // (el primer segundo decide si la gente se queda o desliza).
    if (script.hookTitle && s.index === 0) {
      const lines = [].concat(script.hookTitle), k = 1 + 0.18 * Math.pow(Math.max(0, 1 - local / 0.18), 2);
      ctx.save(); ctx.translate(W / 2, 250); ctx.scale(k, k);
      lines.forEach((ln, i) => kit.text(ctx, ln, 0, (i - (lines.length - 1) / 2) * 112, { size: 100, fill: i === lines.length - 1 ? kit.YELLOW : '#ffffff', maxW: W * 0.92 }));
      ctx.restore();
    }
    drawOverlay(ctx, W, H, {
      subtitle: subtitleAt(s, local),
      fade: Math.max(t < (script.fadeIn ?? 0.5) ? 1 - t / (script.fadeIn ?? 0.5) : 0, t > duration - 1 ? t - (duration - 1) : 0),
      ...ov,
    });
  }

  return {
    renderFrame, duration, scenes, sfx, fps: script.fps ?? 30, overlaps: () => [],
    frame: (t, q = 0.92) => { renderFrame(t); return out.toDataURL('image/jpeg', q); },
  };
}
