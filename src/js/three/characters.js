// Low-poly 3D crew. Each factory returns a Character: a THREE.Group with a face
// that can look around and blink, a hit proxy for picking, and a springy
// squash-and-stretch rig.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { INK, inked, toon } from './toon.js';

const PALETTE = {
  nyq: { body: '#2fbf71', deep: '#1f9356' },
  polly: { body: '#ff5d8f', deep: '#d93d6f' },
  ozzy: { body: '#3e8bff', deep: '#2566cc' },
  cubert: { body: '#ffc234', deep: '#d99a0b' },
};

const white = () => toon('#ffffff');
const ink = () => new THREE.MeshBasicMaterial({ color: INK });
const blush = () => new THREE.MeshBasicMaterial({ color: '#ff8fb0', transparent: true, opacity: 0.75 });

const eyeGeo = new THREE.IcosahedronGeometry(0.105, 1);
const pupilGeo = new THREE.IcosahedronGeometry(0.052, 1);
const shineGeo = new THREE.IcosahedronGeometry(0.016, 0);
const cheekGeo = new THREE.CircleGeometry(0.06, 7);
const smileGeo = new THREE.TorusGeometry(0.075, 0.02, 4, 10, Math.PI);
const limbGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
const footGeo = new THREE.IcosahedronGeometry(0.085, 0);

function extrude(points, depth, bevel = 0.07) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Face: two eyes with pupils, cheeks, smile. Placed at `z` facing +z. */
function buildFace({ z, x = 0, y = 0, gap = 0.17, scale = 1 }) {
  const face = new THREE.Group();
  face.position.set(x, y, z);
  face.scale.setScalar(scale);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set((side * gap) / 2, 0.03, 0);
    const white_ = inked(eyeGeo, white(), 0.018);
    white_.scale.z = 0.6;
    const pupil = new THREE.Mesh(pupilGeo, ink());
    pupil.position.z = 0.07;
    const shine = new THREE.Mesh(shineGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    shine.position.set(0.018, 0.02, 0.05);
    pupil.add(shine);
    eye.add(white_, pupil);
    eye.userData.pupil = pupil;
    face.add(eye);
    eyes.push(eye);
  }
  const smile = new THREE.Mesh(smileGeo, ink());
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.13, 0.01);
  face.add(smile);
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeo, blush());
    cheek.position.set(side * (gap / 2 + 0.11), -0.1, 0.005);
    cheek.scale.y = 0.65;
    face.add(cheek);
  }
  return { face, eyes, smile };
}

function limb(from, to, material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const m = inked(limbGeo, material, 0.018);
  m.scale.set(1, len, 1);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

class Character extends THREE.Group {
  constructor(id, { radius, height }) {
    super();
    this.name = id;
    this.kind = id;
    this.radius = radius; // collision + proxy size
    this.height = height; // distance from origin down to feet
    this.rig = new THREE.Group(); // squash/stretch + spin happen here
    this.add(this.rig);
    this.body = new THREE.Group();
    this.rig.add(this.body);

    const proxy = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.character = this;
    this.proxy = proxy;
    this.add(proxy);

    // springs
    this.squash = { x: 0, v: 0 };
    this.vel = new THREE.Vector3();
    this.spin = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3(0, 0, 10);
    this.blinkAt = 1 + Math.random() * 3;
    this.phase = Math.random() * Math.PI * 2;
    this.mood = 'happy';
  }

  setFace({ face, eyes, smile }) {
    this.face = face;
    this.eyes = eyes;
    this.smile = smile;
    this.body.add(face);
  }

  /** Impulse into the squash spring (positive = squash flat). */
  boing(amount = 0.35) {
    this.squash.v -= amount * 9;
  }

  update(dt, t) {
    // squash spring (critically-ish damped)
    const s = this.squash;
    s.v += (-160 * s.x - 9 * s.v) * dt;
    s.x += s.v * dt;
    const k = THREE.MathUtils.clamp(s.x, -0.45, 0.45);
    this.rig.scale.set(1 + k * 0.6, 1 - k, 1 + k * 0.6);
    this.rig.position.y = -this.height * k; // keep feet planted while squashing

    // eyes look toward target
    if (this.eyes) {
      const local = this.face.worldToLocal(_v.copy(this.lookTarget));
      local.normalize();
      for (const eye of this.eyes) {
        const p = eye.userData.pupil;
        p.position.x = THREE.MathUtils.clamp(local.x * 0.06, -0.045, 0.045);
        p.position.y = THREE.MathUtils.clamp(local.y * 0.06, -0.04, 0.04);
      }
      // blink
      this.blinkAt -= dt;
      const blinking = this.blinkAt < 0.12 && this.blinkAt > 0;
      for (const eye of this.eyes) eye.scale.y = blinking ? 0.12 : 1;
      if (this.blinkAt <= 0) this.blinkAt = 2 + Math.random() * 4;
    }
    if (this.smile) {
      const wow = this.mood === 'wow';
      this.smile.scale.set(wow ? 0.6 : 1, wow ? 1.6 : 1, 1);
      this.smile.rotation.z = this.mood === 'sad' ? 0 : Math.PI;
    }
    if (this.idle) this.idle(dt, t);
  }
}

const _v = new THREE.Vector3();

/* ------------------------------------------------------------------ Nyq */
export function makeNyq() {
  const c = new Character('nyq', { radius: 0.75, height: 0.97 });
  const mat = toon(PALETTE.nyq.body);
  const deep = toon(PALETTE.nyq.deep);
  const body = inked(extrude([[-0.62, -0.72], [0.78, 0], [-0.62, 0.72]], 0.42, 0.09), mat, 0.04);
  c.body.add(body);
  // input pins (arms) with + and − nubs, output pin (nose)
  c.body.add(limb([-0.7, 0.32, 0], [-0.98, 0.32, 0], deep));
  c.body.add(limb([-0.7, -0.32, 0], [-0.98, -0.32, 0], deep));
  c.body.add(limb([0.85, 0, 0], [1.08, 0, 0], deep));
  const plus = new THREE.Group();
  const bar = new THREE.BoxGeometry(0.12, 0.03, 0.03);
  const pA = new THREE.Mesh(bar, ink());
  const pB = new THREE.Mesh(bar, ink());
  pB.rotation.z = Math.PI / 2;
  plus.add(pA, pB);
  plus.position.set(-0.47, 0.3, 0.31);
  const minus = new THREE.Mesh(bar, ink());
  minus.position.set(-0.47, -0.3, 0.31);
  c.body.add(plus, minus);
  // legs
  c.body.add(limb([-0.42, -0.5, 0], [-0.42, -0.88, 0], deep));
  c.body.add(limb([-0.12, -0.38, 0], [-0.12, -0.88, 0], deep));
  for (const x of [-0.42, -0.12]) {
    const f = inked(footGeo, deep, 0.02);
    f.position.set(x + 0.03, -0.9, 0.03);
    f.scale.set(1.3, 0.6, 1.4);
    c.body.add(f);
  }
  c.setFace(buildFace({ z: 0.31, x: -0.2, y: 0.05, gap: 0.2 }));
  c.idle = (dt, t) => {
    c.body.rotation.z = Math.sin(t * 1.6 + c.phase) * 0.04;
  };
  return c;
}

/* ---------------------------------------------------------------- Polly */
export function makePolly() {
  const c = new Character('polly', { radius: 0.7, height: 0.8 });
  const s = 0.68;
  const pts = [
    [-0.44, 0.7], [0, 0.26], [0.44, 0.7], [0.7, 0.44], [0.26, 0], [0.7, -0.44],
    [0.44, -0.7], [0, -0.26], [-0.44, -0.7], [-0.7, -0.44], [-0.26, 0], [-0.7, 0.44],
  ].map(([x, y]) => [x * s * 1.45, y * s * 1.45]);
  const body = inked(extrude(pts, 0.36, 0.08), toon(PALETTE.polly.body), 0.04);
  c.body.add(body);
  c.setFace(buildFace({ z: 0.27, y: 0.0, gap: 0.19, scale: 0.95 }));
  c.instability = 0; // grows when she is poked a lot
  c.idle = (dt, t) => {
    const wobble = 0.05 + c.instability * 0.5;
    c.body.rotation.z = Math.sin(t * (2.4 + c.instability * 6) + c.phase) * wobble * (1 + c.instability * 2);
    c.instability = Math.max(0, c.instability - dt * 0.12);
  };
  return c;
}

/* ----------------------------------------------------------------- Ozzy */
export function makeOzzy() {
  const c = new Character('ozzy', { radius: 0.66, height: 0.69 });
  const geo = new THREE.IcosahedronGeometry(0.64, 1);
  const body = inked(geo, toon(PALETTE.ozzy.body), 0.04);
  c.body.add(body);
  // little feet
  for (const x of [-0.22, 0.22]) {
    const f = inked(footGeo, toon(PALETTE.ozzy.deep), 0.02);
    f.position.set(x, -0.6, 0.12);
    f.scale.set(1.4, 0.6, 1.5);
    c.body.add(f);
  }
  c.setFace(buildFace({ z: 0.56, y: 0.06, gap: 0.21 }));
  c.idle = (dt, t) => {
    c.body.rotation.y = Math.sin(t * 0.9 + c.phase) * 0.12;
  };
  return c;
}

/* --------------------------------------------------------------- Cubert */
export function makeCubert() {
  const c = new Character('cubert', { radius: 0.66, height: 0.64 });
  const body = inked(new RoundedBoxGeometry(1.08, 1.08, 1.08, 1, 0.12), toon(PALETTE.cubert.body), 0.04);
  body.position.y = -0.08;
  c.body.add(body);
  // pencil tucked on top
  const pencil = new THREE.Group();
  const shaft = inked(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 6), toon('#ff8a1e'), 0.018);
  const tip = inked(new THREE.ConeGeometry(0.06, 0.15, 6), toon('#f3d7a6'), 0.018);
  tip.position.y = 0.38;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 6), ink());
  lead.position.y = 0.46;
  const eraser = inked(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 6), toon('#ff8fb0'), 0.018);
  eraser.position.y = -0.35;
  pencil.add(shaft, tip, lead, eraser);
  pencil.rotation.z = -1.25;
  pencil.position.set(0.06, 0.55, -0.1);
  c.body.add(pencil);
  c.pencil = pencil;
  c.setFace(buildFace({ z: 0.565, y: -0.02, gap: 0.22 }));
  c.idle = (dt, t) => {
    c.pencil.rotation.z = -1.25 + Math.sin(t * 2 + c.phase) * 0.05;
  };
  return c;
}

export const makers = { nyq: makeNyq, polly: makePolly, ozzy: makeOzzy, cubert: makeCubert };
export { Character };
