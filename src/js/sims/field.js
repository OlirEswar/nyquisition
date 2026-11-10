// Electric field lines from draggable point charges.

import { COLORS, arrowHead, label, sketchCanvas, wobblyLine } from './pencil.js';

const START = () => [
  { x: 0.33, y: 0.5, q: 1 },
  { x: 0.67, y: 0.5, q: -1 },
];

export function initField(root) {
  const canvas = root.querySelector('canvas');
  let charges = START();
  let drag = null;
  let state;

  function E(px, py, w, h) {
    let ex = 0;
    let ey = 0;
    for (const c of charges) {
      const dx = px - c.x * w;
      const dy = py - c.y * h;
      const r2 = dx * dx + dy * dy + 30;
      const r = Math.sqrt(r2);
      const k = c.q / (r2 * r);
      ex += k * dx;
      ey += k * dy;
    }
    return [ex, ey];
  }

  const draw = (s) => {
    const { ctx, w, h } = s;
    ctx.clearRect(0, 0, w, h);
    const pos = charges.filter((c) => c.q > 0);
    const seeds = pos.length ? pos : charges; // if all negative, trace backwards from them
    const dir = pos.length ? 1 : -1;
    const lines = 16;
    seeds.forEach((c, ci) => {
      for (let i = 0; i < lines; i++) {
        const a = (i / lines) * Math.PI * 2 + ci * 0.2;
        let x = c.x * w + Math.cos(a) * 14;
        let y = c.y * h + Math.sin(a) * 14;
        const pts = [[x, y]];
        let arrowAt = null;
        for (let n = 0; n < 420; n++) {
          const [ex, ey] = E(x, y, w, h);
          const m = Math.hypot(ex, ey) || 1;
          x += (dir * ex * 4) / m;
          y += (dir * ey * 4) / m;
          if (x < -10 || y < -10 || x > w + 10 || y > h + 10) break;
          pts.push([x, y]);
          if (n === 26) arrowAt = { x, y, a: Math.atan2(dir * ey, dir * ex) };
          if (charges.some((o) => o.q * dir < 0 && Math.hypot(o.x * w - x, o.y * h - y) < 12)) break;
        }
        wobblyLine(ctx, pts, { color: 'rgba(45,42,62,.55)', width: 1.5, seed: i * 13 + ci * 101, jitter: 0.4 });
        if (arrowAt) arrowHead(ctx, arrowAt.x, arrowAt.y, arrowAt.a, { size: 6, width: 1.6, color: 'rgba(45,42,62,.7)' });
      }
    });
    for (const c of charges) {
      const x = c.x * w;
      const y = c.y * h;
      ctx.save();
      ctx.fillStyle = c.q > 0 ? COLORS.polly : COLORS.ozzy;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // octagon, low-poly
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      label(ctx, c.q > 0 ? '+' : '−', x, y + 1, { align: 'center', base: 'middle', size: 20, color: '#fff', font: 'ui' });
    }
    label(ctx, 'drag the charges', 12, h - 12, { color: COLORS.soft, size: 13 });
  };

  state = sketchCanvas(canvas, draw);
  const redraw = () => draw(state);

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r };
  };
  const find = (p) =>
    charges.find((c) => Math.hypot((c.x - p.x) * p.r.width, (c.y - p.y) * p.r.height) < 22);

  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e);
    drag = find(p);
    if (drag) {
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (drag) {
      drag.x = Math.min(0.96, Math.max(0.04, p.x));
      drag.y = Math.min(0.94, Math.max(0.06, p.y));
      redraw();
    } else canvas.style.cursor = find(p) ? 'grab' : '';
  });
  canvas.addEventListener('pointerup', () => (drag = null));
  canvas.addEventListener('dblclick', (e) => {
    const c = find(local(e));
    if (c && charges.length > 1) {
      charges = charges.filter((o) => o !== c);
      redraw();
    }
  });

  root.querySelectorAll('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      if (charges.length >= 6) return;
      charges.push({ x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6, q: Number(b.dataset.add) });
      redraw();
    }),
  );
  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    charges = START();
    redraw();
  });

  // keyboard: arrow keys move the most recently added charge
  canvas.addEventListener('keydown', (e) => {
    const c = charges[charges.length - 1];
    const d = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] }[e.key];
    if (!d) return;
    e.preventDefault();
    c.x = Math.min(0.96, Math.max(0.04, c.x + d[0]));
    c.y = Math.min(0.94, Math.max(0.06, c.y + d[1]));
    redraw();
  });
}
