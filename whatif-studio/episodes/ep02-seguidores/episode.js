// Episodio 02: cada hora te sigue 1 persona más. Columna de seguidores en filas de 5 detrás del protagonista.
import { ease, lerp } from '../../engine/timeline.js';

const COLS = 5;        // personas por fila
const ROW = 1.0;       // metros entre filas
const SPEED = 1.3;     // velocidad al caminar (m/s)
const NDET = 60;       // seguidores con modelo detallado (los más cercanos)
const NINST = 15000;   // seguidores simplificados (instanciados); el resto es una franja con textura

const SHIRTS = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#a855f7', '#0ea5e9', '#84cc16'];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];

let hero, det = [], bodies, heads, strip, dummy, world0;

const nf = (n) => Math.floor(n).toLocaleString('es-MX');
// Desplazamiento pseudoaleatorio fijo por persona (para que la formación no se vea perfecta).
const jit = (i, k) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;

export function setup({ THREE, world, actors }) {
  world0 = world;
  const { scene, rng } = world;
  dummy = new THREE.Object3D();

  hero = actors.createPerson({ shirt: '#f97316', pants: '#1e293b', hair: '#1a1a1a' });
  scene.add(hero);

  // Carretera: tramo cercano con líneas + tramo largo liso hacia el horizonte.
  const near = actors.createRoad(900, 12); near.position.set(0, 0.12, -250); scene.add(near); // sobre los parches de pasto
  const far = new THREE.Mesh(new THREE.PlaneGeometry(12, 9000), actors.mat('#4b5563'));
  far.rotation.x = -Math.PI / 2; far.position.set(0, 0.16, -5000); far.receiveShadow = true; scene.add(far);

  // Casas y árboles a los lados del tramo cercano.
  const hc = ['#f4e1c1', '#e0f2fe', '#fce7f3', '#dcfce7', '#fef3c7'], rc = ['#b45309', '#7c2d12', '#1e3a8a', '#991b1b'];
  let k = 0;
  for (let z = -600; z < 420; z += 20 + rng() * 14) {
    for (const side of [-1, 1]) {
      const x = side * (16 + rng() * 8);
      if (rng() < 0.5) {
        const h = actors.createHouse(hc[k % 5], rc[k % 4]); k++;
        h.position.set(x, 0, z); h.rotation.y = -side * Math.PI / 2; scene.add(h);
      } else {
        const t = actors.createTree(rng, 6 + rng() * 5); t.position.set(x, 0, z); scene.add(t);
      }
    }
  }
  // Edificios lejanos a ambos lados.
  const bc = ['#cbd5e1', '#e2e8f0', '#94a3b8', '#d6d3d1', '#fecaca', '#bfdbfe'];
  for (let i = 0; i < 45; i++) {
    const side = i % 2 ? 1 : -1;
    const b = actors.createBuilding(20 + rng() * 60, 12 + rng() * 10, bc[i % 6]);
    b.position.set(side * (90 + rng() * 600), 0, -3000 + rng() * 3400); b.rotation.y = rng();
    scene.add(b);
  }

  // Seguidores detallados.
  for (let i = 0; i < NDET; i++) {
    const p = actors.createPerson({
      shirt: SHIRTS[(rng() * SHIRTS.length) | 0], skin: SKINS[(rng() * SKINS.length) | 0],
      pants: ['#1e293b', '#334155', '#1e3a8a', '#44403c'][i % 4], hair: ['#2b1a10', '#0f0f0f', '#5a3a1a'][i % 3],
    });
    p.visible = false; scene.add(p); det.push(p);
  }

  // Seguidores simplificados: cuerpo + cabeza instanciados (un solo dibujo para miles).
  const bodyGeo = new THREE.BoxGeometry(0.5, 1.3, 0.3); bodyGeo.translate(0, 0.65, 0);
  const headGeo = new THREE.BoxGeometry(0.34, 0.34, 0.32); headGeo.translate(0, 1.5, 0);
  bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), NINST);
  heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), NINST);
  const c = new THREE.Color();
  for (let i = 0; i < NINST; i++) {
    bodies.setColorAt(i, c.set(SHIRTS[(rng() * SHIRTS.length) | 0]));
    heads.setColorAt(i, c.set(SKINS[(rng() * SKINS.length) | 0]));
  }
  bodies.count = heads.count = 0;
  bodies.frustumCulled = heads.frustumCulled = false;
  scene.add(bodies, heads);

  // Franja lejana: textura de "cabezas" de colores que se repite a lo largo de la columna.
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#3f3f46'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    g.fillStyle = SHIRTS[(rng() * SHIRTS.length) | 0];
    g.fillRect(x * 12.8 + 2, y * 12.8 + 2, 9, 9);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.NearestFilter;
  strip = new THREE.Mesh(new THREE.PlaneGeometry(COLS * ROW, 1), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  strip.rotation.x = -Math.PI / 2; strip.position.y = 1.4; strip.visible = false;
  scene.add(strip);
}

/** Posición de la persona i en la formación, relativa al protagonista. */
function slot(i, heroZ) {
  const r = Math.floor(i / COLS), c = i % COLS;
  return [(c - (COLS - 1) / 2) * ROW + jit(i, 1) * 0.15, heroZ - 2.2 - r * ROW + jit(i, 2) * 0.15];
}

export function update({ world, scenes }, { t, scene: s, local }) {
  // El número llega a su meta al terminar el primer subtítulo (que es donde se anuncia).
  const goal = Math.max(1.5, s.cueTimes[0]?.[1] ?? s.audio);
  const count = lerp(s.c0, s.c1, ease.inOut(Math.min(1, local / goal)));
  const heroZ = SPEED * t;
  hero.position.set(0, 0, heroZ);
  hero.userData.pose(t, 'walk');

  // Detallados: aparecen con un pequeño crecimiento cuando les toca.
  det.forEach((p, i) => {
    const a = Math.min(1, Math.max(0, count - i));
    p.visible = a > 0;
    if (!p.visible) return;
    const [x, z] = slot(i, heroZ);
    p.position.set(x, 0, z);
    p.scale.setScalar(0.92 * ease.out(a));
    p.userData.pose(t, 'walk', i * 0.7);
  });

  // Instanciados.
  const n = Math.max(0, Math.min(NINST, Math.ceil(count)) - NDET);
  for (let j = 0; j < n; j++) {
    const i = NDET + j;
    const [x, z] = slot(i, heroZ);
    dummy.position.set(x, Math.abs(Math.sin(t * 7 + i)) * 0.06, z);
    dummy.scale.setScalar(ease.out(Math.min(1, Math.max(0, count - i))));
    dummy.updateMatrix();
    bodies.setMatrixAt(j, dummy.matrix);
    heads.setMatrixAt(j, dummy.matrix);
  }
  bodies.count = heads.count = n;
  bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;

  // Franja para todo lo que no cabe en los instanciados.
  const extraRows = Math.max(0, (count - NINST) / COLS);
  strip.visible = extraRows > 1;
  if (strip.visible) {
    const L = extraRows * ROW;
    const z0 = heroZ - 2.2 - (NINST / COLS) * ROW;
    strip.scale.y = L;
    strip.position.z = z0 - L / 2;
    strip.material.map.repeat.set(1, L / (COLS * ROW));
  }

  // Cámara: parámetros por escena con transición suave desde la anterior.
  const prev = scenes[Math.max(0, s.index - 1)].cam;
  const w = ease.inOut(Math.min(1, local / 2.0));
  const cam = {};
  for (const key of ['h', 'front', 'side', 'look']) cam[key] = lerp(prev[key], s.cam[key], w);
  const sway = Math.sin(t * 0.3) * 0.04 * cam.side;
  world.camera.position.set(cam.side + sway, cam.h, heroZ + cam.front);
  world.camera.lookAt(0, 1.0 + cam.h * 0.04, heroZ + cam.look);
  world.camera.far = Math.max(8000, cam.h * 25);
  world.camera.updateProjectionMatrix();
  world.fitToScale({ x: 0, y: 0, z: heroZ + cam.look * 0.4 }, Math.max(12, cam.h * 1.2));
  world.scene.fog.far = Math.min(world.scene.fog.far, 9500);
  world.scene.fog.near = Math.min(world.scene.fog.near, world.scene.fog.far * 0.3);

  // Capa de texto: contador y tiempo transcurrido (1 seguidor = 1 hora).
  const h = count;
  const chip = h < 24 ? `HORA ${Math.round(h)}` : h < 720 ? `DÍA ${Math.floor(h / 24)}`
    : h < 8760 ? `MES ${Math.floor(h / 720)}` : `AÑO ${Math.floor(h / 8760)}`;
  const counter = { label: 'SEGUIDORES', value: nf(Math.round(count)) };

  let title = null;
  if (s.titleCard) {
    const a = s.id === 'intro'
      ? Math.min(1, Math.max(0, (local - 0.3) / 0.5)) * (1 - Math.max(0, (local - (s.dur - 0.5)) / 0.5))
      : Math.min(1, Math.max(0, (local / s.dur - 0.55) / 0.08));
    title = { lines: s.titleCard, alpha: a, y: s.titleY ?? 0.3 };
  }
  const ov = { counter, chip, title };
  if (s.id === 'intro' && title.alpha > 0.5) ov.subtitle = null;
  return ov;
}
