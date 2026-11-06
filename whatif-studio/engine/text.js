// Utilidades sin dependencias (sirven al motor 3D y al 2D): subtítulos, tiempos de lectura y curvas.

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
