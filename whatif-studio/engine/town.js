// Construcción de barrios: calles con banqueta, cruces, lotes con casas, árboles, autos y
// mobiliario. Todo pasa por el colocador sin choques (createPlacer) para que nada se encime.
import * as THREE from 'three';
import * as MD from './models.js';
import * as TX from './textures.js';
import { createPlacer } from './actors.js';

/** Cielo degradado (cúpula que sigue a la cámara) y suelo con detalle fino de pasto o nieve. */
export function dressWorld(world, { top = '#5aa6e6', horizon = '#cfe8f7', ground = 'grass', groundTint = null } = {}) {
  const { scene, renderer } = world;
  TX.setAnisotropy(renderer.capabilities.getMaxAnisotropy());
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w * 0.99999; }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main(){ float k = smoothstep(-0.02, 0.45, vDir.y); gl_FragColor = vec4(mix(horizon, top, k), 1.0); }',
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMat);
  sky.renderOrder = -10; sky.frustumCulled = false; sky.scale.setScalar(100);
  scene.add(sky);
  scene.background = new THREE.Color(horizon);
  scene.fog.color.set(horizon);
  // Detalle del suelo: textura gris en coordenadas de mundo (4 m por repetición) multiplicada sobre
  // el color base. Sin piezas superpuestas: es el mismo plano del suelo.
  const det = TX.groundDetail(ground).map;
  const gm = world.ground.material;
  if (groundTint) gm.color.set(groundTint);
  gm.onBeforeCompile = (sh) => {
    sh.uniforms.detailMap = { value: det };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform sampler2D detailMap;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= texture2D(detailMap, vWPos.xz * 0.25).rgb * 1.6;');
  };
  gm.needsUpdate = true;
  return {
    sky, skyMat,
    /** Llamar en cada fotograma: la cúpula del cielo va centrada en la cámara. */
    follow(camera) { sky.position.copy(camera.position); sky.scale.setScalar(camera.far * 0.9); },
  };
}

/**
 * Red de calles en cuadrícula: calles norte-sur en cada x de `xs` y este-oeste en cada z de `zs`,
 * entre los límites dados. Asfalto con líneas pintadas (8 m de ancho), banquetas elevadas de 2 m y
 * cruces sin líneas. Reserva todo en el colocador.
 */
export function streetGrid(scene, P, { xs, zs, x0, x1, z0, z1, width = 8, walk = 2.2 }) {
  const asp = TX.asphalt(true), plain = TX.asphalt(false);
  const roadM = new THREE.MeshStandardMaterial({ map: asp.map, normalMap: asp.normalMap, roughness: 0.92 });
  const plainM = new THREE.MeshStandardMaterial({ map: plain.map, normalMap: plain.normalMap, roughness: 0.92 });
  const con = TX.concrete();
  const walkM = new THREE.MeshStandardMaterial({ map: con.map, normalMap: con.normalMap, roughness: 0.95 });
  const half = width / 2;
  const road = (cx, cz, len, alongX, mat = roadM) => {
    const geo = new THREE.PlaneGeometry(width, len, 1, Math.max(1, Math.round(len / 8)));
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len / 8);
    const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; if (alongX) m.rotation.z = Math.PI / 2;
    m.position.set(cx, 0.03, cz); m.receiveShadow = true; scene.add(m);
  };
  const curb = (cx, cz, sx, sz) => {
    const geo = MD.boxUV(sx, 0.17, sz, 1);
    const m = new THREE.Mesh(geo, walkM); m.position.set(cx, 0.065, cz); m.receiveShadow = true; m.castShadow = false; scene.add(m);
  };
  // Tramos entre cruces.
  const segs = (cuts, a0, a1) => { const pts = [a0, ...cuts.filter((c) => c > a0 && c < a1), a1]; const out = []; for (let i = 0; i < pts.length - 1; i++) out.push([pts[i], pts[i + 1]]); return out; };
  for (const x of xs) {
    for (const [a, b] of segs(zs, z0, z1)) {
      const s = zs.includes(a) ? a + half + walk : a, e = zs.includes(b) ? b - half - walk : b;
      if (e - s < 1) continue;
      road(x, (s + e) / 2, e - s, false);
      for (const sd of [-1, 1]) curb(x + sd * (half + walk / 2), (s + e) / 2, walk, e - s);
    }
    P.blockRect(x - half - walk, x + half + walk, z0, z1);
  }
  for (const z of zs) {
    for (const [a, b] of segs(xs, x0, x1)) {
      const s = xs.includes(a) ? a + half + walk : a, e = xs.includes(b) ? b - half - walk : b;
      if (e - s < 1) continue;
      road((s + e) / 2, z, e - s, true);
      for (const sd of [-1, 1]) curb((s + e) / 2, z + sd * (half + walk / 2), e - s, walk);
    }
    P.blockRect(x0, x1, z - half - walk, z + half + walk);
  }
  // Cruces: asfalto sin líneas que cubre calle y banquetas (cuadro de 8 + 2·2.2 m).
  for (const x of xs) for (const z of zs) road(x, z, width + 2 * walk, false, plainM);
  return { width, walk };
}

/**
 * Llena los lotes a lo largo de una calle este-oeste (z = zStreet): casas mirando a la calle,
 * con árbol, arbustos y a veces un coche estacionado junto a la banqueta.
 */
export function lineOfHouses(scene, P, rng, { zStreet, side = 1, x0, x1, lot = 16, setback = 9, carChance = 0.35, colors, winter = false, noCarsNear = [] }) {
  const walls = colors?.walls ?? ['#f1e3c6', '#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#e5e7eb'];
  const roofs = colors?.roofs ?? ['#9a3412', '#7c2d12', '#1e3a8a', '#374151', '#7f1d1d'];
  const out = { houses: [], cars: [], trees: [] };
  for (let x = x0 + lot / 2; x < x1 - lot / 2; x += lot) {
    const two = rng() < 0.35, w = 8.5 + rng() * 1.5, d = 7.5 + rng() * 1;
    const z = zStreet + side * (4 + 2.2 + setback + d / 2);
    const rad = Math.hypot(w / 2 + 0.5, d / 2 + 0.5);
    if (!P.place(x, z, rad)) continue;
    const h = MD.createHouseHQ({ w, d, floors: two ? 2 : 1, wall: rng() < 0.4 ? 'brick' : 'siding', wallColor: rng() < 0.4 ? ['#b5563b', '#a0522d', '#c2410c'][(rng() * 3) | 0] : walls[(rng() * walls.length) | 0], roofColor: roofs[(rng() * roofs.length) | 0], door: ['#7c2d12', '#1e3a8a', '#065f46', '#7f1d1d'][(rng() * 4) | 0], seed: (rng() * 1e6) | 0, snowRoof: winter });
    h.position.set(x, 0, z); h.rotation.y = side > 0 ? Math.PI : 0; scene.add(h); out.houses.push(h);
    // Árbol del jardín y arbustos al frente.
    const tx = x + (rng() < 0.5 ? -1 : 1) * (w / 2 + 2.2), tz = zStreet + side * (4 + 2.2 + 4);
    const th = 6 + rng() * 4;
    if (P.place(tx, tz, th * 0.36)) { const t = MD.createTreeHQ({ h: th, seed: (rng() * 1e6) | 0, pine: winter && rng() < 0.85 }); t.position.set(tx, 0, tz); scene.add(t); out.trees.push(t); }
    for (const bx of [-w * 0.32, w * 0.32]) {
      const bz = z - side * (d / 2 + 1.0);
      if (P.place(x + bx, bz, 0.9)) { const b = MD.createBush({ size: 1, seed: (rng() * 1e6) | 0, color: winter ? '#3a6b45' : '#3f8f3a' }); b.position.set(x + bx, 0, bz); scene.add(b); }
    }
    // Coche estacionado junto a la banqueta (sobre la calle, a lo largo).
    if (rng() < carChance) {
      const cz = zStreet + side * 2.6, cx = x + (rng() - 0.5) * 4;
      if (noCarsNear.some((nx) => Math.abs(nx - cx) < 7)) continue;
      const c = MD.createCar({ color: ['#dc2626', '#2563eb', '#f8fafc', '#111827', '#059669', '#f59e0b', '#64748b'][(rng() * 7) | 0], snow: winter });
      c.position.set(cx, 0.03, cz); c.rotation.y = side > 0 ? 0 : Math.PI; scene.add(c); out.cars.push(c);
    }
  }
  return out;
}

/** Farolas a lo largo de una calle este-oeste, sobre la banqueta. */
export function lampsAlong(scene, { zStreet, x0, x1, every = 28, side = 1 }) {
  const out = [];
  for (let x = x0; x <= x1; x += every) {
    const l = MD.createLamp(); l.position.set(x, 0.15, zStreet + side * (4 + 1.4)); l.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(l); out.push(l);
  }
  return out;
}
