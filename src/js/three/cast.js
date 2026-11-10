// Meet-the-crew: each character on a low-poly pedestal. Click to select,
// drag to spin the selected one.

import * as THREE from 'three';
import { Stage } from './stage.js';
import { makers } from './characters.js';
import { blobShadow, inked, paperLights, toon } from './toon.js';

const IDS = ['nyq', 'polly', 'ozzy', 'cubert'];
const TINT = { nyq: '#d9f5e3', polly: '#ffe0ea', ozzy: '#dbe9ff', cubert: '#fff1c7' };

export function initCast(canvas, { onSelect } = {}) {
  let selected = 0;
  let spinVel = 0;
  let drag = null;
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();

  const stage = new Stage(canvas, {
    fov: 28,
    onResize: () => layout(),
    onFrame: (dt, t) => step(dt, t),
  });
  const { scene, camera } = stage;
  camera.position.set(0, 2.4, 9.5);
  camera.lookAt(0, 1, 0);
  paperLights(scene);

  const slots = IDS.map((id, i) => {
    const g = new THREE.Group();
    const ped = inked(new THREE.CylinderGeometry(0.85, 0.95, 0.42, 6), toon(TINT[id]), 0.03);
    ped.position.y = 0.21;
    const top = inked(new THREE.CylinderGeometry(0.78, 0.85, 0.08, 6), toon('#fffbef'), 0.02);
    top.position.y = 0.46;
    const c = makers[id]();
    c.position.y = 0.5 + c.height;
    c.proxy.userData.slot = i;
    const sh = blobShadow(2.4, 0.16);
    sh.position.y = 0.001;
    g.add(sh, ped, top, c);
    g.userData = { c, baseY: 0, lift: 0, spin: 0 };
    scene.add(g);
    return g;
  });

  function layout() {
    const w = stage.viewWidthAt(9.5);
    const gap = Math.min(2.6, (w - 1.2) / 4);
    slots.forEach((g, i) => {
      g.position.x = (i - 1.5) * gap;
      g.scale.setScalar(Math.min(1, gap / 2.2));
    });
  }

  function select(i, fromUser = true) {
    if (i === selected && fromUser) {
      const c = slots[i].userData.c;
      c.boing(0.4);
      slots[i].userData.spin += Math.PI * 2;
      return;
    }
    selected = i;
    const c = slots[i].userData.c;
    c.boing(0.45);
    c.mood = 'wow';
    setTimeout(() => (c.mood = 'happy'), 650);
    onSelect?.(IDS[i], fromUser);
  }

  function step(dt, t) {
    slots.forEach((g, i) => {
      const u = g.userData;
      const on = i === selected;
      u.lift += ((on ? 0.45 : 0) - u.lift) * (1 - Math.exp(-dt * 8));
      const c = u.c;
      c.position.y = 0.5 + c.height + u.lift + (on && !stage.reduced ? Math.sin(t * 2.2) * 0.06 : 0);
      if (on) {
        if (!drag) {
          spinVel *= Math.exp(-dt * 2.5);
          u.spin += spinVel * dt;
        }
      }
      // settle each character's spin toward the nearest front-facing angle
      const targetSpin = on && (drag || Math.abs(spinVel) > 0.3) ? u.spin : Math.round(u.spin / (Math.PI * 2)) * Math.PI * 2;
      if (!drag || !on) u.spin += (targetSpin - u.spin) * (1 - Math.exp(-dt * (on ? 2.5 : 5)));
      c.rotation.y = u.spin + (on ? 0 : (i - selected) * -0.18);
      c.lookTarget.copy(camera.position);
      if (!on) c.lookTarget.set(slots[selected].position.x, 1.5, 3);
      c.update(dt, stage.reduced ? 0 : t);
    });
  }

  function hit(e) {
    stage.ndc(e, _ndc);
    _ray.setFromCamera(_ndc, camera);
    const h = _ray.intersectObjects(
      slots.map((g) => g.userData.c.proxy),
      false,
    )[0];
    return h ? h.object.userData.slot : -1;
  }

  canvas.addEventListener('pointerdown', (e) => {
    const i = hit(e);
    drag = { x: e.clientX, last: e.clientX, t: performance.now(), i, moved: false };
    if (i === selected) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.last;
      drag.last = e.clientX;
      if (Math.abs(e.clientX - drag.x) > 5) drag.moved = true;
      if (drag.moved && drag.i === selected) {
        slots[selected].userData.spin += dx * 0.012;
        spinVel = dx * 0.012 * 60;
      }
      return;
    }
    canvas.style.cursor = hit(e) >= 0 ? 'pointer' : '';
  });
  const end = () => {
    if (drag && !drag.moved && drag.i >= 0) select(drag.i);
    drag = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => (drag = null));

  layout();
  return { stage, select: (id) => select(IDS.indexOf(id), false), spin: () => (spinVel = 9) };
}
