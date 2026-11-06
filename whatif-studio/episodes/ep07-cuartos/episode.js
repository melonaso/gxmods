// Episodio 07: un cuarto nuevo (3 × 4 m) cada día. Los cuartos crecen en espiral alrededor de la casa.
// Sin choques: los cuartos ocupan una cuadrícula exacta (caras vecinas solo se tocan, nunca se enciman)
// y los árboles que quedan dentro de la futura mansión se retiran antes de que llegue un cuarto.
import { ease, lerp } from '../../engine/timeline.js';

const CX = 4, CZ = 3, CH = 2.7, ROOF = 0.3; // tamaño del cuarto (m)
const NMAX = 18250;
const FIELD = { x: 330, z: -110, w: 105, l: 68 }; // cancha de fútbol de referencia (105 × 68 m), a la derecha en cámara

let walls, roofs, hero, dummy, cells = [], trees = [], THREEref, fieldMark;

const nf = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

export function setup({ THREE, world, actors }) {
  THREEref = THREE;
  const { scene, rng } = world;
  dummy = new THREE.Object3D();

  // --- Orden de construcción: celdas ordenadas por distancia al centro (espiral) ---------------
  // La casa original ocupa 2 × 3 celdas en el centro (8 × 9 m).
  const isHouse = (i, j) => (i === -1 || i === 0) && j >= -1 && j <= 1;
  const RMAX = 285;
  for (let i = -Math.ceil(RMAX / CX); i <= Math.ceil(RMAX / CX); i++) {
    for (let j = -Math.ceil(RMAX / CZ); j <= Math.ceil(RMAX / CZ); j++) {
      if (isHouse(i, j)) continue;
      const x = i * CX + CX / 2 - CX * 0, z = j * CZ; // centros: x en múltiplos de 4 (+2), z en múltiplos de 3
      const cxm = i * CX + CX / 2 - CX, czm = j * CZ;   // desplazado para que la casa quede centrada en x = 0
      const r = Math.hypot(cxm, czm * 1.0);
      if (r > RMAX) continue;
      cells.push({ x: cxm, z: czm, r, a: Math.atan2(czm, cxm), i, j });
      void x; void z;
    }
  }
  // A igual distancia, primero los cuartos del lado de la cámara (para que el primero se vea).
  const cdx = Math.sin(0.45), cdz = Math.cos(0.45);
  const key = (p) => p.r - 3.5 * ((p.x * cdx + p.z * cdz) / Math.max(1, p.r));
  cells.sort((p, q) => key(p) - key(q) || p.a - q.a);
  cells = cells.slice(0, NMAX);

  // --- Materiales: paredes con ventanas en textura (con mipmaps: a lo lejos se suavizan, no hormiguean)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#f6ead2'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#e2d3b5'; g.fillRect(0, 112, 256, 16);
  g.fillStyle = '#9fd4f5';
  g.fillRect(36, 34, 64, 46); g.fillRect(156, 34, 64, 46);
  g.fillStyle = '#ffffff'; g.fillRect(66, 34, 4, 46); g.fillRect(186, 34, 4, 46);
  const wallTex = new THREE.CanvasTexture(cv);
  wallTex.colorSpace = THREE.SRGBColorSpace;
  wallTex.anisotropy = world.renderer.capabilities.getMaxAnisotropy();
  const wallGeo = new THREE.BoxGeometry(CX, CH, CZ); wallGeo.translate(0, CH / 2, 0);
  const roofGeo = new THREE.BoxGeometry(CX, ROOF, CZ); roofGeo.translate(0, ROOF / 2, 0);
  walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }), NMAX);
  roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), NMAX);
  // Techos por "alas" de 3 × 3 cuartos del mismo color (pastel): de lejos el patrón es grueso y suave;
  // un color distinto por cuarto da un ruido fino que hormiguea al moverse la cámara.
  const pal = ['#fca5a5', '#fdba74', '#fde68a', '#86efac', '#a5f3fc', '#93c5fd', '#c4b5fd', '#f9a8d4', '#e5e7eb'];
  const c = new THREE.Color();
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let k = 0; k < NMAX; k++) {
    const cl = cells[k];
    roofs.setColorAt(k, c.set(pal[Math.floor(hash(Math.floor(cl.i / 3), Math.floor(cl.j / 3)) * pal.length)]));
  }
  walls.count = roofs.count = 0;
  walls.castShadow = roofs.castShadow = true;
  walls.receiveShadow = roofs.receiveShadow = true;
  walls.frustumCulled = roofs.frustumCulled = false;
  scene.add(walls, roofs);

  // --- Casa original y protagonista -----------------------------------------------------------
  const house = actors.createHouse('#fde68a', '#b91c1c');
  house.position.set(0, 0, 0);
  scene.add(house);
  hero = actors.createPerson({ shirt: '#f97316', pants: '#1e3a8a', hair: '#2b1a10' });
  scene.add(hero);

  // --- Cancha de fútbol de referencia (fuera de la mansión final) ------------------------------
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 332;
  const fg = fc.getContext('2d');
  for (let s = 0; s < 10; s++) { fg.fillStyle = s % 2 ? '#4f9a3c' : '#58a743'; fg.fillRect((s * 512) / 10, 0, 512 / 10 + 1, 332); }
  fg.strokeStyle = '#ffffff'; fg.lineWidth = 4;
  fg.strokeRect(6, 6, 500, 320); fg.beginPath(); fg.moveTo(256, 6); fg.lineTo(256, 326); fg.stroke();
  fg.beginPath(); fg.arc(256, 166, 44, 0, Math.PI * 2); fg.stroke();
  fg.strokeRect(6, 96, 80, 140); fg.strokeRect(426, 96, 80, 140);
  const fieldTex = new THREE.CanvasTexture(fc);
  fieldTex.colorSpace = THREE.SRGBColorSpace;
  fieldTex.anisotropy = world.renderer.capabilities.getMaxAnisotropy();
  const field = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.w, FIELD.l, 8, 8), new THREE.MeshStandardMaterial({ map: fieldTex, roughness: 1 }));
  field.rotation.x = -Math.PI / 2; field.position.set(FIELD.x, 0.03, FIELD.z); field.receiveShadow = true;
  scene.add(field);
  fieldMark = new THREE.Vector3(FIELD.x, 2, FIELD.z);

  // --- Vecindario y árboles, sin choques entre sí -----------------------------------------------
  const P = actors.createPlacer();
  P.blockRect(-6, 6, -6, 6); // la casa original
  P.blockRect(FIELD.x - FIELD.w / 2 - 3, FIELD.x + FIELD.w / 2 + 3, FIELD.z - FIELD.l / 2 - 3, FIELD.z + FIELD.l / 2 + 3);
  // Árboles: algunos cerca de la casa (se retiran cuando la mansión los alcanza) y muchos alrededor.
  for (let k = 0; k < 420; k++) {
    const a = rng() * Math.PI * 2, rr = k < 60 ? 12 + rng() * 90 : 300 + rng() * 500;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = 6 + rng() * 6, rad = h * 0.34 + 0.4;
    if (!P.place(x, z, rad)) continue;
    const t = actors.createTree(rng, h);
    t.position.set(x, 0, z); scene.add(t);
    // Índice del primer cuarto que tocaría este árbol: se retira justo antes.
    let idx = Infinity;
    for (let q = 0; q < cells.length; q++) {
      const cq = cells[q];
      if (Math.abs(cq.x - x) < CX / 2 + rad && Math.abs(cq.z - z) < CZ / 2 + rad) { idx = q; break; }
      if (cq.r > Math.hypot(x, z) + 20) break;
    }
    trees.push({ t, idx });
  }
  const hc = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7'], rc = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b'];
  for (let k = 0; k < 160; k++) {
    const a = rng() * Math.PI * 2, rr = 320 + rng() * 450;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (!P.place(x, z, 6.8)) continue;
    const h = actors.createHouse(hc[k % 5], rc[k % 4]);
    h.position.set(x, 0, z); h.rotation.y = Math.atan2(-x, -z); scene.add(h);
  }
}

/** Cuartos (continuos) en el instante local de la escena. */
function countAt(s, local) {
  const goal = s.reach === 'all' ? s.audio : Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  return lerp(s.n0, s.n1, ease.inOut(Math.min(1, local / goal)));
}

export function update({ world, scenes, W, H }, { t, scene: s, local }) {
  const THREE = THREEref;
  const n = countAt(s, local);

  // Cuartos: cada uno "brota" del suelo cuando le toca (escala vertical de 0 a 1).
  const cnt = Math.min(NMAX, Math.ceil(n));
  for (let k = 0; k < cnt; k++) {
    const cl = cells[k];
    const a = Math.min(1, Math.max(0.001, n - k));
    const e = ease.out(a);
    dummy.position.set(cl.x, 0, cl.z); dummy.scale.set(1, e, 1); dummy.updateMatrix();
    walls.setMatrixAt(k, dummy.matrix);
    dummy.position.set(cl.x, CH * e, cl.z); dummy.scale.set(1, Math.max(0.001, e), 1); dummy.updateMatrix();
    roofs.setMatrixAt(k, dummy.matrix);
  }
  walls.count = roofs.count = cnt;
  walls.instanceMatrix.needsUpdate = roofs.instanceMatrix.needsUpdate = true;

  // Árboles dentro de la futura mansión: se encogen y desaparecen justo antes de que llegue un cuarto.
  for (const tr of trees) {
    const k = Math.min(1, Math.max(0, (tr.idx - n - 0.5) / Math.max(1, tr.idx * 0.03)));
    tr.t.visible = k > 0;
    tr.t.scale.setScalar(k > 0 ? k : 1);
  }

  // Protagonista: frente a la puerta; cuando un cuarto ocupa ese lugar, sube al techo.
  const doorCell = cells.findIndex((cl) => Math.abs(cl.x - 2) < CX / 2 && Math.abs(cl.z - 6) < CZ / 2);
  const onRoof = n > doorCell + 1;
  hero.position.set(2, onRoof ? CH + ROOF : 0, 6);
  hero.userData.pose(t, onRoof ? 'cheer' : (s.id === 'dia1' ? 'wave' : 'idle'));

  // Cámara: encuadra la mansión completa; mismo ángulo en todo el video (solo cambia altura y distancia).
  const prev = scenes[Math.max(0, s.index - 1)];
  const scaleFor = (sc) => Math.max(16, Math.sqrt((Math.max(sc.n1, 1) * CX * CZ) / Math.PI) * 2.3 + 8);
  // Corte directo si el encuadre cambia mucho de escala (un zoom rápido sobre la cuadrícula se ve a saltos).
  const bigJump = Math.max(scaleFor(s) / scaleFor(prev), scaleFor(prev) / scaleFor(s)) > 1.8;
  const w = (s.focusDoor || prev.focusDoor || bigJump) ? 1 : ease.inOut(Math.min(1, local / 3.5));
  const cam = {};
  for (const k of ['dist', 'yaw', 'lift']) cam[k] = lerp(prev.cam[k], s.cam[k], w);
  // Escala fija por escena: el encuadre del tamaño FINAL de la escena. La cámara queda quieta y la
  // mansión crece dentro de la imagen (alejarse sin parar hace "deslizar" el patrón fino de techos).
  const S = Math.exp(lerp(Math.log(scaleFor(prev)), Math.log(scaleFor(s)), w));
  const D = cam.dist * S;
  const yaw = cam.yaw + t * 0.006;
  const pitch = 0.12 + cam.lift * 0.85;
  // En la escena de las puertas la cámara baja hacia el protagonista.
  // Corte directo (no zoom): un acercamiento de 220 m a 22 m sobre la cuadrícula de techos se ve a saltos.
  const doorW = s.focusDoor ? 1 : 0;
  const T = new THREE.Vector3(lerp(0, 2, doorW), lerp(S * 0.02, CH + 1.5, doorW), lerp(0, 6, doorW));
  const Dd = lerp(D, 22, doorW);
  world.camera.position.set(T.x + Math.sin(yaw) * Dd * Math.cos(pitch), T.y + Dd * Math.sin(lerp(pitch, 0.35, doorW)), T.z + Math.cos(yaw) * Dd * Math.cos(pitch));
  world.camera.lookAt(T);
  world.camera.far = Math.max(9000, Dd * 10);
  world.camera.updateProjectionMatrix();
  world.fitToScale({ x: T.x, y: 0, z: T.z }, Math.max(18, lerp(S * 0.9, 25, doorW)));

  // Etiqueta de la cancha cuando la mansión ya se compara con ella.
  world.camera.updateMatrixWorld(); // la proyección a pantalla usa la cámara de ESTE fotograma
  const labels = [];
  if (s.id === 'anio50' || s.id === 'outro') {
    const p = fieldMark.clone().project(world.camera);
    if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) labels.push({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, text: '1 cancha de fútbol', alpha: Math.min(1, local / 0.6) });
  }

  // Capa de texto.
  const days = n;
  const chip = days < 365 ? `DÍA ${nf(Math.round(days))}` : `AÑO ${nf(Math.floor(days / 365))}`;
  const counter = { label: `CUARTOS · ${nf(Math.round(n) * 12)} m²`, value: nf(Math.round(n)) };
  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (local / s.dur - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title, labels };
  if (s.id === 'intro' && title.alpha > 0.5) { ov.subtitle = null; ov.counter = null; ov.chip = null; }
  return ov;
}
