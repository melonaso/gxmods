// Texturas procedurales (dibujadas en canvas): pasto, asfalto, ladrillo, tejas, corteza, madera...
// Todas con mipmaps y filtrado anisotrópico: a lo lejos se suavizan en lugar de "hormiguear".
// Cada una trae su mapa de relieve (normalMap) calculado de la misma imagen, para que la luz
// marque las juntas de los ladrillos, las tejas o la corteza.
import * as THREE from 'three';

const cache = new Map();
let maxAniso = 8;
export function setAnisotropy(n) { maxAniso = n; }

function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function canvas(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function toTexture(c, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = maxAniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** Mapa de normales a partir de una imagen en escala de grises (claro = alto). */
function normalFrom(c, strength = 2) {
  const n = c.width, src = c.getContext('2d').getImageData(0, 0, n, n).data;
  const [oc, og] = canvas(n);
  const out = og.createImageData(n, n);
  const h = (x, y) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  og.putImageData(out, 0, 0);
  return toTexture(oc, { srgb: false });
}

/** Ruido de manchas suaves (varias escalas) sobre un color base. */
function blotches(g, n, r, colors, count, rmin, rmax, alpha = 0.35) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = alpha * (0.4 + r() * 0.6);
    g.fillStyle = colors[(r() * colors.length) | 0];
    const x = r() * n, y = r() * n, rad = rmin + r() * (rmax - rmin);
    for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { g.beginPath(); g.arc(x + ox, y + oy, rad, 0, Math.PI * 2); g.fill(); }
  }
  g.globalAlpha = 1;
}

function make(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/** Pasto: verde con manchas y briznas (para mezclar como detalle sobre el suelo). */
export const grass = () => make('grass', () => {
  const n = 512, [c, g] = canvas(n), r = rng(11);
  g.fillStyle = '#7fb04a'; g.fillRect(0, 0, n, n);
  blotches(g, n, r, ['#6e9f3f', '#8dbd57', '#77a845', '#93c25e'], 220, 6, 40, 0.3);
  g.lineWidth = 1.5;
  for (let i = 0; i < 5000; i++) {
    const x = r() * n, y = r() * n, l = 3 + r() * 6;
    g.strokeStyle = r() < 0.5 ? 'rgba(60,110,40,0.5)' : 'rgba(170,210,110,0.45)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke();
  }
  return { map: toTexture(c) };
});

/** Asfalto con grava fina, manchas y línea central discontinua (pintada: sin piezas encimadas). */
export const asphalt = (lines = true) => make('asphalt' + lines, () => {
  const n = 512, [c, g] = canvas(n), r = rng(5);
  g.fillStyle = '#4a4f57'; g.fillRect(0, 0, n, n);
  blotches(g, n, r, ['#41464d', '#555a62', '#3c4148'], 90, 10, 60, 0.35);
  for (let i = 0; i < 26000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,32,36,0.55)' : 'rgba(140,145,150,0.45)'; g.fillRect(r() * n, r() * n, 1.4, 1.4); }
  // Grietas finas.
  g.strokeStyle = 'rgba(25,27,30,0.55)'; g.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) { let x = r() * n, y = r() * n; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  const height = document.createElement('canvas'); height.width = height.height = n; const hg = height.getContext('2d'); hg.drawImage(c, 0, 0);
  if (lines) {
    // La textura cubre 8 m × 8 m: línea central de 15 cm, tramos de 3 m cada 6 m; bordes blancos.
    const px = n / 8;
    g.fillStyle = '#e8e3c8'; g.fillRect(n / 2 - 0.075 * px, 0.75 * px, 0.15 * px, 3 * px);
    g.fillStyle = '#d9d9d9'; g.fillRect(0.25 * px, 0, 0.12 * px, n); g.fillRect(n - 0.37 * px, 0, 0.12 * px, n);
  }
  return { map: toTexture(c), normalMap: normalFrom(height, 1.2) };
});

/** Banqueta de concreto en losas de 1 m. */
export const concrete = () => make('concrete', () => {
  const n = 256, [c, g] = canvas(n), r = rng(8);
  g.fillStyle = '#c9c6bf'; g.fillRect(0, 0, n, n);
  blotches(g, n, r, ['#bdb9b1', '#d3d0c9', '#c2beb6'], 60, 6, 30, 0.4);
  for (let i = 0; i < 6000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,90,90,0.25)' : 'rgba(255,255,255,0.25)'; g.fillRect(r() * n, r() * n, 1.2, 1.2); }
  g.strokeStyle = '#8f8b84'; g.lineWidth = 3; g.strokeRect(0, 0, n, n);
  return { map: toTexture(c), normalMap: normalFrom(c, 2.5) };
});

/** Ladrillo (para muros): 1 repetición = 1 m × 1 m. */
export const brick = (base = '#b5563b') => make('brick' + base, () => {
  const n = 512, [c, g] = canvas(n), r = rng(3);
  const [hc, hg] = canvas(n);
  g.fillStyle = '#d8cfc0'; g.fillRect(0, 0, n, n);           // junta
  hg.fillStyle = '#000'; hg.fillRect(0, 0, n, n);
  const rows = 15, bh = n / rows, bw = n / 4;
  const col = new THREE.Color(base);
  for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
    const ox = (y % 2) * bw / 2, px = x * bw + ox + 3, py = y * bh + 3;
    const k = 0.82 + r() * 0.3;
    g.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
    g.fillRect(px, py, bw - 6, bh - 6);
    hg.fillStyle = '#ccc'; hg.fillRect(px, py, bw - 6, bh - 6);
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'; g.fillRect(r() * n, r() * n, 2, 2); }
  return { map: toTexture(c), normalMap: normalFrom(hc, 3) };
});

/** Fachada de tablas horizontales (siding) en el color dado. */
export const siding = (base = '#f1e3c6') => make('siding' + base, () => {
  const n = 256, [c, g] = canvas(n), r = rng(4), [hc, hg] = canvas(n);
  const col = new THREE.Color(base);
  const boards = 8, bh = n / boards;
  for (let i = 0; i < boards; i++) {
    const k = 0.94 + r() * 0.08;
    g.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
    g.fillRect(0, i * bh, n, bh);
    const grad = hg.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
    grad.addColorStop(0, '#333'); grad.addColorStop(0.15, '#ddd'); grad.addColorStop(1, '#888');
    hg.fillStyle = grad; hg.fillRect(0, i * bh, n, bh);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, (i + 1) * bh - 3, n, 3);
  }
  return { map: toTexture(c), normalMap: normalFrom(hc, 2) };
});

/** Tejas (techo): filas escalonadas. 1 repetición = 1 m × 1 m. */
export const shingles = (base = '#9a3412') => make('shingle' + base, () => {
  const n = 256, [c, g] = canvas(n), r = rng(6), [hc, hg] = canvas(n);
  const col = new THREE.Color(base);
  const rows = 8, rh = n / rows, sw = n / 6;
  hg.fillStyle = '#000'; hg.fillRect(0, 0, n, n);
  for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
    const px = x * sw + (y % 2) * sw / 2, py = y * rh, k = 0.8 + r() * 0.35;
    g.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
    g.fillRect(px + 1, py, sw - 2, rh);
    const gr = hg.createLinearGradient(0, py, 0, py + rh); gr.addColorStop(0, '#222'); gr.addColorStop(1, '#eee');
    hg.fillStyle = gr; hg.fillRect(px + 1, py, sw - 2, rh);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(px + 1, py + rh - 5, sw - 2, 5); g.fillRect(px, py, 2, rh);
  }
  return { map: toTexture(c), normalMap: normalFrom(hc, 2.5) };
});

/** Corteza: vetas verticales. */
export const bark = () => make('bark', () => {
  const n = 256, [c, g] = canvas(n), r = rng(9);
  g.fillStyle = '#6b4426'; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 260; i++) {
    const x = r() * n, w = 2 + r() * 5;
    g.fillStyle = r() < 0.5 ? 'rgba(40,25,12,0.55)' : 'rgba(140,100,60,0.4)';
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= n; y += 16) g.lineTo(x + Math.sin(y * 0.05 + i) * 3, y);
    g.lineTo(x + w, n); g.lineTo(x + w, 0); g.closePath(); g.fill();
  }
  return { map: toTexture(c), normalMap: normalFrom(c, 3) };
});

/** Follaje: hojas pequeñas en varios verdes (para las copas de los árboles y los arbustos). */
export const leaves = (base = '#3f8f3a') => make('leaves' + base, () => {
  const n = 256, [c, g] = canvas(n), r = rng(12);
  const col = new THREE.Color(base);
  g.fillStyle = base; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 1400; i++) {
    const k = 0.7 + r() * 0.55;
    g.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
    g.save(); g.translate(r() * n, r() * n); g.rotate(r() * Math.PI * 2);
    g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  return { map: toTexture(c), normalMap: normalFrom(c, 2) };
});

/** Madera (bancas, puertas, cercas). */
export const wood = (base = '#8b5a2b') => make('wood' + base, () => {
  const n = 256, [c, g] = canvas(n), r = rng(14);
  g.fillStyle = base; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 90; i++) {
    const y = r() * n; g.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)'; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= n; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 2); g.stroke();
  }
  return { map: toTexture(c), normalMap: normalFrom(c, 1.5) };
});

/** Nieve: blanca con brillos y ondulaciones muy suaves (poco contraste: no hormiguea). */
export const snow = () => make('snow', () => {
  const n = 512, [c, g] = canvas(n), r = rng(21);
  g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, n, n);
  blotches(g, n, r, ['#e6edf6', '#ffffff', '#eaf0f8'], 160, 10, 60, 0.5);
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.6 ? 'rgba(200,215,235,0.5)' : 'rgba(255,255,255,0.9)'; g.fillRect(r() * n, r() * n, 1.5, 1.5); }
  return { map: toTexture(c), normalMap: normalFrom(c, 1.2) };
});

/** Pelota de básquet: naranja con las líneas negras (mapa equirectangular para una esfera). */
export const basketball = () => make('basketball', () => {
  const w = 512, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), r = rng(2);
  g.fillStyle = '#e8712a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,40,0,0.25)' : 'rgba(255,190,140,0.2)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  g.strokeStyle = '#1b1b1b'; g.lineWidth = 7;
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();                 // ecuador
  for (const x of [0, w / 4, w / 2, (3 * w) / 4]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } // meridianos
  for (const s of [-1, 1]) { g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h / 2 + s * (h * 0.32) * Math.cos((x / w) * Math.PI * 4) * 0.5 + s * h * 0.12; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  return { map: t };
});

/** Detalle en gris (promedio ≈ 0.62) para multiplicar sobre el suelo: briznas y grumos finos. */
export const groundDetail = (kind = 'grass') => make('detail' + kind, () => {
  const n = 512, [c, g] = canvas(n), r = rng(kind === 'grass' ? 31 : 32);
  g.fillStyle = 'rgb(158,158,158)'; g.fillRect(0, 0, n, n);
  blotches(g, n, r, ['rgb(140,140,140)', 'rgb(175,175,175)'], 160, 8, 40, 0.35);
  if (kind === 'grass') {
    g.lineWidth = 1.4;
    for (let i = 0; i < 7000; i++) {
      const x = r() * n, y = r() * n, l = 3 + r() * 7;
      g.strokeStyle = r() < 0.5 ? 'rgba(95,95,95,0.55)' : 'rgba(215,215,215,0.5)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke();
    }
  } else {
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,120,120,0.4)' : 'rgba(200,200,200,0.4)'; g.fillRect(r() * n, r() * n, 2, 2); }
  }
  return { map: toTexture(c, { srgb: false }) };
});
