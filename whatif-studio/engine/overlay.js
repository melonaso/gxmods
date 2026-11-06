// Capa 2D sobre el render 3D: contador grande, etiqueta de tiempo, título y subtítulos.

const FONT = 'Inter, "DejaVu Sans", sans-serif';

/**
 * ov = {
 *   counter: { label, value, color } | null,   // arriba a la izquierda
 *   chip: string | null,                       // arriba a la derecha (ej. "AÑO 10")
 *   title: { lines: [..], alpha } | null,      // tarjeta central grande
 *   subtitle: string | null,                   // texto inferior
 *   fade: 0..1                                 // fundido a negro
 * }
 */
export function drawOverlay(ctx, W, H, ov) {
  const u = H / 1080; // escala relativa a 1080p

  // Etiquetas ancladas a puntos de la escena (el episodio ya las proyectó a píxeles).
  if (ov.labels) {
    ctx.save();
    for (const lb of ov.labels) {
      ctx.globalAlpha = lb.alpha ?? 1;
      ctx.font = `800 ${30 * u}px ${FONT}`;
      const tw = ctx.measureText(lb.text).width, pad = 16 * u, h = 48 * u;
      const x = Math.min(W - tw - pad * 2 - 10 * u, Math.max(10 * u, lb.x - (tw + pad * 2) / 2)), y = lb.y - h - 14 * u;
      ctx.fillStyle = lb.bg || 'rgba(15,23,42,0.82)';
      roundRect(ctx, x, y, tw + pad * 2, h, 12 * u); ctx.fill();
      ctx.beginPath(); ctx.moveTo(lb.x - 9 * u, y + h); ctx.lineTo(lb.x + 9 * u, y + h); ctx.lineTo(lb.x, y + h + 12 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lb.color || '#ffffff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(lb.text, x + pad, y + h / 2 + 2 * u);
    }
    ctx.restore();
  }

  if (ov.counter) {
    const { label, value, color = '#ffd34d', alpha = 1 } = ov.counter;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.font = `800 ${34 * u}px ${FONT}`;
    stroked(ctx, label, 70 * u, 60 * u, '#ffffff', 8 * u);
    ctx.font = `900 ${118 * u}px ${FONT}`;
    stroked(ctx, value, 64 * u, 100 * u, color, 14 * u);
    ctx.restore();
  }

  if (ov.chip) {
    ctx.save();
    ctx.font = `800 ${40 * u}px ${FONT}`;
    const tw = ctx.measureText(ov.chip).width;
    const pad = 26 * u, h = 72 * u;
    const x = W - 70 * u - tw - pad * 2, y = 60 * u;
    ctx.fillStyle = 'rgba(15,23,42,0.78)';
    roundRect(ctx, x, y, tw + pad * 2, h, 18 * u);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(ov.chip, x + pad, y + h / 2 + 2 * u);
    ctx.restore();
  }

  if (ov.title && ov.title.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = ov.title.alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = ov.title.lines;
    const cy = H * (ov.title.y ?? 0.5); // posición vertical (fracción de la altura)
    lines.forEach((ln, i) => {
      const big = i === lines.length - 1;
      ctx.font = `900 ${(big ? 104 : 60) * u}px ${FONT}`;
      const y = cy + (i - (lines.length - 1) / 2) * 120 * u;
      stroked(ctx, ln, W / 2, y, big ? '#ffd34d' : '#ffffff', 14 * u, 'center');
    });
    ctx.restore();
  }

  if (ov.subtitle) {
    // Acepta texto plano o { text, alpha }. Caja oscura detrás para leer sobre cualquier fondo.
    const sub = typeof ov.subtitle === 'string' ? { text: ov.subtitle, alpha: 1 } : ov.subtitle;
    ctx.save();
    ctx.globalAlpha = sub.alpha ?? 1;
    ctx.font = `700 ${48 * u}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = balance(ctx, sub.text, W * 0.62);
    const lh = 64 * u;
    const y0 = H - 120 * u - (lines.length - 1) * lh;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 64 * u;
    const bh = lines.length * lh + 36 * u;
    ctx.fillStyle = 'rgba(10,14,25,0.62)';
    roundRect(ctx, W / 2 - bw / 2, y0 - lh / 2 - 18 * u, bw, bh, 20 * u);
    ctx.fill();
    lines.forEach((ln, i) => stroked(ctx, ln, W / 2, y0 + i * lh, '#ffffff', 6 * u, 'center'));
    ctx.restore();
  }

  if (ov.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, ov.fade)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function stroked(ctx, text, x, y, fill, lw, align = 'left') {
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#111827';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Reparte el texto en líneas de largo parecido (evita una línea larga y otra de 1 palabra). */
function balance(ctx, text, maxW) {
  const lines = wrap(ctx, text, maxW);
  if (lines.length < 2) return lines;
  const total = ctx.measureText(text).width;
  let lo = total / lines.length, hi = maxW, best = lines;
  for (let k = 0; k < 12; k++) {
    const m = (lo + hi) / 2, t = wrap(ctx, text, m);
    if (t.length <= lines.length) { best = t; hi = m; } else lo = m;
  }
  return best;
}

function wrap(ctx, text, maxW) {
  // Solo corta en espacios normales: el espacio no separable (U+00A0) mantiene unidos número y unidad.
  const words = text.split(/[ \t\n]+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
