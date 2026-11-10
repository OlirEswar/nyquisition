// Forgetting curve: one cram session vs. reviews scheduled right before
// predicted recall drops below the target.

import { COLORS, axes, drawIn, label, sketchCanvas, stroke, wobblyLine } from './pencil.js';

const DAYS = 30;
const TARGET = 0.8;

/** difficulty 0 (easy) … 1 (brutal) */
export function schedule(difficulty) {
  const s0 = 4.2 - difficulty * 2.6; // initial stability, days
  const growth = 2.4 - difficulty * 0.8;
  const floor = 0.3 - difficulty * 0.22;
  const reviews = [];
  let S = s0;
  let last = 0;
  // retention R = exp(-(t-last)/S). Review when R hits TARGET.
  while (true) {
    const next = last + -Math.log(TARGET) * S;
    if (next > DAYS) break;
    reviews.push(next);
    last = next;
    S *= growth;
  }
  const curve = (t, spaced) => {
    // a single cram leaves a little long-term residue; it doesn't go to zero
    if (!spaced) return floor + (1 - floor) * Math.exp(-t / s0);
    let S2 = s0;
    let l = 0;
    for (const r of reviews) {
      if (t < r) break;
      l = r;
      S2 *= growth;
    }
    return Math.exp(-(t - l) / S2);
  };
  return { reviews, curve, s0 };
}

export function initForget(root) {
  const canvas = root.querySelector('canvas');
  const slider = root.querySelector('[data-difficulty]');
  const toggles = root.querySelectorAll('[data-mode]');
  const out = {
    cram: root.querySelector('[data-out-cram]'),
    spaced: root.querySelector('[data-out-spaced]'),
    reviews: root.querySelector('[data-out-reviews]'),
    difficulty: root.querySelector('[data-out-difficulty]'),
  };
  let mode = 'both';
  let progress = 0;
  const NAMES = ['Easy', 'Fair', 'Tricky', 'Hard', 'Brutal'];

  const draw = ({ ctx, w, h }) => {
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 46, r: 22, t: 26, b: 30 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;
    const X = (d) => pad.l + (d / DAYS) * pw;
    const Y = (r) => pad.t + (1 - r / 1.14) * ph;
    const diff = Number(slider.value) / 100;
    const { reviews, curve } = schedule(diff);

    // target band
    ctx.save();
    ctx.fillStyle = 'rgba(47,191,113,.08)';
    ctx.fillRect(pad.l, Y(1), pw, Y(TARGET) - Y(1));
    ctx.fillStyle = 'rgba(141,136,163,.25)';
    ctx.restore();
    stroke(ctx, pad.l, Y(TARGET), pad.l + pw, Y(TARGET), { color: COLORS.nyq, width: 1.4, dash: [5, 6], seed: 11 });
    label(ctx, 'stay above here', pad.l + pw - 4, Y(TARGET) + 16, { align: 'right', color: '#1f9356', size: 13 });

    for (let d = 0; d <= DAYS; d += 5) {
      label(ctx, String(d), X(d), pad.t + ph + 18, { align: 'center', color: COLORS.soft, size: 12, font: 'ui' });
    }
    for (const r of [0, 0.5, 1]) {
      label(ctx, `${r * 100}%`, pad.l - 8, Y(r) + 4, { align: 'right', color: COLORS.soft, size: 12, font: 'ui' });
    }
    axes(ctx, { x: pad.l, y: pad.t, w: pw, h: ph, xLabel: 'days', yLabel: 'what you remember' });

    const until = DAYS * progress;
    const sample = (spaced) => {
      const pts = [];
      const step = 0.08;
      for (let t = 0; t <= until + 1e-6; t += step) {
        // insert vertical jump exactly at reviews for crisp sawtooth
        const r = spaced ? reviews.find((rv) => rv > t - step && rv <= t) : undefined;
        if (r !== undefined) {
          pts.push([X(r), Y(curve(r - 1e-4, spaced))]);
          pts.push([X(r), Y(curve(r + 1e-4, spaced))]);
        }
        pts.push([X(t), Y(curve(t, spaced))]);
      }
      return pts;
    };
    if (mode !== 'spaced') wobblyLine(ctx, sample(false), { color: COLORS.polly, width: 3, seed: 21, passes: 2 });
    if (mode !== 'cram') {
      wobblyLine(ctx, sample(true), { color: COLORS.ozzy, width: 3, seed: 5, passes: 2 });
      for (const r of reviews) {
        if (r > until) continue;
        const x = X(r);
        const y = Y(1);
        ctx.save();
        ctx.fillStyle = COLORS.cubert;
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (reviews.length && progress > 0.2) label(ctx, 'quiz', X(reviews[0]) + 10, Y(1) + 5, { size: 13 });
    }

    const day30Cram = Math.round(curve(DAYS, false) * 100);
    const day30Spaced = Math.round(curve(DAYS, true) * 100);
    out.cram.textContent = `${day30Cram}%`;
    out.spaced.textContent = `${day30Spaced}%`;
    out.reviews.textContent = String(reviews.length);
    out.difficulty.textContent = NAMES[Math.min(4, Math.floor(diff * 5))];
  };

  const sketch = sketchCanvas(canvas, draw);
  const redraw = () => draw(sketch);
  slider.addEventListener('input', redraw);
  toggles.forEach((b) =>
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      toggles.forEach((t) => t.setAttribute('aria-pressed', String(t === b)));
      redraw();
    }),
  );
  drawIn(canvas, (k) => {
    progress = k;
    redraw();
  });
}
