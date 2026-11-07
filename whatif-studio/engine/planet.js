// La Tierra a escala real (radio 6,371 km) para tomas desde muy alto: continentes (los mismos
// contornos del motor 2D), nubes y el resplandor azul de la atmósfera en el borde.
import * as THREE from 'three';
import { LAND } from '../engine2d/earth.js';

export const R_EARTH = 6371000;

function earthTexture() {
  const W = 4096, H = 2048, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#1e3a8a'); sea.addColorStop(0.5, '#1d4ed8'); sea.addColorStop(1, '#1e3a8a');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  const X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
  LAND.forEach((poly, i) => {
    g.beginPath(); poly.forEach(([lo, la], k) => (k ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la)))); g.closePath();
    g.fillStyle = i === 1 || i === LAND.length - 1 ? '#f1f5f9' : '#4d8a3a'; g.fill();
  });
  // Desiertos y montañas aproximados (manchas de color) y nubes.
  let a = 9; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (const [lo, la, rx, ry, col] of [[15, 23, 22, 8, '#c9a66b'], [45, 23, 9, 7, '#c9a66b'], [130, -25, 14, 7, '#c08a4a'], [-110, 35, 8, 6, '#a3804f'], [85, 35, 18, 6, '#8b7a5a'], [-70, -20, 4, 12, '#8b7a5a']]) {
    g.globalAlpha = 0.65; g.fillStyle = col; g.beginPath(); g.ellipse(X(lo), Y(la), (rx / 360) * W, (ry / 180) * H, 0, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = '#f8fafc'; g.fillRect(0, 0, W, H * 0.045); g.fillRect(0, H * 0.94, W, H * 0.06);
  // Variación de verdes en tierra (bosques, llanuras) y nubes pequeñas y dispersas.
  for (let i = 0; i < 6000; i++) {
    const x = r() * W, y = r() * H;
    g.globalAlpha = 0.18; g.fillStyle = r() < 0.5 ? '#3f7a32' : '#6b9a4a';
    g.globalCompositeOperation = 'source-atop'; g.beginPath(); g.arc(x, y, 3 + r() * 10, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 1600; i++) {
    g.globalAlpha = 0.18 + r() * 0.35; g.fillStyle = '#ffffff';
    const x = r() * W, y = H * (0.1 + r() * 0.8), w = 6 + r() * 34;
    g.beginPath(); g.ellipse(x, y, w, w * (0.2 + r() * 0.3), r() * 0.6 - 0.3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return t;
}

/**
 * Esfera terrestre con su punto (lat, lon) justo debajo del origen del mundo (y = -drop m).
 * Úsala junto con el suelo plano: cerca del origen manda el suelo; a lo lejos se ve la curvatura.
 */
export function createEarth({ lat = 19.4, lon = -99.1, drop = 2 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(R_EARTH, 512, 256);
  const mat = new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.9, metalness: 0 });
  const earth = new THREE.Mesh(geo, mat);
  // Gira la esfera para que (lat, lon) quede arriba (+y).
  const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lon + 180);
  const p = new THREE.Vector3(-Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)); // dirección de (lat, lon) en la esfera de three
  earth.quaternion.setFromUnitVectors(p.normalize(), new THREE.Vector3(0, 1, 0));
  g.add(earth);
  // Atmósfera: cascarón un poco más grande que brilla en el borde (efecto Fresnel).
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R_EARTH * 1.018, 128, 64), new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color('#60a5fa') } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c, f * 0.9); }',
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  g.add(atm);
  g.position.y = -R_EARTH - drop;
  return { group: g, earth, atm };
}

/** Estrellas en una esfera lejana (para el fondo del espacio). */
export function createStars(n = 2500, radius = 3e7) {
  let a = 3; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([Math.cos(th) * s * radius, u * radius, Math.sin(th) * s * radius], i * 3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false }));
}
