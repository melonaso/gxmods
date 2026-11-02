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
    ctx.save();
    ctx.font = `700 ${46 * u}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrap(ctx, ov.subtitle, W * 0.72);
    const lh = 60 * u;
    const y0 = H - 110 * u - (lines.length - 1) * lh;
    lines.forEach((ln, i) => stroked(ctx, ln, W / 2, y0 + i * lh, '#ffffff', 10 * u, 'center'));
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

function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
