// Second-order step response + its poles on the s-plane (drawn as Polly ×'s).

import { COLORS, axes, cross, label, sketchCanvas, stroke, wobblyLine } from './pencil.js';

const T_END = 12;

export function response(zeta, wn, n = 360) {
  // integrate y'' + 2ζω y' + ω² y = ω² (unit step) with RK4
  const dt = T_END / n;
  let y = 0;
  let v = 0;
  const pts = [[0, 0]];
  const f = (yy, vv) => [vv, wn * wn * (1 - yy) - 2 * zeta * wn * vv];
  for (let i = 1; i <= n; i++) {
    const k1 = f(y, v);
    const k2 = f(y + (k1[0] * dt) / 2, v + (k1[1] * dt) / 2);
    const k3 = f(y + (k2[0] * dt) / 2, v + (k2[1] * dt) / 2);
    const k4 = f(y + k3[0] * dt, v + k3[1] * dt);
    y += ((k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt) / 6;
    v += ((k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt) / 6;
    pts.push([i * dt, y]);
  }
  return pts;
}

export function metrics(pts) {
  const peak = Math.max(...pts.map((p) => p[1]));
  const overshoot = Math.max(0, (peak - 1) * 100);
  let settle = null;
  for (let i = pts.length - 1; i >= 0; i--) {
    if (Math.abs(pts[i][1] - 1) > 0.02) {
      settle = i === pts.length - 1 ? null : pts[i + 1][0];
      break;
    }
  }
  const rise = pts.find((p) => p[1] >= 0.9)?.[0] ?? null;
  return { overshoot, settle, rise };
}

export function initStep(root) {
  const plot = root.querySelector('[data-step-plot]');
  const splane = root.querySelector('[data-splane]');
  const zIn = root.querySelector('[data-zeta]');
  const wIn = root.querySelector('[data-wn]');
  const out = {
    zeta: root.querySelector('[data-out-zeta]'),
    wn: root.querySelector('[data-out-wn]'),
    os: root.querySelector('[data-out-os]'),
    ts: root.querySelector('[data-out-ts]'),
    verdict: root.querySelector('[data-out-verdict]'),
  };

  const params = () => ({ zeta: Number(zIn.value) / 100, wn: Number(wIn.value) / 10 });

  const drawPlot = ({ ctx, w, h }) => {
    ctx.clearRect(0, 0, w, h);
    const { zeta, wn } = params();
    const pad = { l: 34, r: 16, t: 22, b: 30 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;
    const yMax = 1.8;
    const X = (t) => pad.l + (t / T_END) * pw;
    const Y = (y) => pad.t + (1 - y / yMax) * ph;
    stroke(ctx, pad.l, Y(1), pad.l + pw, Y(1), { color: COLORS.soft, width: 1.3, dash: [4, 6], seed: 2 });
    label(ctx, 'target', pad.l + pw, Y(1) - 6, { align: 'right', color: COLORS.soft, size: 13 });
    axes(ctx, { x: pad.l, y: pad.t, w: pw, h: ph, xLabel: 't (s)', yLabel: 'y(t)' });
    const pts = response(zeta, wn);
    wobblyLine(
      ctx,
      pts.map(([t, y]) => [X(t), Y(Math.min(y, yMax))]),
      { color: COLORS.nyq, width: 3.2, seed: 9, passes: 2, jitter: 0.5 },
    );
    const m = metrics(pts);
    if (m.overshoot > 0.5) {
      const peak = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
      label(ctx, `peak ${m.overshoot.toFixed(0)}% over`, X(peak[0]) + 8, Y(Math.min(peak[1], yMax)) - 6, { size: 13, color: '#1f9356' });
    }
    out.os.textContent = `${m.overshoot.toFixed(0)}%`;
    out.ts.textContent = m.settle == null ? '> 12 s' : `${m.settle.toFixed(1)} s`;
    out.zeta.textContent = zeta.toFixed(2);
    out.wn.textContent = `${wn.toFixed(1)} rad/s`;
    out.verdict.textContent =
      zeta < 0.4 ? 'Underdamped: fast, but it rings.' : zeta < 0.95 ? 'Nicely damped: quick with a small overshoot.' : zeta < 1.05 ? 'Critically damped: fastest with no overshoot.' : 'Overdamped: no overshoot, but sluggish.';
  };

  const drawS = ({ ctx, w, h }) => {
    ctx.clearRect(0, 0, w, h);
    const { zeta, wn } = params();
    const cx = w * 0.72;
    const cy = h / 2;
    const scale = Math.min(w, h) / 9;
    stroke(ctx, 8, cy, w - 8, cy, { color: COLORS.soft, width: 1.6, seed: 4 });
    stroke(ctx, cx, h - 6, cx, 6, { color: COLORS.soft, width: 1.6, seed: 8 });
    label(ctx, 'Re', w - 10, cy + 16, { align: 'right', color: COLORS.soft, size: 12 });
    label(ctx, 'Im', cx + 6, 16, { color: COLORS.soft, size: 12 });
    // ωn circle, dashed
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(141,136,163,.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, wn * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    let poles;
    if (zeta < 1) {
      const re = -zeta * wn;
      const im = wn * Math.sqrt(1 - zeta * zeta);
      poles = [
        [re, im],
        [re, -im],
      ];
    } else {
      const r = wn * Math.sqrt(zeta * zeta - 1);
      poles = [
        [-zeta * wn + r, 0],
        [-zeta * wn - r, 0],
      ];
    }
    for (const [re, im] of poles) {
      const x = Math.max(6, cx + re * scale);
      cross(ctx, x, cy - im * scale, { size: 6 });
    }
    label(ctx, 'poles', 10, 18, { color: '#d93d6f', size: 13 });
  };

  const a = sketchCanvas(plot, drawPlot);
  const b = sketchCanvas(splane, drawS);
  const redraw = () => {
    drawPlot(a);
    drawS(b);
  };
  zIn.addEventListener('input', redraw);
  wIn.addEventListener('input', redraw);
  root.querySelectorAll('[data-preset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const [z, w] = btn.dataset.preset.split(',').map(Number);
      zIn.value = z;
      wIn.value = w;
      redraw();
    }),
  );
}
