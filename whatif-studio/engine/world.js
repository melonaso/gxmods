// Mundo base: renderer, cámara, luces, cielo y suelo con estética low-poly.
import * as THREE from 'three';

export function createWorld(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const sky = new THREE.Color('#9fd3f0');
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 120, 2600);

  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 8000);

  const hemi = new THREE.HemisphereLight('#dff3ff', '#5d7a3a', 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3dc', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  // Suelo: plano grande + parches de pasto de distintos tonos.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20000, 20000),
    new THREE.MeshStandardMaterial({ color: '#7fb04a', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const rng = mulberry32(7);
  const patchMat = [
    new THREE.MeshStandardMaterial({ color: '#76a843', roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: '#89ba52', roughness: 1 }),
  ];
  for (let i = 0; i < 160; i++) {
    const r = 6 + rng() * 40;
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 7), patchMat[i % 2]);
    p.rotation.x = -Math.PI / 2;
    p.position.set((rng() - 0.5) * 1600, 0.02 + i * 0.0005, (rng() - 0.5) * 1600);
    p.receiveShadow = true;
    scene.add(p);
  }

  // Nubes low-poly flotando.
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(14 + rng() * 14, 0), cloudMat);
      s.position.set(k * 18 - 27, rng() * 6, rng() * 10);
      c.add(s);
    }
    const a = rng() * Math.PI * 2, d = 500 + rng() * 1400;
    c.position.set(Math.cos(a) * d, 260 + rng() * 380, Math.sin(a) * d);
    scene.add(c);
  }

  /** Ajusta sombra y niebla a la escala de lo que la cámara está mirando. */
  function fitToScale(focus, size) {
    const s = Math.max(size, 4);
    sun.position.set(focus.x + s * 1.2, focus.y + s * 2.4, focus.z + s * 0.9);
    sun.target.position.copy(focus);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -s * 1.6;
    cam.right = cam.top = s * 1.6;
    cam.near = 0.1;
    cam.far = s * 8;
    cam.updateProjectionMatrix();
    scene.fog.near = s * 6;
    scene.fog.far = s * 60 + 600;
  }

  return { THREE, renderer, scene, camera, sun, fitToScale, rng: mulberry32(42) };
}

/** Generador pseudoaleatorio con semilla: mismo resultado en cada render. */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
