// Mundo base: renderer, cámara, luces, cielo y suelo con estética low-poly.
import * as THREE from 'three';

export function createWorld(canvas, W, H, opts = {}) {
  // Profundidad logarítmica: precisión casi constante a cualquier distancia, para que dos
  // superficies cercanas (calle y suelo, líneas y calle) no se peleen por el mismo píxel a lo lejos.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: opts.logDepth ?? !globalThis.NO_LOGDEPTH });
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
  const SHADOW_MAP = 2048;
  sun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);

  // Suelo: plano grande con parches de pasto de distintos tonos.
  // Por defecto los parches van pintados en la textura del suelo (cero superficies superpuestas:
  // nada de parpadeo). "groundPatches": "mesh" conserva los parches como piezas sueltas (ep03 los mueve).
  const rng = mulberry32(7);
  const patches = [];
  for (let i = 0; i < 160; i++) {
    const r = 6 + rng() * 40;
    patches.push({ r, x: (rng() - 0.5) * 1600, z: (rng() - 0.5) * 1600, c: i % 2 ? '#89ba52' : '#76a843', i });
  }
  const groundMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  if (opts.groundPatches === 'mesh') {
    groundMat.color.set('#7fb04a');
    const patchMat = [new THREE.MeshStandardMaterial({ color: '#76a843', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#89ba52', roughness: 1 })];
    for (const q of patches) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(q.r, 7), patchMat[q.i % 2]);
      p.rotation.x = -Math.PI / 2;
      p.position.set(q.x, 0.02 + q.i * 0.0005, q.z);
      p.receiveShadow = true;
      scene.add(p);
    }
  } else {
    const TEX = 2048, AREA = 1600; // la textura cubre 1600 × 1600 m alrededor del origen
    const cv = document.createElement('canvas'); cv.width = cv.height = TEX;
    const g = cv.getContext('2d');
    g.fillStyle = '#7fb04a'; g.fillRect(0, 0, TEX, TEX);
    const k = TEX / AREA;
    for (const q of patches) {
      g.fillStyle = q.c; g.beginPath();
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * Math.PI * 2;
        // Plano rotado -90° en X: la coordenada z del mundo crece hacia abajo en la textura.
        const px = (q.x + Math.cos(a) * q.r + AREA / 2) * k, py = (q.z - Math.sin(a) * q.r + AREA / 2) * k;
        j ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); g.fill();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; // fuera del área: el borde, que es pasto liso
    const rep = 20000 / AREA;
    tex.repeat.set(rep, rep);
    tex.offset.set(0.5 - rep / 2, 0.5 - rep / 2);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    groundMat.map = tex;
  }
  // Suelo subdividido en celdas de ~156 m: con triángulos de kilómetros, la profundidad que
  // calcula el render por software pierde precisión y el suelo "atraviesa" la calle en algunos fotogramas.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000, 128, 128), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

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

  // Base del espacio de la luz (fija: el sol siempre viene de la misma dirección).
  const LDIR = new THREE.Vector3(1.2, 2.4, 0.9).normalize();
  const LX = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), LDIR).normalize();
  const LY = new THREE.Vector3().crossVectors(LDIR, LX);
  const tmp = new THREE.Vector3();
  let shadowSize = 0;

  /**
   * Ajusta sombra y niebla a la escala de lo que la cámara está mirando.
   * Para que las sombras no tiemblen: (1) el tamaño del mapa de sombras cambia por escalones
   * (×1.19) y solo se reduce si sobra mucho; (2) el centro se mueve en pasos exactos de un
   * píxel del mapa de sombras, así cada píxel de sombra cae siempre en el mismo lugar del suelo.
   */
  function fitToScale(focus, size) {
    const want = Math.max(size, 4);
    const step = (v) => Math.pow(2, Math.ceil(Math.log2(v) * 4) / 4);
    if (want > shadowSize || want < shadowSize / 1.7) shadowSize = step(want);
    const s = shadowSize, ext = s * 1.6, texel = (2 * ext) / SHADOW_MAP;
    tmp.set(focus.x, focus.y, focus.z);
    const fx = Math.round(tmp.dot(LX) / texel) * texel, fy = Math.round(tmp.dot(LY) / texel) * texel, fz = tmp.dot(LDIR);
    const center = new THREE.Vector3().addScaledVector(LX, fx).addScaledVector(LY, fy).addScaledVector(LDIR, fz);
    sun.target.position.copy(center);
    sun.position.copy(center).addScaledVector(LDIR, s * 3);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -ext;
    cam.right = cam.top = ext;
    cam.near = 0.1;
    cam.far = s * 8;
    cam.updateProjectionMatrix();
    sun.shadow.normalBias = texel * 1.5; // evita el "acné" de sombra sin despegar la sombra del objeto
    // La niebla sí sigue la escala continua (cambiarla por escalones se notaría).
    scene.fog.near = want * 6;
    scene.fog.far = want * 60 + 600;
  }

  return { THREE, renderer, scene, camera, sun, ground, fitToScale, rng: mulberry32(42) };
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
