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
  // Sin narración ("narration": false) o sin audio, se usa el tiempo de lectura de sus subtítulos.
  const gap = script.gap ?? 0.35;
  if (script.narration === false) timing = null;
  let acc = 0;
  const scenes = script.scenes.map((s, i) => {
    const cues = splitCues(s.text || '', script.cueChars ?? 80);
    const reading = cues.map((c) => readTime(c, script.cps ?? 14, script.cueMin ?? 2.2));
    const audio = timing?.[i]?.duration ?? reading.reduce((a, b) => a + b, 0);
    // Reparto del tiempo de la escena entre subtítulos, proporcional a su tiempo de lectura.
    const total = reading.reduce((a, b) => a + b, 0) || 1;
    let c0 = 0;
    const cueTimes = reading.map((r) => { const st = c0; c0 += (r / total) * audio; return [st, c0]; });
    const dur = Math.max(s.min ?? 0, audio + gap + (s.hold ?? 0));
    const sc = { ...s, index: i, start: acc, audio, dur, cues, cueTimes };
    acc += dur;
    return sc;
  });
  const duration = acc + (script.tail ?? 1.5);

  // Supermuestreo: la escena 3D se dibuja a SS× la resolución y se reduce suavizada al tamaño final.
  // Elimina el "hormigueo" de bordes finos (ventanas, líneas de la calle) cuando la cámara se mueve.
  const SS = script.supersample ?? 1.5;
  const glCanvas = document.createElement('canvas');
  glCanvas.width = Math.round(W * SS); glCanvas.height = Math.round(H * SS);
  const out = document.getElementById('out');
  out.width = W; out.height = H;
  const ctx2d = out.getContext('2d');

  const world = createWorld(glCanvas, glCanvas.width, glCanvas.height, script.world || {});
  const C = { THREE, world, actors, script, scenes, W, H };
  ep.setup(C);

  function sceneAt(t) {
    for (const s of scenes) if (t < s.start + s.dur) return s;
    return scenes[scenes.length - 1];
  }

  /** Subtítulo activo: una oración (o cláusula) completa, con fundido corto al entrar y salir. */
  function subtitleAt(s, local) {
    if (!s.cues.length) return null;
    const F = 0.18;
    for (let i = 0; i < s.cues.length; i++) {
      const [a, b0] = s.cueTimes[i];
      // El último subtítulo se queda hasta que termina la escena (más tiempo para leer).
      const b = i === s.cues.length - 1 ? s.dur : b0;
      if (local >= a && local < b) {
        const alpha = Math.min(1, (local - a) / F, (b - local) / F);
        return { text: s.cues[i], alpha: Math.max(0, alpha) };
      }
    }
    return null;
  }

  /** Dibuja el frame del instante t. bare = solo la escena 3D (para miniaturas). */
  function renderFrame(t, { bare = false, frame = null } = {}) {
    const s = sceneAt(t);
    const local = t - s.start;
    const p = Math.min(1, Math.max(0, local / s.dur));
    const ov = ep.update(C, { t, scene: s, local, p }) || {};
    // Reencuadre opcional (miniaturas): zoom alrededor del centro y desplazamiento en píxeles.
    if (frame) {
      const z = frame.zoom ?? 1, fw = W * z, fh = H * z;
      world.camera.setViewOffset(fw, fh, (fw - W) / 2 - (frame.dx ?? 0), (fh - H) / 2 - (frame.dy ?? 0), W, H);
    } else world.camera.clearViewOffset();
    world.renderer.render(world.scene, world.camera);
    ctx2d.imageSmoothingEnabled = true; ctx2d.imageSmoothingQuality = 'high';
    ctx2d.drawImage(glCanvas, 0, 0, W, H);
    if (bare) return;
    drawOverlay(ctx2d, W, H, {
      subtitle: script.subtitles === false ? null : subtitleAt(s, local),
      fade: Math.max(t < 0.6 ? 1 - t / 0.6 : 0, t > duration - 1 ? (t - (duration - 1)) : 0),
      ...ov,
    });
  }

  /** Control de calidad: pares de objetos sólidos visibles que se enciman en planta (más de 0.3 m). */
  function overlaps() {
    const solids = [];
    world.scene.updateMatrixWorld(true);
    world.scene.traverse((o) => {
      if (!o.userData?.solid) return;
      let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false;
      if (v) solids.push({ o, b: new THREE.Box3().setFromObject(o, true) }); // precisa: sobre los vértices reales
    });
    const out = [];
    for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
      const a = solids[i].b, b = solids[j].b;
      const ox = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
      const oz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
      const oy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
      // Las cajas alineadas a los ejes se inflan con objetos girados: si ambos declaran su radio en
      // planta, el choque se confirma con la distancia real entre centros.
      const oa = solids[i].o, obj = solids[j].o;
      if (ox > 0.3 && oz > 0.3 && oy > 0 && oa.userData.radius && obj.userData.radius) {
        const pa = oa.getWorldPosition(new THREE.Vector3()), pb = obj.getWorldPosition(new THREE.Vector3());
        const ra = oa.userData.radius * oa.getWorldScale(new THREE.Vector3()).x, rb = obj.userData.radius * obj.getWorldScale(new THREE.Vector3()).x;
        if (Math.hypot(pa.x - pb.x, pa.z - pb.z) >= ra + rb - 0.3) continue;
      }
      if (ox > 0.3 && oz > 0.3 && oy > 0) {
        const c = (bx) => `(${bx.getCenter(new THREE.Vector3()).x.toFixed(0)}, ${bx.getCenter(new THREE.Vector3()).z.toFixed(0)})`;
        out.push(`${solids[i].o.userData.solid} ${c(a)} ↔ ${solids[j].o.userData.solid} ${c(b)}`);
      }
    }
    return out;
  }

  return { renderFrame, overlaps, world, duration, scenes, fps: script.fps ?? 30, frame: (t, q = 0.92) => { renderFrame(t); return out.toDataURL('image/jpeg', q); } };
}

/**
 * Divide un texto en subtítulos legibles:
 * 1) por oraciones (. ! ? …), sin romper números como 3.65;
 * 2) si una oración supera maxChars, la parte en la coma/dos puntos más cercana a la mitad.
 */
export function splitCues(text, maxChars = 80) {
  const sentences = text.trim().split(/(?<=[.!?…])\s+(?=[¿¡"«(A-ZÁÉÍÓÚÑ0-9])/u).filter(Boolean);
  const out = [];
  const cut = (str) => {
    if (str.length <= maxChars) return out.push(str);
    const mid = str.length / 2;
    let best = -1;
    for (const m of str.matchAll(/[,;:](?=\s)/g)) {
      if (best < 0 || Math.abs(m.index - mid) < Math.abs(best - mid)) best = m.index;
    }
    if (best < 0) { // sin comas: corta en el espacio más cercano a la mitad
      const sp = [...str.matchAll(/\s/g)].map((m) => m.index);
      best = sp.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a), sp[0] ?? -1);
      if (best < 0) return out.push(str);
      cut(str.slice(0, best).trim()); cut(str.slice(best).trim());
      return;
    }
    cut(str.slice(0, best + 1).trim()); cut(str.slice(best + 1).trim());
  };
  sentences.forEach(cut);
  return out;
}

/** Tiempo para leer un subtítulo: caracteres / velocidad (cps), con un mínimo en pantalla. */
export function readTime(cue, cps = 14, min = 2.2) {
  return Math.max(min, cue.length / cps + 0.4);
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
