import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SOURCES, PARTS, SYSTEM_HTML, srcN } from './data.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- renderer / scene
const canvas = $('#c');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#loading').innerHTML = 'WebGL başlatılamadı. Lütfen güncel bir tarayıcı kullanın.';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
camera.position.set(4.5, 3.2, 8.5);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2.5;
controls.maxDistance = 40;
controls.screenSpacePanning = true;

const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(5, 8, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0x6fd8ff, 1.1); rim.position.set(-6, 2, -5); scene.add(rim);
scene.add(new THREE.HemisphereLight(0x9fc6ff, 0x101418, 0.35));

// ground glow disc + grid
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, 'rgba(56,214,255,0.22)'); gr.addColorStop(0.5, 'rgba(56,214,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = -2.2; scene.add(disc);
  const grid = new THREE.GridHelper(40, 40, 0x1d3a52, 0x0e1c28); grid.position.y = -2.21;
  grid.material.transparent = true; grid.material.opacity = 0.45; scene.add(grid);
}

// ---------------------------------------------------------------- materials
const M = {
  black: new THREE.MeshStandardMaterial({ color: 0x17191d, metalness: 0.55, roughness: 0.42 }),
  alu: new THREE.MeshStandardMaterial({ color: 0x8e959e, metalness: 0.9, roughness: 0.34 }),
  aluDark: new THREE.MeshStandardMaterial({ color: 0x5d646d, metalness: 0.85, roughness: 0.4 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xd2d6dc, metalness: 1, roughness: 0.22 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc0743a, metalness: 1, roughness: 0.33 }),
  lam: new THREE.MeshStandardMaterial({ color: 0x4b525b, metalness: 0.8, roughness: 0.48 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a44c, metalness: 1, roughness: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: 0.85 }),
  carbon: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.2, roughness: 0.6 }),
  olive: new THREE.MeshStandardMaterial({ color: 0x5f6340, metalness: 0.7, roughness: 0.42 }),
  red: new THREE.MeshStandardMaterial({ color: 0x8a2a20, metalness: 0.3, roughness: 0.5 }),
  screen: new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 1, roughness: 0.3, wireframe: true }),
  hole: new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.9 }),
};
const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

// ---------------------------------------------------------------- part registry
const root = new THREE.Group(); scene.add(root);
const pump = new THREE.Group(); root.add(pump);
const parts = {};
const pickables = [];
function part(id, off, opts = {}) {
  const g = new THREE.Group(); g.userData.partId = id; pump.add(g);
  parts[id] = { id, g, off: new THREE.Vector3(...off), mats: [], housing: !!opts.housing, clip: !!(opts.housing || opts.clip), spin: !!opts.spin, center: new THREE.Vector3() };
  return parts[id];
}
function add(p, geo, proto, pos, rot) {
  const m = proto.clone();
  if (p.clip) m.side = THREE.DoubleSide;
  m.userData.baseOpacity = 1;
  p.mats.push(m);
  const mesh = new THREE.Mesh(geo, m);
  if (pos) mesh.position.set(...pos);
  if (rot) mesh.rotation.set(...rot);
  mesh.userData.partId = p.id;
  p.g.add(mesh); pickables.push(mesh);
  return mesh;
}
const V2 = (r, y) => new THREE.Vector2(r, y);
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(p => V2(p[0], p[1])), seg);
const ringGeo = (ro, ri, h, seg = 48) => lathe([[ri, -h / 2], [ro, -h / 2], [ro, h / 2], [ri, h / 2], [ri, -h / 2]], seg);
function hexBolt(p, proto, pos, axis = 'y', r = 0.05, h = 0.1) {
  const m = add(p, new THREE.CylinderGeometry(r, r, h, 6), proto, pos);
  if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}
// tube with varying radius along a parametric path
function varTube(path, radius, N = 90, R = 20) {
  const pos = [], idx = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = path(t), p2 = path(Math.min(1, t + 0.001)), p1 = path(Math.max(0, t - 0.001));
    const T = p2.clone().sub(p1).normalize(); const Nn = new THREE.Vector3().crossVectors(T, up).normalize(); const B = new THREE.Vector3().crossVectors(Nn, T);
    const r = radius(t);
    for (let j = 0; j <= R; j++) { const a = j / R * Math.PI * 2; const v = p.clone().addScaledVector(Nn, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r); pos.push(v.x, v.y, v.z); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function helixBlade(r0, r1, y0, y1, turns, phase, U = 6, Vn = 60) {
  const pos = [], idx = [];
  for (let i = 0; i <= Vn; i++) { const v = i / Vn; const a = phase + v * turns * Math.PI * 2; const y = lerp(y0, y1, v);
    for (let j = 0; j <= U; j++) { const r = lerp(r0, r1, j / U) * (v < 0.15 ? lerp(0.85, 1, v / 0.15) : 1); pos.push(r * Math.cos(a), y, -r * Math.sin(a)); } }
  for (let i = 0; i < Vn; i++) for (let j = 0; j < U; j++) { const a = i * (U + 1) + j, b = a + U + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function plateTexture() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 384; const g = c.getContext('2d');
  g.fillStyle = '#cfc9b6'; g.fillRect(0, 0, 768, 384);
  g.strokeStyle = '#3b3a35'; g.lineWidth = 8; g.strokeRect(14, 14, 740, 356);
  g.fillStyle = '#222'; g.font = 'bold 40px monospace'; g.fillText('PUMP, FUEL BOOST — ELECTRIC', 40, 74);
  g.font = '30px monospace';
  ['EĞİTİM MODELİ / TRAINING MODEL', '200 VAC  3Ø  400 Hz', 'NOM. 73 GPM @ 17 PSID (Eaton, kaynak)', 'P/N: ---- (gerçek P/N değildir)', 'S/N: SIM-0001'].forEach((t, i) => g.fillText(t, 40, 130 + i * 48));
  for (const [x, y] of [[34, 34], [734, 34], [34, 350], [734, 350]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fillStyle = '#777'; g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------------------------------------------------------------- build model (pump axis = local Y; inlet +Y, motor −Y)
const E = 0.9; // explode scale
// Motor housing
{
  const p = part('housing', [0, -5.0 * E, 0], { housing: true });
  add(p, lathe([[0, -3.2], [0.88, -3.2], [1.0, -3.14], [1.05, -3.02], [1.05, 0.12], [1.16, 0.12], [1.16, 0.3], [0.97, 0.3], [0.97, -3.02], [0.0, -3.02]], 72), M.black);
  for (let i = 0; i < 7; i++) add(p, new THREE.TorusGeometry(1.055, 0.028, 10, 72), M.black, [0, -2.75 + i * 0.4, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; hexBolt(p, M.steel, [Math.cos(a) * 0.7, -3.25, Math.sin(a) * 0.7], 'y', 0.05, 0.08); }
  add(p, new THREE.CylinderGeometry(0.3, 0.34, 0.08, 48), M.aluDark, [0, -3.24, 0]);
}
// Data plate
{
  const p = part('plate', [0, -5.0 * E, 1.0], {});
  const tex = plateTexture(); 
  const m = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
  add(p, new THREE.CylinderGeometry(1.085, 1.085, 1.5, 32, 1, true, -0.42, 0.84), m, [0, -1.45, 0]);
}
// Electrical connector (on −X side)
{
  const p = part('connector', [-1.4, -5.0 * E, 0], {});
  add(p, new THREE.BoxGeometry(0.08, 0.56, 0.56), M.olive, [-1.08, -2.55, 0]);
  for (const [y, z] of [[-0.22, -0.22], [-0.22, 0.22], [0.22, -0.22], [0.22, 0.22]]) hexBolt(p, M.steel, [-1.13, -2.55 + y, z], 'x', 0.025, 0.04);
  add(p, new THREE.CylinderGeometry(0.2, 0.2, 0.34, 32), M.olive, [-1.29, -2.55, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.CylinderGeometry(0.245, 0.245, 0.2, 28, 1), M.olive, [-1.47, -2.55, 0], [0, 0, Math.PI / 2]);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(p, new THREE.BoxGeometry(0.2, 0.025, 0.025), M.olive, [-1.47, -2.55 + Math.cos(a) * 0.25, Math.sin(a) * 0.25]); }
  add(p, new THREE.CylinderGeometry(0.17, 0.17, 0.02, 32), M.hole, [-1.58, -2.55, 0], [0, 0, Math.PI / 2]);
  for (const [y, z] of [[0.07, 0], [-0.05, 0.06], [-0.05, -0.06], [0, 0]]) add(p, new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), M.brass, [-1.6, -2.55 + y, z], [0, 0, Math.PI / 2]);
}
// Stator
{
  const p = part('stator', [2.7, -1.0 * E, 0], { clip: true });
  const prof = [[0.6, -2.35]]; const N = 34;
  for (let i = 0; i <= N; i++) { const y = lerp(-2.35, -0.65, i / N); prof.push([i % 2 ? 0.915 : 0.94, y]); }
  prof.push([0.6, -0.65], [0.6, -2.35]);
  add(p, lathe(prof, 72), M.lam);
  for (const y of [-2.47, -0.53]) add(p, new THREE.TorusGeometry(0.76, 0.13, 16, 64), M.copper, [0, y, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; add(p, new THREE.BoxGeometry(0.07, 1.7, 0.07), M.copper, [Math.cos(a) * 0.64, -1.5, Math.sin(a) * 0.64], [0, -a, 0]); }
  // lead wires toward connector
  add(p, varTube(t => new THREE.Vector3(lerp(-0.7, -0.95, t), lerp(-2.55, -2.62, t), lerp(0.2, 0.0, t)), () => 0.03, 12, 8), M.red);
}
// Thermal protector
{
  const p = part('thermal', [2.7, -2.4 * E, 0], {});
  add(p, new THREE.BoxGeometry(0.2, 0.12, 0.14), M.red, [0, -2.62, 0.78]);
  add(p, new THREE.BoxGeometry(0.16, 0.02, 0.1), M.steel, [0, -2.55, 0.78]);
}
// Rotor (squirrel cage)
{
  const p = part('rotor', [0, -0.85 * E, 0], { spin: true });
  add(p, new THREE.CylinderGeometry(0.55, 0.55, 1.6, 64), M.lam, [0, -1.5, 0]);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; add(p, new THREE.CylinderGeometry(0.028, 0.028, 1.66, 8), M.alu, [Math.cos(a) * 0.54, -1.5, Math.sin(a) * 0.54]); }
  for (const y of [-2.33, -0.67]) add(p, ringGeo(0.56, 0.36, 0.08), M.alu, [0, y, 0]);
  add(p, new THREE.BoxGeometry(0.04, 1.62, 0.1), M.aluDark, [0.56, -1.5, 0]); // balance marker
}
// Shaft
{
  const p = part('shaft', [-2.6, 0.3 * E, 0], { spin: true });
  add(p, new THREE.CylinderGeometry(0.12, 0.12, 4.6, 32), M.steel, [0, -0.75, 0]);
  add(p, new THREE.CylinderGeometry(0.09, 0.09, 0.4, 32), M.steel, [0, 1.75, 0]);
  add(p, new THREE.BoxGeometry(0.04, 0.3, 0.05), M.aluDark, [0.1, 1.0, 0]);
}
// Bearings
function bearing(p, y) {
  add(p, ringGeo(0.34, 0.275, 0.16), M.steel, [0, y, 0]);
  add(p, ringGeo(0.195, 0.125, 0.16), M.steel, [0, y, 0]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(p, new THREE.SphereGeometry(0.045, 16, 12), M.steel, [Math.cos(a) * 0.235, y, Math.sin(a) * 0.235]); }
  add(p, ringGeo(0.275, 0.195, 0.02), M.brass, [0, y + 0.07, 0]);
}
bearing(part('bearing-r', [0, -1.45 * E, 0], { spin: true }), -2.85);
bearing(part('bearing-f', [0, 0.35 * E, 0], { spin: true }), 0.1);
// Seal
{
  const p = part('seal', [0, 0.95 * E, 0], {});
  add(p, ringGeo(0.27, 0.13, 0.08), M.carbon, [0, 0.4, 0]);
  add(p, ringGeo(0.25, 0.14, 0.03), M.steel, [0, 0.46, 0]);
  add(p, varTube(t => new THREE.Vector3(Math.cos(t * 6 * Math.PI * 2) * 0.2, lerp(0.22, 0.36, t), Math.sin(t * 6 * Math.PI * 2) * 0.2), () => 0.012, 160, 6), M.steel);
  add(p, new THREE.TorusGeometry(0.3, 0.025, 10, 48), M.rubber, [0, 0.52, 0], [Math.PI / 2, 0, 0]);
  add(p, new THREE.TorusGeometry(1.08, 0.03, 10, 72), M.rubber, [0, 0.3, 0], [Math.PI / 2, 0, 0]);
}
// Impeller
{
  const p = part('impeller', [0, 1.45 * E, 0], { spin: true });
  add(p, lathe([[0.12, 0.72], [0.95, 0.74], [0.95, 0.79], [0.3, 0.84], [0.2, 1.05], [0.12, 1.08], [0.12, 0.72]], 72), M.steel);
  const nb = 7;
  for (let b = 0; b < nb; b++) {
    const sh = new THREE.Shape(); const pts = [];
    for (let i = 0; i <= 16; i++) { const r = lerp(0.24, 0.93, i / 16); const th = -1.25 * (r - 0.24); pts.push([r * Math.cos(th), r * Math.sin(th)]); }
    const tth = 0.035; sh.moveTo(pts[0][0], pts[0][1]);
    pts.forEach(q => sh.lineTo(q[0], q[1]));
    for (let i = pts.length - 1; i >= 0; i--) { const r = Math.hypot(...pts[i]); const th = Math.atan2(pts[i][1], pts[i][0]) + tth / r; sh.lineTo(r * Math.cos(th), r * Math.sin(th)); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 4 });
    g.rotateX(-Math.PI / 2); g.translate(0, 0.79, 0); g.rotateY(b / nb * Math.PI * 2);
    add(p, g, M.steel);
  }
  add(p, lathe([[0.95, 1.09], [0.95, 1.12], [0.62, 1.16], [0.42, 1.24], [0.4, 1.3], [0.37, 1.3], [0.39, 1.22], [0.6, 1.13], [0.93, 1.09]], 72), M.steel);
}
// Inducer
{
  const p = part('inducer', [0, 2.25 * E, 0], { spin: true });
  add(p, new THREE.CylinderGeometry(0.15, 0.18, 0.48, 32), M.steel, [0, 1.42, 0]);
  add(p, new THREE.ConeGeometry(0.15, 0.18, 32), M.steel, [0, 1.75, 0]);
  for (let b = 0; b < 3; b++) add(p, helixBlade(0.17, 0.4, 1.2, 1.64, 0.85, b / 3 * Math.PI * 2), M.steel);
}
// Inlet screen
{
  const p = part('screen', [0, 3.05 * E, 0], {});
  add(p, new THREE.CylinderGeometry(0.41, 0.41, 0.3, 40, 6, true), M.screen, [0, 1.93, 0]);
  for (const y of [1.78, 2.08]) add(p, new THREE.TorusGeometry(0.41, 0.018, 8, 48), M.steel, [0, y, 0], [Math.PI / 2, 0, 0]);
}
// Volute / pump housing
{
  const p = part('volute', [0, 5.3 * E, 0], { housing: true });
  add(p, lathe([[0.32, 0.3], [1.2, 0.3], [1.2, 0.47], [1.07, 0.52], [1.18, 0.72], [1.24, 1.0], [1.18, 1.32], [0.98, 1.58], [0.62, 1.74], [0.46, 1.76], [0.46, 1.6], [0.45, 1.5], [0.96, 1.3], [1.06, 1.0], [0.99, 0.62], [0.32, 0.5], [0.32, 0.3]], 80), M.alu);
  add(p, varTube(t => { const a = lerp(0.25, 2, t) * Math.PI; const R = lerp(1.2, 1.28, t); return new THREE.Vector3(R * Math.cos(a), 1.0, R * Math.sin(a)); }, t => lerp(0.06, 0.24, t), 100, 20), M.alu);
  for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * Math.PI * 2; hexBolt(p, M.steel, [Math.cos(a) * 1.12, 0.52, Math.sin(a) * 1.12], 'y', 0.045, 0.1); }
}
// Outlet port (+X)
{
  const p = part('outlet', [1.3, 5.3 * E, 0], { housing: true });
  add(p, ringGeo(0.27, 0.2, 1.0, 40), M.alu, [1.75, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.BoxGeometry(0.1, 0.78, 0.78), M.alu, [2.28, 1.0, 0]);
  add(p, new THREE.CylinderGeometry(0.2, 0.2, 0.012, 32), M.hole, [2.335, 1.0, 0], [0, 0, Math.PI / 2]);
  for (const [y, z] of [[-0.28, -0.28], [-0.28, 0.28], [0.28, -0.28], [0.28, 0.28]]) hexBolt(p, M.steel, [2.36, 1.0 + y, z], 'x', 0.045, 0.08);
}
// Check valve (in outlet)
{
  const p = part('check', [2.8, 5.3 * E, 0], {});
  add(p, new THREE.CylinderGeometry(0.19, 0.19, 0.04, 32), M.brass, [2.05, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, ringGeo(0.2, 0.16, 0.05, 32), M.rubber, [2.08, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), M.steel, [2.05, 1.2, 0], [Math.PI / 2, 0, 0]);
  add(p, new THREE.BoxGeometry(0.04, 0.06, 0.08), M.brass, [2.05, 1.18, 0]);
}
// Pressure relief / regulator valve (−X)
{
  const p = part('relief', [-1.4, 5.3 * E, 0], { housing: true });
  add(p, new THREE.CylinderGeometry(0.3, 0.32, 0.36, 40), M.alu, [-1.38, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.CylinderGeometry(0.35, 0.35, 0.2, 6), M.aluDark, [-1.65, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.CylinderGeometry(0.065, 0.065, 0.36, 16), M.steel, [-1.9, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.CylinderGeometry(0.13, 0.13, 0.07, 6), M.steel, [-1.82, 1.0, 0], [0, 0, Math.PI / 2]);
  add(p, new THREE.TorusGeometry(0.31, 0.02, 8, 40), M.rubber, [-1.22, 1.0, 0], [0, Math.PI / 2, 0]);
}
// Inlet ports (+Y axial main, +Z side)
{
  const p = part('inlet', [0, 6.4 * E, 0], { housing: true });
  add(p, lathe([[0.42, 1.74], [0.52, 1.74], [0.52, 2.22], [0.8, 2.22], [0.8, 2.34], [0.42, 2.34], [0.42, 1.74]], 64), M.alu);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; hexBolt(p, M.steel, [Math.cos(a) * 0.66, 2.38, Math.sin(a) * 0.66], 'y', 0.045, 0.08); }
  add(p, ringGeo(0.2, 0.14, 0.5, 32), M.alu, [0, 1.35, 1.32], [Math.PI / 2, 0, 0]);
  add(p, ringGeo(0.3, 0.14, 0.06, 32), M.alu, [0, 1.35, 1.58], [Math.PI / 2, 0, 0]);
}
// compute label anchors (assembled, local)
for (const p of Object.values(parts)) { const b = new THREE.Box3().setFromObject(p.g); b.getCenter(p.center); }
const ORDER = ['inlet', 'screen', 'inducer', 'impeller', 'volute', 'outlet', 'check', 'relief', 'seal', 'bearing-f', 'shaft', 'rotor', 'stator', 'thermal', 'bearing-r', 'housing', 'connector', 'plate'];

// ---------------------------------------------------------------- fuel particles
const NP = 700;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(pGeo, pMat); points.renderOrder = 10; points.frustumCulled = false; pump.add(points);
const P = Array.from({ length: NP }, () => ({ s: Math.random(), r0: 0.08 + Math.random() * 0.32, ph: Math.random() * Math.PI * 2, j: Math.random(), bub: Math.random() }));
function pathPoint(q, out) {
  const s = q.s; let r, a, y;
  if (s < 0.2) { const t = s / 0.2; y = lerp(3.0, 1.66, t); r = q.r0; a = q.ph + t * 0.4; }
  else if (s < 0.36) { const t = (s - 0.2) / 0.16; y = lerp(1.66, 1.2, t); r = lerp(q.r0, 0.3, t); a = q.ph + 0.4 + t * 5.3; }
  else if (s < 0.55) { const t = (s - 0.36) / 0.19; y = lerp(1.15, 0.95, t); r = lerp(0.3, 0.98, t); a = q.ph + 5.7 + t * 3.2; }
  else if (s < 0.84) { const t = (s - 0.55) / 0.29; const a0 = q.ph + 8.9; const a1 = Math.ceil(a0 / (Math.PI * 2)) * Math.PI * 2 + Math.PI * 2 * (q.j > 0.5 ? 0 : 0); y = 0.98 + (q.j - 0.5) * 0.12; r = 1.0 + (q.j - 0.5) * 0.06; a = lerp(a0, a1, t); }
  else { const t = (s - 0.84) / 0.16; out.set(lerp(1.0, 2.7, t), 1.0 + (q.j - 0.5) * 0.25, (q.bub - 0.5) * 0.25); return out; }
  return out.set(r * Math.cos(a), y, -r * Math.sin(a));
}

// ---------------------------------------------------------------- simulation state
const S = { on: false, speedCmd: 1, valve: 0.8, fuelT: 30, alt: 0, press: true, fault: 'none', rpm: 0, wT: 30, tripped: false,
  Q: 0, dp: 0, inP: 0, outP: 0, I: 0, outT: 30, margin: 10, cav: false, pph: 0 };
const D = {}; // display (smoothed)
const FAULT_DESC = {
  none: `Normal çalışma. Nominal nokta kaynağa göre 73 gpm @ 17 psid, 200 VAC 400 Hz. ${ref('eaton-f16')}`,
  cav: `Yüksek irtifa + sıcak yakıt + tank basınçlandırması yok → giriş mutlak basıncı düşer, çözünmüş hava ayrışır, NPSH yetersizleşir. Belirti: ΔP ve debide düşüş/dalgalanma, akımda düşüş. ${ref('nasa-1970')}${ref('cranfield-cav')}${ref('asme-sizing')}`,
  clog: 'Giriş süzgeci tıkalı → giriş basıncı ve debi düşer; yüksek irtifada kavitasyon riski artar. (Temsili model)',
  lowv: 'Besleme gerilimi %72 → tork ≈V² ile azalır; kayma ve faz akımı artar, devir ve basınç bir miktar düşer. (Temsili model)',
  phase: `Tek faz kopuk (single-phasing) → kalan fazlardan ≈√3 kat akım, büyük kayma, hızlı sargı ısınması; termal koruma devreye girebilir. ${ref('eaton-9602')} (Temsili)`,
  dry: `Pompa yakıtsız (kuru) → debi yok; yakıta batık motor soğutulamaz/yağlanamaz, sargı ısınır ve termal koruyucu beslemeyi keser. ${ref('eaton-9602')}${ref('eaton-vf')}`,
};
function ref(id) { return `<a href="#" class="srcref" data-src="${id}">[${srcN(id)}]</a>`; }

const RATED_Q = 73, RATED_DP = 17, H0N = 24;
const A_P = (H0N - RATED_DP) / (RATED_Q * RATED_Q), K_SYS = RATED_DP / (RATED_Q * RATED_Q), S_SCR = 0.6 / (RATED_Q * RATED_Q);
function step(dt) {
  const f = S.fault;
  const vF = f === 'lowv' ? 0.72 : 1, phase = f === 'phase', dry = f === 'dry';
  const powered = S.on && !S.tripped;
  const sync = 12000 * S.speedCmd;
  const n = S.rpm / 12000;
  const ambient = 14.696 * Math.pow(1 - 6.8756e-6 * S.alt, 5.2559);
  const tankG = S.press ? 5.0 : 0;
  const head = 0.25;
  const clog = f === 'clog' ? 14 : 1;
  const k = K_SYS / (S.valve * S.valve), s = S_SCR * clog;
  let H0 = H0N * n * n, Q = 0, dp = 0, margin = 10, cav = false;
  if (dry) { Q = 0; dp = 0.25 * n * n; }
  else {
    Q = Math.sqrt(Math.max(H0, 0) / (A_P + k + s));
    const pv = 0.2 + 0.02 * (S.fuelT + 30);              // efektif buhar + gaz ayrışma basıncı, psia (temsili)
    const inAbs = ambient + tankG + head - s * Q * Q;
    const npshr = 0.2 + 0.9 * Math.pow(Q / RATED_Q, 2);
    margin = inAbs - pv - npshr;
    if (margin < 0 && n > 0.2) {
      cav = true;
      const hf = clamp(1 + margin * 0.55, 0.3, 1) * (1 - 0.12 * Math.random());
      H0 *= hf; Q = Math.sqrt(Math.max(H0, 0) / (A_P + k + s));
    }
    dp = H0 - A_P * Q * Q;
  }
  const inP = dry ? 0 : tankG + head - s * Q * Q;
  const x = Q / RATED_Q;
  const Ph = Q * dp / 1714 * 745.7;
  const eta = clamp(0.5 - 0.35 * (x - 1) * (x - 1), 0.12, 0.5);
  const Ps = (Ph > 0 ? Ph / eta : 0) + 40 * n + (dry ? 0 : 60 * n * n * n);
  const slipLoad = 0.035 * (Ps / 1180) / (vF * vF) * (phase ? 2.6 : 1);
  const target = powered ? sync * (1 - Math.min(slipLoad, 0.6)) : 0;
  const tau = target > S.rpm ? (phase ? 1.6 : 0.55) : 1.8;
  S.rpm += (target - S.rpm) * (1 - Math.exp(-dt / tau));
  let I = 0;
  if (powered) {
    const Pe = Ps / 0.78 + 70 * vF * vF;
    I = Pe / (1.732 * 200 * vF * 0.82);
    const sl = clamp((sync - S.rpm) / Math.max(sync, 1), 0, 1);
    I += 22 * sl * sl * vF;                                   // kalkış (inrush) akımı, temsili
    if (phase) I *= 1.73;
  }
  // sargı sıcaklığı
  const heat = (phase ? 0.16 : 0.1) * I * I + (dry ? 3.5 * n : 0);
  const cool = dry ? 0.018 : 0.04 + 0.16 * Math.min(1, x + 0.3);
  S.wT += (heat - cool * (S.wT - S.fuelT)) * dt * 6;
  if (S.wT > 150 && !S.tripped) { S.tripped = true; }
  const mdot = Q * 0.0505;
  const outT = S.fuelT + (mdot > 0.05 ? (Ps - Ph) / (mdot * 2000) : 0);
  const dens = 6.7 * (1 - 0.00095 * (S.fuelT - 15));
  Object.assign(S, { Q, dp, inP, outP: inP + dp, I, margin, cav, outT, pph: Q * 60 * dens });
}

// ---------------------------------------------------------------- gauges
const GAUGES = [
  ['inP', 'GİRİŞ BASINCI', 'psig', -5, 15, 1, v => `NPSH payı ≈ ${S.margin > 9 ? '>9' : S.margin.toFixed(1)} psi`],
  ['outP', 'ÇIKIŞ BASINCI', 'psig', 0, 35, 1],
  ['dp', 'BASINÇ ARTIŞI ΔP', 'psid', 0, 30, 1, () => 'nominal 17 psid [1]'],
  ['Q', 'DEBİ', 'GPM', 0, 100, 1, () => `≈ ${Math.round(D.pph || 0).toLocaleString('tr-TR')} pph`],
  ['I', 'MOTOR AKIMI', 'A/faz', 0, 20, 1, () => (S.fault === 'phase' ? '2 faz!' : '3Ø 200 VAC')],
  ['rpm', 'DEVİR', 'rpm', 0, 13000, 0, () => `senkron ${Math.round(12000 * S.speedCmd)} (4 kutup varsayım)`],
  ['outT', 'YAKIT SICAKLIĞI', '°C', -40, 100, 1, () => 'pompa çıkışı'],
  ['wT', 'SARGI SICAKLIĞI', '°C', 0, 200, 0, () => 'trip ≈150 °C (temsili)'],
];
const gaugeEls = {};
function arcPath(cx, cy, r, a0, a1) { const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`; }
{
  const box = $('#gauges');
  const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
  for (const [id, label, unit, mn, mx] of GAUGES) {
    const el = document.createElement('div'); el.className = 'gauge';
    let ticks = '';
    for (let i = 0; i <= 10; i++) { const a = lerp(A0, A1, i / 10); const r1 = i % 5 ? 33 : 30; ticks += `<line x1="${50 + 36 * Math.cos(a)}" y1="${46 + 36 * Math.sin(a)}" x2="${50 + r1 * Math.cos(a)}" y2="${46 + r1 * Math.sin(a)}" stroke="#3b5670" stroke-width="1"/>`; }
    el.innerHTML = `<svg viewBox="0 0 100 74"><path d="${arcPath(50, 46, 38, A0, A1)}" stroke="#16293a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="ga" d="" stroke="#38d6ff" stroke-width="5" fill="none" stroke-linecap="round"/>${ticks}
      <line class="gn" x1="50" y1="46" x2="50" y2="16" stroke="#e8f3ff" stroke-width="1.6" stroke-linecap="round"/><circle cx="50" cy="46" r="3" fill="#e8f3ff"/>
      <text x="14" y="72" font-size="7" fill="#5f7388" font-family="monospace">${mn}</text><text x="86" y="72" font-size="7" fill="#5f7388" text-anchor="end" font-family="monospace">${mx}</text></svg>
      <div class="gl">${label}</div><div><span class="gv">0</span><span class="gu">${unit}</span></div><div class="g2"></div>`;
    box.appendChild(el);
    gaugeEls[id] = { el, arc: el.querySelector('.ga'), n: el.querySelector('.gn'), v: el.querySelector('.gv'), s: el.querySelector('.g2'), A0, A1 };
  }
}
function updateGauges() {
  for (const [id, , , mn, mx, dec, sub] of GAUGES) {
    const raw = S[id]; D[id] = D[id] === undefined ? raw : lerp(D[id], raw, 0.18);
    if (id === 'Q') D.pph = lerp(D.pph || 0, S.pph, 0.18);
    const v = D[id], g = gaugeEls[id];
    const t = clamp((v - mn) / (mx - mn), 0, 1); const a = lerp(g.A0, g.A1, t);
    g.arc.setAttribute('d', t > 0.002 ? arcPath(50, 46, 38, g.A0, a) : '');
    g.n.setAttribute('x2', 50 + 30 * Math.cos(a)); g.n.setAttribute('y2', 46 + 30 * Math.sin(a));
    g.v.textContent = id === 'rpm' ? Math.round(v).toLocaleString('tr-TR') : v.toFixed(dec);
    if (sub) g.s.innerHTML = sub(v);
    let cls = '';
    if (S.on) {
      if (id === 'dp' && S.rpm > 3000 && v < 8) cls = 'warn';
      if (id === 'inP' && S.margin < 0.5) cls = S.margin < 0 ? 'bad' : 'warn';
      if (id === 'I' && v > 9) cls = 'warn';
      if (id === 'wT' && v > 120) cls = v > 145 ? 'bad' : 'warn';
    }
    g.el.className = 'gauge ' + cls;
    g.arc.setAttribute('stroke', cls === 'bad' ? '#ff5d5d' : cls === 'warn' ? '#ffb547' : '#38d6ff');
  }
  $('#h-rpm').textContent = Math.round(D.rpm).toLocaleString('tr-TR');
  $('#h-flow').textContent = D.Q.toFixed(1);
  $('#h-dp').textContent = D.dp.toFixed(1);
  $('#h-amp').textContent = D.I.toFixed(1);
}
let lastAlertKey = '';
function updateAlerts() {
  const a = [];
  const running = S.on && !S.tripped;
  if (S.tripped) a.push(['b', 'TERMAL KORUMA AÇTI — motor beslemesi kesildi. Soğuyunca gücü kapatıp açın.']);
  if (!S.on) a.push(['w', 'Pompa enerjisiz (GÜÇ KAPALI).']);
  if (running && S.cav) a.push(['b', 'KAVİTASYON — NPSH yetersiz, basınç ve debi dalgalanıyor.']);
  if (running && S.fault === 'dry') a.push(['b', 'KURU ÇALIŞMA — yakıt yok; soğutma ve yağlama yok.']);
  if (running && S.fault === 'phase') a.push(['b', 'FAZ KAYBI — 2 faz üzerinden çalışma, akım yüksek.']);
  if (running && S.fault === 'lowv') a.push(['w', 'Düşük besleme gerilimi (%72) — kayma ve akım arttı.']);
  if (running && S.rpm > 3000 && S.dp < 8 && S.fault !== 'dry') a.push(['w', 'Düşük boost basıncı (ΔP < 8 psid).']);
  if (running && S.inP < 1.5 && S.fault !== 'dry') a.push(['w', 'Giriş basıncı düşük — süzgeç / tank basınçlandırma kontrol.']);
  if (S.wT > 120 && !S.tripped) a.push(['w', `Sargı sıcaklığı yüksek (${Math.round(S.wT)} °C).`]);
  if (running && a.length === 0) a.push(['ok', 'Normal çalışma — değerler nominal aralıkta (≈).']);
  const key = a.map(x => x[1]).join('|');
  if (key !== lastAlertKey) { lastAlertKey = key; $('#alerts').innerHTML = a.map(([c, t]) => `<div class="alert ${c}">${t}</div>`).join(''); }
  const st = $('#h-stat');
  const alarm = S.tripped || (running && (S.cav || S.fault === 'dry' || S.fault === 'phase'));
  st.textContent = S.tripped ? 'TRIP' : !S.on ? 'KAPALI' : alarm ? 'ALARM' : 'ÇALIŞIYOR';
  st.className = 'hstat ' + (alarm ? 'alarm' : S.on ? 'on' : '');
}

// ---------------------------------------------------------------- UI wiring
function bindRange(id, out, fmt, fn) { const el = $('#' + id); const f = () => { fn(+el.value); $('#' + out).textContent = fmt(+el.value); }; el.addEventListener('input', f); f(); return el; }
bindRange('speed', 'o-speed', v => v + '%', v => S.speedCmd = v / 100);
bindRange('valve', 'o-valve', v => v + '%', v => S.valve = v / 100);
bindRange('ftemp', 'o-temp', v => v + ' °C', v => S.fuelT = v);
bindRange('alt', 'o-alt', v => v.toLocaleString('tr-TR') + ' ft', v => S.alt = v);
$('#press').addEventListener('change', e => S.press = e.target.checked);
function setRange(id, v) { const el = $('#' + id); el.value = v; el.dispatchEvent(new Event('input')); }
function setPower(on) {
  if (on && S.tripped && S.wT < 90) S.tripped = false;
  if (!on && S.tripped && S.wT < 90) S.tripped = false;
  S.on = on; $('#b-power').setAttribute('aria-pressed', on); $('#power-label').textContent = on ? 'GÜÇ AÇIK' : 'GÜÇ KAPALI';
}
$('#b-power').addEventListener('click', () => setPower(!S.on));
function setFault(f) {
  S.fault = f;
  $$('.fault').forEach(b => b.classList.toggle('active', b.dataset.fault === f));
  $('#fault-desc').innerHTML = FAULT_DESC[f];
  if (f === 'cav') { setRange('alt', 45000); setRange('ftemp', 55); $('#press').checked = false; S.press = false; }
  else { setRange('alt', 0); setRange('ftemp', 30); $('#press').checked = true; S.press = true; }
}
$$('.fault').forEach(b => b.addEventListener('click', () => setFault(b.dataset.fault)));

// explode
let explodeT = 0, explodeTarget = 0, autoFrame = true;
const exEl = $('#explode');
exEl.addEventListener('input', () => { explodeTarget = exEl.value / 100; autoFrame = true; updExBtn(); });
function updExBtn() { $('#b-explode').textContent = explodeTarget > 0.5 ? '◂ Birleştir' : 'Ayır ▸'; }
$('#b-explode').addEventListener('click', () => { explodeTarget = explodeTarget > 0.5 ? 0 : 1; exEl.value = explodeTarget * 100; autoFrame = true; updExBtn(); });
function setExplode(v, instant) { explodeTarget = v; exEl.value = v * 100; if (instant) explodeT = v; autoFrame = true; updExBtn(); }

// view toggles
function applyMaterials() {
  const xr = $('#xray').checked, cut = $('#cut').checked;
  for (const p of Object.values(parts)) for (const m of p.mats) {
    const isScreen = m.wireframe;
    if (p.housing) { m.transparent = xr; m.opacity = xr ? 0.16 : 1; m.depthWrite = !xr; }
    m.clippingPlanes = (cut && p.clip) ? [cutPlane] : null;
    if (isScreen) m.transparent = false;
    m.needsUpdate = true;
  }
}
['xray', 'cut'].forEach(id => $('#' + id).addEventListener('change', applyMaterials));
let autoRotate = false;
$('#b-rotate').addEventListener('click', e => { autoRotate = !autoRotate; e.currentTarget.classList.toggle('on', autoRotate); });
$('#b-reset').addEventListener('click', () => { camera.position.set(4.5, 3.2, 8.5); controls.target.set(0, 0, 0); autoFrame = true; });
controls.addEventListener('start', () => { autoFrame = false; });

// tabs (info)
function setITab(t) { $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.itab === t)); $$('.itab').forEach(d => d.classList.toggle('active', d.id === 'itab-' + t)); }
$$('.tab').forEach(b => b.addEventListener('click', () => setITab(b.dataset.itab)));
// mobile tabs
const app = $('#app');
function setMTab(m) {
  if (m === 'hide') { app.classList.toggle('collapsed'); $('#m-collapse').textContent = app.classList.contains('collapsed') ? '▴' : '▾'; setTimeout(resize, 30); return; }
  app.classList.remove('collapsed'); $('#m-collapse').textContent = '▾';
  $$('.mtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  $$('.panel').forEach(p => p.classList.toggle('m-active', p.dataset.tab === m));
  setTimeout(resize, 30);
}
$$('.mtabs button').forEach(b => b.addEventListener('click', () => setMTab(b.dataset.m)));
setMTab('ctrl');

// sources & system
$('#sources').innerHTML = `<p class="note" style="margin-bottom:10px">Bileşen adları, çalışma prensipleri ve nominal değerler aşağıdaki açık kaynaklara dayanır. Kaynakta bulunmayan sayılar (devir, akım, sıcaklık, arıza tepkileri) <b>temsili / eğitim amaçlıdır</b>. Resmî bakım için yalnızca ilgili T.O. / CMM kullanılmalıdır.</p><ol>${SOURCES.map(s => `<li id="src-${s.id}"><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a><span class="kind">${s.kind}</span><span class="why">${s.why}</span></li>`).join('')}</ol>`;
$('#system').innerHTML = SYSTEM_HTML;
document.addEventListener('click', e => {
  const a = e.target.closest('.srcref'); if (!a) return; e.preventDefault();
  setITab('src'); if (matchMedia('(max-width:860px)').matches) setMTab('info');
  const li = $('#src-' + a.dataset.src); if (li) { $$('#sources li').forEach(x => x.classList.remove('hl')); li.classList.add('hl'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
});

// parts list & selection
let selected = null;
$('#partlist').innerHTML = ORDER.map((id, i) => `<li data-id="${id}"><span class="n">${String(i + 1).padStart(2, '0')}</span>${PARTS[id].tr}<span class="e">${PARTS[id].en.split(' (')[0]}</span></li>`).join('');
$$('#partlist li').forEach(li => li.addEventListener('click', () => { select(li.dataset.id); setITab('part'); }));
function select(id) {
  if (selected) for (const m of parts[selected].mats) { m.emissive?.setHex(0x000000); m.emissiveIntensity = 1; }
  selected = id && parts[id] ? id : null;
  $$('#partlist li').forEach(li => li.classList.toggle('sel', li.dataset.id === selected));
  const card = $('#partcard');
  if (!selected) { card.className = 'partcard empty'; card.innerHTML = 'Bir parçaya tıklayın veya <b>Liste</b> sekmesinden seçin.'; return; }
  for (const m of parts[selected].mats) { m.emissive?.setHex(0x0e7fa3); m.emissiveIntensity = 0.85; }
  const P = PARTS[selected];
  card.className = 'partcard';
  card.innerHTML = `<h4>${P.tr}<span class="conf ${P.conf}">${P.conf === 'c1' ? 'F-16 kaynağında' : 'tipik / temsili'}</span></h4><div class="en">${P.en}</div>
    <div class="k">Görevi</div><p>${P.f}</p>${P.d ? `<div class="k">Teknik not</div><p>${P.d}</p>` : ''}
    <div class="src">Kaynak: ${P.src.length ? P.src.map(ref).join(' ') + ' — ' + P.src.map(s => SOURCES.find(x => x.id === s).title.split(' — ')[0]).join('; ') : 'Genel mühendislik bilgisi; F-16’ya özgü açık kaynak bulunamadı (temsili).'}</div>`;
}
// picking
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let down = null;
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 7) return;
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const cut = $('#cut').checked;
  const hits = ray.intersectObjects(pickables, false).filter(h => {
    if (!h.object.visible) return false;
    const p = parts[h.object.userData.partId];
    if (cut && p.clip && h.point.z > 0) return false;
    if ($('#xray').checked && p.housing) return false;
    return true;
  });
  if (hits.length) { select(hits[0].object.userData.partId); setITab('part'); if (matchMedia('(max-width:860px)').matches && !app.classList.contains('collapsed')) setMTab('info'); }
  else select(null);
});

// labels
const labelBox = $('#viewport'); const labelEls = {};
for (const id of ORDER) { const d = document.createElement('div'); d.className = 'lbl'; d.textContent = PARTS[id].tr; d.style.display = 'none'; labelBox.appendChild(d); labelEls[id] = d; }
const tmpV = new THREE.Vector3();
function updateLabels() {
  const on = $('#labels').checked; const r = canvas.getBoundingClientRect();
  for (const id of ORDER) {
    const d = labelEls[id]; if (!on) { d.style.display = 'none'; continue; }
    tmpV.copy(parts[id].center).addScaledVector(parts[id].off, explodeT); pump.localToWorld(tmpV); tmpV.project(camera);
    if (tmpV.z > 1) { d.style.display = 'none'; continue; }
    d.style.display = 'block'; d.style.left = ((tmpV.x + 1) / 2 * r.width) + 'px'; d.style.top = ((1 - tmpV.y) / 2 * r.height) + 'px';
  }
}

// ---------------------------------------------------------------- layout / camera framing
let portrait = false;
function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  portrait = true; root.rotation.z = 0; // pompa ekseni her zaman dikey (tankta olduğu gibi)
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(canvas.parentElement);
resize();
const camDir = new THREE.Vector3();
function frame(dt) {
  if (!autoFrame) return;
  const t = explodeT;
  const half = lerp(3.9, 8.6 * E + 0.6, t);
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const need = portrait ? half / tanH : Math.max(half / (tanH * camera.aspect), 1.6 / tanH);
  const centerLocal = new THREE.Vector3(0, lerp(-0.45, 0.2, t), 0);
  const c = root.localToWorld(centerLocal.clone());
  controls.target.lerp(c, 1 - Math.exp(-dt * 4));
  camDir.subVectors(camera.position, controls.target); const d = camDir.length();
  camDir.setLength(lerp(d, need * lerp(1.04, 1.22, t), 1 - Math.exp(-dt * 4)));
  camera.position.copy(controls.target).add(camDir);
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock(); let spinA = 0; let frames = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  step(dt);
  explodeT += (explodeTarget - explodeT) * (1 - Math.exp(-dt * 5)); if (Math.abs(explodeTarget - explodeT) < 1e-4) explodeT = explodeTarget;
  const ease = explodeT * explodeT * (3 - 2 * explodeT);
  spinA += (S.rpm / 12000) * Math.PI * 2 * 2.2 * dt;
  for (const p of Object.values(parts)) {
    p.g.position.copy(p.off).multiplyScalar(ease);
    if (p.spin) p.g.rotation.y = -spinA;
  }
  // check valve flapper opens with flow
  parts.check.g.children.forEach((m, i) => { if (i < 2) m.rotation.y = 0; });
  // particles
  const showP = $('#flowfx').checked && explodeT < 0.03 && S.Q > 0.5;
  points.visible = showP;
  const seeInside = $('#xray').checked || $('#cut').checked;
  if (pMat.depthTest !== !seeInside) { pMat.depthTest = !seeInside; pMat.needsUpdate = true; }
  if (showP) {
    const sp = (S.Q / RATED_Q) * 0.32 * dt; const v = new THREE.Vector3();
    for (let i = 0; i < NP; i++) {
      const q = P[i]; q.s += sp * (0.85 + q.j * 0.3); if (q.s >= 1) { q.s -= 1; q.r0 = 0.08 + Math.random() * 0.32; q.ph = Math.random() * Math.PI * 2; }
      pathPoint(q, v); pPos[i * 3] = v.x; pPos[i * 3 + 1] = v.y; pPos[i * 3 + 2] = v.z;
      const bubble = S.cav && q.bub < 0.45 && q.s > 0.15 && q.s < 0.6;
      if (bubble) { pCol[i * 3] = 0.9; pCol[i * 3 + 1] = 0.95; pCol[i * 3 + 2] = 1; }
      else { pCol[i * 3] = 1.0; pCol[i * 3 + 1] = 0.72; pCol[i * 3 + 2] = 0.25; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    pMat.size = S.cav ? 0.065 : 0.05;
  }
  if (autoRotate) root.rotation.y += dt * 0.25;
  frame(dt);
  controls.update();
  renderer.render(scene, camera);
  if (frames % 3 === 0) { updateGauges(); updateAlerts(); }
  updateLabels();
  frames++;
  if (frames === 2) { $('#loading').style.display = 'none'; window.__F16.ready = true; }
  requestAnimationFrame(tick);
}

// URL params (paylaşım / test)
if (params.has('fault')) setFault(params.get('fault')); else setFault('none');
if (params.get('power') === '1') setPower(true);
if (params.has('xray')) { $('#xray').checked = true; }
if (params.has('cut')) { $('#cut').checked = true; }
if (params.has('labels')) { $('#labels').checked = true; }
applyMaterials();
if (params.has('explode')) setExplode(clamp(+params.get('explode') || 1, 0, 1), true);
if (params.has('select')) select(params.get('select'));
window.__F16 = { S, parts, setExplode, select, setPower, setFault, get explodeT() { return explodeT; }, ready: false, renderer };
tick();
