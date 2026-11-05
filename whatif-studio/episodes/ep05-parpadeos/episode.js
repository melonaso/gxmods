// Episodio 05: 1 peso por cada parpadeo. 15 parpadeos/min × 60 × 16 h despierto = 14,400 al día.
// Monedas de $1 (MXN): 21 mm de diámetro, ~1.9 mm de grosor, 3.95 g.
// El montón se dibuja como un cono truncado cuyo volumen corresponde a las monedas acumuladas.
import { ease, lerp } from '../../engine/timeline.js';

const COIN_R = 0.0105, COIN_T = 0.0019, COIN_G = 3.95;
const PACK = 0.6;                       // fracción del montón ocupada por metal (el resto son huecos)
const TAN = Math.tan((25 * Math.PI) / 180); // ángulo de reposo del montón
const NGROUND = 1200, NFALL = 160, BLINK = 1.4;
const BASE = 0.11; // altura del suelo visible: los parches de pasto del mundo llegan a ~0.1 m

let hero, eyes = [], ground, fall, pile, dummy;

const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtW = (kg) => (kg < 1000 ? `${nf(kg, kg < 10 ? 2 : 0)} kg` : `${nf(kg / 1000, kg < 1e5 ? 1 : 0)} TONELADAS`);
const jit = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

/** Radio y altura del montón para n monedas: V = n·(volumen moneda)/PACK, cono con h = r·tan(25°). */
function pileSize(n) {
  const V = (n * Math.PI * COIN_R * COIN_R * COIN_T) / PACK;
  const r = Math.cbrt(V / ((Math.PI / 3) * TAN));
  return { r, h: r * TAN };
}

export function setup({ THREE, world, actors }) {
  const { scene, rng } = world;
  dummy = new THREE.Object3D();
  const add = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; scene.add(o); return o; };
  const inFront = (x, z) => Math.abs(Math.atan2(x, z)) < 1.1;

  hero = actors.createPerson({ shirt: '#ef4444', pants: '#1e3a8a', hair: '#3b2416' });
  scene.add(hero);
  // Ojos: las cajas negras de 5 × 7 cm de la cabeza (para animar el parpadeo).
  hero.traverse((o) => { if (o.isMesh && o.geometry.parameters?.width === 0.05 && o.geometry.parameters?.height === 0.07) eyes.push(o); });

  // Patio: tu casa detrás y una cerca baja.
  add(actors.createHouse('#e0f2fe', '#1e3a8a'), -11, -8, 0.45);
  const fenceMat = actors.mat('#f5f5f4');
  for (let x = -20; x <= 20; x += 2.5) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), fenceMat); p.position.set(x, 0.55, -17); p.castShadow = true; scene.add(p);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 0.06), fenceMat); rail.position.set(0, 0.9, -17); scene.add(rail);
  add(actors.createRoad(900), 0, -24, Math.PI / 2);

  const hc = ['#f4e1c1', '#fce7f3', '#dcfce7', '#fef3c7'], rc = ['#b45309', '#7c2d12', '#991b1b', '#1e3a8a'];
  for (let i = 0; i < 36; i++) {
    const a = rng() * Math.PI * 2, r = 22 + rng() * 50;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inFront(x, z) || Math.abs(z + 24) < 7) continue;
    add(actors.createHouse(hc[i % 4], rc[i % 4]), x, z, rng() * 6);
  }
  for (let i = 0; i < 90; i++) {
    const a = rng() * Math.PI * 2, r = 9 + rng() * 150;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if ((inFront(x, z) && r < 50) || Math.abs(z + 24) < 6) continue;
    add(actors.createTree(rng, 5 + rng() * 5), x, z);
  }

  // Monedas: cilindros dorados de tamaño real.
  const coinGeo = new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_T, 14);
  const coinMat = new THREE.MeshStandardMaterial({ color: '#f5c542', metalness: 0.7, roughness: 0.3, emissive: '#5a4100', emissiveIntensity: 0.35 });
  ground = new THREE.InstancedMesh(coinGeo, coinMat, NGROUND);
  fall = new THREE.InstancedMesh(coinGeo, coinMat, NFALL);
  ground.count = 0; fall.count = 0;
  ground.frustumCulled = fall.frustumCulled = false;
  scene.add(ground, fall);

  // Montón: cono truncado con textura de monedas.
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#b8860b'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = rng() * 256, y = rng() * 256, r = 7 + rng() * 5;
    g.fillStyle = ['#ffd54a', '#f5c542', '#e6b422', '#fff1a8'][i % 4];
    g.beginPath(); g.ellipse(x, y, r, r * (0.55 + rng() * 0.45), rng() * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a6508'; g.lineWidth = 1.2; g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  pile = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 1, 1, 28, 1),
    new THREE.MeshStandardMaterial({ map: tex, metalness: 0.55, roughness: 0.4, flatShading: true }));
  pile.castShadow = pile.receiveShadow = true; pile.visible = false;
  scene.add(pile);
}

/** Monedas (continuas) en el instante local de la escena. */
function countAt(s, local) {
  const goal = s.reach === 'all' ? s.audio : Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  return lerp(s.c0, s.c1, ease.inOut(Math.min(1, local / goal)));
}

export function update({ world, scenes }, { t, scene: s, local }) {
  const n = countAt(s, local);
  const { r, h } = pileSize(n);
  const pileOn = r > 0.22;
  const topY = pileOn ? BASE + h * 0.97 : 0;

  // Protagonista: de pie en el suelo y, cuando hay montón, sobre la cima.
  hero.position.set(0, topY, 0);
  hero.userData.pose(t, s.pose || 'idle');
  const blinking = (t % BLINK) < 0.13;
  eyes.forEach((e) => (e.scale.y = blinking ? 0.12 : 1));

  // Monedas en el suelo alrededor de los pies (hasta que el montón las cubre).
  const ng = Math.min(NGROUND, Math.ceil(n));
  for (let i = 0; i < ng; i++) {
    const a = jit(i, 1) * Math.PI * 2, rr = 0.12 + 0.55 * Math.sqrt((i + 1) / NGROUND) * (0.4 + 0.6 * jit(i, 2));
    dummy.position.set(Math.cos(a) * rr + 0.05, BASE + COIN_T / 2 + (i % 5) * COIN_T * 0.6, Math.sin(a) * rr + 0.25);
    dummy.rotation.set((jit(i, 3) - 0.5) * 0.3, jit(i, 4) * 6, (jit(i, 5) - 0.5) * 0.3);
    dummy.scale.setScalar(1); dummy.updateMatrix();
    ground.setMatrixAt(i, dummy.matrix);
  }
  ground.count = ng; ground.instanceMatrix.needsUpdate = true;

  // Monedas cayendo: una por parpadeo al principio; después, lluvia continua (tiempo comprimido).
  let nf2 = 0;
  const spread = Math.max(0.6, r * 0.9);
  if (s.blinkCoins) {
    // Cada parpadeo suelta una moneda que cae desde la altura de la mano en 0.5 s.
    const k = Math.floor(t / BLINK), ft = (t % BLINK) / 0.5;
    if (ft < 1 && local > 0.5) {
      dummy.position.set(0.32, BASE + 1.15 * (1 - ft * ft), 0.3);
      dummy.rotation.set(t * 9, t * 5, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
      fall.setMatrixAt(0, dummy.matrix); nf2 = 1;
    }
    void k;
  } else if (s.rain) {
    nf2 = Math.round(NFALL * s.rain);
    const top = topY + 3.2;
    for (let i = 0; i < nf2; i++) {
      const P = 0.7 + jit(i, 7) * 0.5, ph = ((t + jit(i, 8) * P) % P) / P;
      const a = jit(i, 9) * Math.PI * 2, rr = spread * Math.sqrt(jit(i, 10));
      const surface = BASE + (pileOn ? Math.max(0, h * (1 - rr / r)) : 0);
      dummy.position.set(Math.cos(a) * rr, lerp(top, surface, ph * ph), Math.sin(a) * rr);
      dummy.rotation.set(t * 7 + i, t * 3 + i, 0);
      dummy.scale.setScalar(Math.max(1, r * 1.2)); // a gran escala se agrandan un poco para seguir viéndose
      dummy.updateMatrix(); fall.setMatrixAt(i, dummy.matrix);
    }
  }
  fall.count = nf2; fall.instanceMatrix.needsUpdate = true;

  pile.visible = pileOn;
  if (pileOn) {
    pile.scale.set(r, h, r);
    pile.position.set(0, BASE + h / 2, 0);
    pile.material.map.repeat.set(Math.max(1, r * 1.5), Math.max(1, h * 1.5));
  }

  // Cámara: encuadra al protagonista y el montón completo.
  const prev = scenes[Math.max(0, s.index - 1)].cam;
  const w = ease.inOut(Math.min(1, local / 1.8));
  const cam = {};
  for (const k of ['dist', 'yaw', 'lift']) cam[k] = lerp(prev[k], s.cam[k], w);
  const S = Math.max(1.7, r * 1.5, topY + 1.8);
  const D = cam.dist * S + 2;
  const yaw = cam.yaw + Math.sin(t * 0.25) * 0.06;
  world.camera.position.set(Math.sin(yaw) * D, 0.5 + S * cam.lift, Math.cos(yaw) * D);
  // look: altura opcional del punto de mira por escena (si no, sigue la cima del montón).
  const lookY = lerp(prev.look ?? Math.max(0.55, topY * 0.75 + 0.6), s.cam.look ?? Math.max(0.55, topY * 0.75 + 0.6), w);
  world.camera.lookAt(0, lookY, 0);
  world.fitToScale({ x: 0, y: 0, z: 0 }, Math.max(8, S * 2));

  // Capa de texto.
  const kg = (n * COIN_G) / 1000;
  const counter = { label: `AHORRO · ${fmtW(kg)}`, value: `$${nf(Math.round(n))}` };
  const days = n / 14400;
  const chip = n < 900 ? `MINUTO ${Math.round(n / 15)}` : days < 1 ? `HORA ${Math.round(n / 900)}`
    : days < 30 ? `DÍA ${Math.floor(days)}` : days < 365 ? `MES ${Math.floor(days / 30)}` : `AÑO ${Math.floor(days / 365)}`;
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
