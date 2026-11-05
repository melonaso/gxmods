// Episodio 04: cada día la gravedad baja 1%. g(n) = 9.8 · 0.99^n (decaimiento exponencial).
// Altura de un salto con la misma fuerza de piernas: h = v0²·R / (2gR − v0²)
// (para g normal se reduce a h ≈ v0² / 2g; si 2gR ≤ v0², el salto supera la velocidad de escape).
import { ease, lerp } from '../../engine/timeline.js';

const G0 = 9.8;             // m/s²
const R = 6.371e6;          // radio de la Tierra (m)
const H0 = 0.5;             // salto normal (m)
const V0 = Math.sqrt(2 * G0 * H0); // velocidad de despegue de tus piernas (~3.13 m/s)
const HVIS = 600;           // tope visual de altura de salto (la cámara no puede encuadrar kilómetros)

let hero, sky0, skyDark, stars, airPts, trace = null;

const gAt = (day) => G0 * Math.pow(0.99, day);
const jumpHeight = (g) => { const d = 2 * g * R - V0 * V0; return d <= 0 ? Infinity : (V0 * V0 * R) / d; };
const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtLen = (h) => (!isFinite(h) ? '∞' : h < 10 ? `${nf(h, 2)} m` : h < 1000 ? `${nf(h)} m` : `${nf(h / 1000, h < 1e5 ? 1 : 0)} km`);
const fmtG = (g) => g.toFixed(g >= 1 ? 2 : Math.min(9, Math.max(3, 1 - Math.floor(Math.log10(g)))));

export function setup({ THREE, world, actors }) {
  const { scene, rng } = world;
  sky0 = scene.background.clone();
  skyDark = new THREE.Color('#0b1026');
  const add = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; scene.add(o); return o; };
  const inFront = (x, z) => Math.abs(Math.atan2(x, z)) < 1.0;

  hero = actors.createPerson({ shirt: '#8b5cf6', pants: '#1e293b', hair: '#2b1a10' });
  scene.add(hero);

  // Casa vecina (referencia de 5–8 m) y edificio de 15 pisos (~48 m) detrás.
  add(actors.createHouse('#fde68a', '#b91c1c'), -10, -4, 0.5);
  add(actors.createBuilding(48, 16, '#bfdbfe'), 18, -34, 0.2);
  add(actors.createRoad(900), 0, -16, Math.PI / 2);

  const hc = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7'], rc = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b'];
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, r = 18 + rng() * 50;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z) || Math.abs(z + 16) < 7 || (Math.abs(x - 18) < 14 && Math.abs(z + 34) < 14)) continue;
    add(actors.createHouse(hc[i % 5], rc[i % 4]), x, z, rng() * 6);
  }
  for (let i = 0; i < 110; i++) {
    const a = rng() * Math.PI * 2, r = 12 + rng() * 170;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if ((inFront(x, z) && r < 70) || Math.abs(z + 16) < 6) continue;
    add(actors.createTree(rng, 6 + rng() * 6), x, z);
  }
  const bc = ['#cbd5e1', '#e2e8f0', '#94a3b8', '#d6d3d1', '#fecaca'];
  for (let i = 0; i < 50; i++) {
    const a = rng() * Math.PI * 2, r = 120 + rng() * 500;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z)) continue;
    add(actors.createBuilding(18 + rng() * 70, 12 + rng() * 10, bc[i % 5]), x, z, rng());
  }

  // Aire que se escapa: partículas tenues que suben.
  const ap = [];
  for (let i = 0; i < 700; i++) ap.push((rng() - 0.5) * 400, rng() * 300, (rng() - 0.5) * 400);
  const ag = new THREE.BufferGeometry();
  ag.setAttribute('position', new THREE.Float32BufferAttribute(ap, 3));
  airPts = new THREE.Points(ag, new THREE.PointsMaterial({ color: '#e0f2fe', size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
  airPts.userData.base = ap.slice();
  scene.add(airPts);

  // Estrellas: visibles cuando el cielo pierde su aire.
  const sp = [];
  for (let i = 0; i < 1500; i++) {
    const u = rng() * 2 - 1, th = rng() * Math.PI * 2, r = 5000;
    sp.push(Math.sqrt(1 - u * u) * Math.cos(th) * r, Math.abs(u) * r, Math.sqrt(1 - u * u) * Math.sin(th) * r);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);
}

/** Día (continuo) en el instante local de la escena. */
function dayAt(s, local) {
  const goal = s.reach === 'all' ? s.audio : Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  return lerp(s.d0, s.d1, ease.inOut(Math.min(1, local / goal)));
}

/** Duración de un salto en pantalla: crece con la altura (comprimida para que se pueda ver). */
const periodFor = (h) => 1.15 + 0.9 * Math.log10(1 + h / H0);

/** Fase acumulada de los saltos hasta t (integración numérica determinista). */
function phaseAt(scenes, t) {
  if (!trace || t < trace.t) trace = { t: 0, ph: 0 };
  let { t: tt, ph } = trace, si = 0;
  while (tt < t) {
    const dt = Math.min(1 / 60, t - tt);
    while (si < scenes.length - 1 && tt >= scenes[si].start + scenes[si].dur) si++;
    const s = scenes[si];
    ph += dt / periodFor(Math.min(s.hvis ?? HVIS, jumpHeight(gAt(dayAt(s, tt - s.start)))));
    tt += dt;
  }
  trace = { t: tt, ph };
  return ph;
}

/** Altura del salto en el instante t: parábola en el aire (78% del ciclo) y apoyo en el suelo. */
function jumpY(scenes, t, s, local) {
  const hv = Math.min(s.hvis ?? HVIS, jumpHeight(gAt(dayAt(s, local))));
  const f = phaseAt(scenes, t) % 1, AIR = 0.78;
  if (f < AIR) { const u = f / AIR; return { y: hv * 4 * u * (1 - u), air: true, hv }; }
  return { y: 0, air: false, hv, crouch: Math.sin(((f - AIR) / (1 - AIR)) * Math.PI) };
}

export function update({ world, scenes }, { t, scene: s, local }) {
  const day = dayAt(s, local);
  const g = gAt(day);
  const hReal = jumpHeight(g);

  // Lanzamiento final: desde el subtítulo "Saltas... y nunca vuelves a bajar." el salto no regresa.
  const esc = scenes.find((x) => x.id === 'escape');
  const tL = esc.start + (esc.cueTimes[2]?.[0] ?? esc.audio * 0.6);
  let y, air, hv, crouch = 0;
  if (t >= tL) {
    const j = jumpY(scenes, tL, esc, tL - esc.start);
    const d = t - tL;
    y = j.y + 6 * d + 3.5 * d * d; air = true; hv = j.hv;
  } else ({ y, air, hv, crouch = 0 } = jumpY(scenes, t, s, local));

  hero.position.set(0, y, 0);
  hero.userData.pose(t, air ? 'cheer' : 'idle');
  hero.scale.set(1, 1 - 0.12 * crouch, 1); // se agacha antes de despegar

  // Cielo: se oscurece cuando la atmósfera se escapa (desde el día ~200) y al subir.
  const dark = Math.min(0.78, Math.max(0, (day - 200) / 700)) + Math.min(0.22, y / 9000);
  world.scene.background.copy(sky0).lerp(skyDark, dark);
  world.scene.fog.color.copy(world.scene.background);
  stars.material.opacity = Math.max(0, Math.min(1, (dark - 0.35) / 0.45));
  stars.position.y = y * 0.5;

  // Partículas de aire subiendo (más visibles cuanto más débil es la gravedad).
  airPts.material.opacity = Math.min(0.55, Math.max(0, (day - 200) / 400));
  if (airPts.material.opacity > 0) {
    const pos = airPts.geometry.attributes.position, b = airPts.userData.base;
    for (let i = 0; i < pos.count; i++) pos.setY(i, (b[i * 3 + 1] + t * 9) % 300);
    pos.needsUpdate = true;
  }

  // Cámara: encuadra el arco completo del salto (suelo y punto más alto); en el lanzamiento sigue al corredor.
  const prev = scenes[Math.max(0, s.index - 1)].cam;
  const w = ease.inOut(Math.min(1, local / 1.8));
  const cam = {};
  for (const k of ['dist', 'yaw', 'lift', 'follow']) cam[k] = lerp(prev[k] ?? 0, s.cam[k] ?? 0, w);
  const frameH = Math.max(1.7, hv);
  // fixed: distancia en metros (para saltos enormes); si no, proporcional a la altura del salto.
  const fixedW = lerp(prev.fixed ? 1 : 0, s.cam.fixed ? 1 : 0, w);
  const D = lerp(cam.dist * frameH + 3.5, s.cam.fixed ?? prev.fixed ?? 0, fixedW);
  const yaw = cam.yaw + Math.sin(t * 0.25) * 0.06;
  if (t >= tL) {
    // Lanzamiento y cierre: la cámara acompaña al protagonista; en el cierre se coloca encima
    // y mira un poco hacia abajo, para verlo a él arriba y la ciudad muy por debajo.
    const follow = Math.min(1, (t - tL) / 0.6);
    const outroW = s.id === 'outro' ? ease.inOut(Math.min(1, local / 2.5)) : 0;
    const dist = lerp(D, 16, outroW);
    const camY = lerp(1.2 + frameH * 0.3, y + lerp(1, 4, outroW), follow);
    world.camera.position.set(Math.sin(yaw) * dist, camY, Math.cos(yaw) * dist);
    world.camera.lookAt(0, lerp(Math.max(1, frameH * cam.lift), y + lerp(0.9, -1.5, outroW), follow), 0);
  } else {
    // follow: 0 = encuadre fijo del arco; 1 = la cámara acompaña al protagonista en vertical.
    const baseCamY = 1.2 + frameH * 0.3, baseLook = Math.max(1, frameH * cam.lift);
    world.camera.position.set(Math.sin(yaw) * D, lerp(baseCamY, y + 2, cam.follow), Math.cos(yaw) * D);
    world.camera.lookAt(0, lerp(baseLook, y + 0.9, cam.follow), 0);
  }
  world.camera.far = 9000;
  world.camera.updateProjectionMatrix();
  world.fitToScale({ x: 0, y: 0, z: 0 }, Math.max(12, frameH * 1.2, y * 0.3));
  world.scene.fog.far = Math.min(world.scene.fog.far, 9000);

  // Capa de texto.
  const counter = {
    label: `GRAVEDAD · SALTO ${fmtLen(hReal)}`,
    value: `${fmtG(g)} m/s²`,
    color: day >= 179 ? '#a5b4fc' : '#ffd34d',
  };
  const chip = `DÍA ${nf(Math.round(day))}`;
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (local / s.dur - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
