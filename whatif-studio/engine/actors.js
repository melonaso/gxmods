// Personajes tipo bloque y utilería (casas, árboles, edificios). Unidad = 1 metro.
import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...opts }));
  }
  return matCache.get(key);
}

function box(w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Extremidad con pivote en la parte superior (para rotar desde hombro/cadera). */
function limb(w, h, d, color, x, y) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  const m = box(w, h, d, color);
  m.position.y = -h / 2;
  pivot.add(m);
  return pivot;
}

/**
 * Persona de 1.7 m. Devuelve Group con userData.pose(t, modo).
 * modos: 'idle' | 'walk' | 'wave' | 'lookUp' | 'cheer'
 */
export function createPerson({ shirt = '#3b82f6', pants = '#334155', skin = '#e8b48a', hair = '#3b2416', face = true } = {}) {
  const g = new THREE.Group();
  const legL = limb(0.22, 0.8, 0.24, pants, -0.13, 0.8);
  const legR = limb(0.22, 0.8, 0.24, pants, 0.13, 0.8);
  const torso = box(0.56, 0.6, 0.3, shirt); torso.position.y = 1.1;
  const armL = limb(0.16, 0.6, 0.18, shirt, -0.37, 1.38);
  const armR = limb(0.16, 0.6, 0.18, shirt, 0.37, 1.38);
  const handL = box(0.15, 0.13, 0.17, skin); handL.position.y = -0.66; armL.add(handL);
  const handR = box(0.15, 0.13, 0.17, skin); handR.position.y = -0.66; armR.add(handR);
  const head = new THREE.Group(); head.position.y = 1.42;
  const skull = box(0.36, 0.36, 0.34, skin); skull.position.y = 0.18; head.add(skull);
  const hairTop = box(0.38, 0.1, 0.36, hair); hairTop.position.y = 0.38; head.add(hairTop);
  const hairBack = box(0.38, 0.22, 0.08, hair); hairBack.position.set(0, 0.26, -0.15); head.add(hairBack);
  if (face) {
    const eyeL = box(0.05, 0.07, 0.02, '#1a1a1a'); eyeL.position.set(-0.08, 0.22, 0.175); head.add(eyeL);
    const eyeR = box(0.05, 0.07, 0.02, '#1a1a1a'); eyeR.position.set(0.08, 0.22, 0.175); head.add(eyeR);
    const mouth = box(0.12, 0.025, 0.02, '#7a2e2e'); mouth.position.set(0, 0.1, 0.175); head.add(mouth);
  }
  g.add(legL, legR, torso, armL, armR, head);

  g.userData.pose = (t, mode = 'idle', phase = 0) => {
    const s = t * 2 + phase;
    legL.rotation.x = legR.rotation.x = 0;
    armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    torso.position.y = 1.1;
    if (mode === 'walk') {
      const a = Math.sin(s * 3) * 0.55;
      legL.rotation.x = a; legR.rotation.x = -a;
      armL.rotation.x = -a * 0.8; armR.rotation.x = a * 0.8;
    } else if (mode === 'wave') {
      armR.rotation.z = 2.6 + Math.sin(s * 5) * 0.35;
    } else if (mode === 'lookUp') {
      head.rotation.x = -0.55;
      armL.rotation.z = -0.15; armR.rotation.z = 0.15;
    } else if (mode === 'cheer') {
      armL.rotation.z = -2.7 + Math.sin(s * 6) * 0.2;
      armR.rotation.z = 2.7 - Math.sin(s * 6) * 0.2;
      head.rotation.x = -0.25;
    } else {
      armL.rotation.z = -0.06 - Math.sin(s) * 0.03;
      armR.rotation.z = 0.06 + Math.sin(s) * 0.03;
      head.rotation.y = Math.sin(s * 0.5) * 0.12;
    }
  };
  g.userData.pose(0);
  return g;
}

const SHIRTS = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#a855f7', '#f97316', '#0ea5e9'];
const PANTS = ['#1e293b', '#334155', '#3f3f46', '#1e3a8a', '#44403c'];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const HAIRS = ['#2b1a10', '#0f0f0f', '#5a3a1a', '#c9a15b', '#7a4a20'];

/** Multitud aleatoria (con semilla) alrededor de un centro. */
export function createCrowd(rng, n, cx, cz, rMin, rMax) {
  const people = [];
  for (let i = 0; i < n; i++) {
    const p = createPerson({
      shirt: SHIRTS[(rng() * SHIRTS.length) | 0],
      pants: PANTS[(rng() * PANTS.length) | 0],
      skin: SKINS[(rng() * SKINS.length) | 0],
      hair: HAIRS[(rng() * HAIRS.length) | 0],
    });
    const a = rng() * Math.PI * 2, r = rMin + rng() * (rMax - rMin);
    p.position.set(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r);
    p.rotation.y = Math.atan2(cx - p.position.x, cz - p.position.z);
    p.scale.setScalar(0.9 + rng() * 0.2);
    p.userData.phase = rng() * 10;
    people.push(p);
  }
  return people;
}

export function createTree(rng, h = 8) {
  const g = new THREE.Group();
  const trunk = box(h * 0.08, h * 0.4, h * 0.08, '#7a4b25');
  trunk.position.y = h * 0.2;
  g.add(trunk);
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.32, 0), mat(rng() > 0.5 ? '#3f8f3a' : '#4fa443'));
  leaf.position.y = h * 0.62;
  leaf.castShadow = true;
  g.add(leaf);
  return g;
}

export function createHouse(color = '#f4e1c1', roof = '#b45309') {
  const g = new THREE.Group();
  const body = box(8, 5, 7, color); body.position.y = 2.5; g.add(body);
  const r = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3, 4), mat(roof));
  r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.85); r.position.y = 6.5; r.castShadow = true; g.add(r);
  const door = box(1.3, 2.2, 0.1, '#6b3d1e'); door.position.set(0, 1.1, 3.52); g.add(door);
  for (const x of [-2.6, 2.6]) {
    const w = box(1.4, 1.2, 0.1, '#bfe3ff'); w.position.set(x, 3, 3.52); g.add(w);
  }
  return g;
}

/** Edificio con ventanas; altura en metros. */
export function createBuilding(h, w = 14, color = '#cbd5e1') {
  const g = new THREE.Group();
  const body = box(w, h, w, color); body.position.y = h / 2; g.add(body);
  const floors = Math.max(2, Math.floor(h / 4));
  const winMat = mat('#7dd3fc', { emissive: '#1e3a5f', emissiveIntensity: 0.3 });
  const winGeo = new THREE.BoxGeometry(w * 0.86, 1.4, 0.1);
  for (let f = 0; f < floors; f++) {
    const y = (f + 0.6) * (h / floors);
    for (let side = 0; side < 4; side++) {
      const m = new THREE.Mesh(winGeo, winMat);
      const a = side * Math.PI / 2;
      m.position.set(Math.sin(a) * (w / 2 + 0.06), y, Math.cos(a) * (w / 2 + 0.06));
      m.rotation.y = a;
      g.add(m);
    }
  }
  return g;
}

/** Calle simple con línea central. */
export function createRoad(length, width = 8) {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.PlaneGeometry(width, length), mat('#4b5563'));
  r.rotation.x = -Math.PI / 2; r.position.y = 0.05; r.receiveShadow = true; g.add(r);
  for (let z = -length / 2; z < length / 2; z += 6) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), mat('#f8fafc'));
    l.rotation.x = -Math.PI / 2; l.position.set(0, 0.07, z); g.add(l);
  }
  return g;
}
