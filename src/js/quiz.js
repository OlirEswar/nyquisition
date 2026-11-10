// A real, playable sample lesson: select → Check → feedback → Continue.
// Wrong answers get "saved to your notes" by Cubert, like in the app.

import { crew } from './crew.js';
import { confetti, toast } from './toast.js';
import { get, set } from './store.js';

const QUESTIONS = [
  {
    type: 'splane',
    prompt: 'Tap where the pole of this system sits.',
    math: 'G(s) = 1 / (s + 2)',
    answer: -2,
    explain: 'The pole is where the denominator is zero: s + 2 = 0, so s = −2. It sits in the left half-plane, so the system is stable.',
    note: 'Poles are the roots of the denominator. Left half-plane means stable.',
  },
  {
    type: 'choice',
    prompt: 'You raise the damping ratio ζ and keep ωₙ the same. What happens to the overshoot?',
    options: ['It goes up', 'It goes down', 'It stays the same', 'It becomes infinite'],
    answer: 1,
    explain: 'More damping pulls the poles toward the real axis, so the response rings less. At ζ ≥ 1 there is no overshoot at all.',
    note: 'Overshoot depends only on ζ: %OS = e^(−ζπ/√(1−ζ²)) × 100.',
  },
  {
    type: 'choice',
    prompt: 'Gauss’s law says the electric flux through a closed surface depends only on…',
    options: ['The surface’s area', 'The charge enclosed', 'Every charge nearby', 'The surface’s shape'],
    answer: 1,
    explain: 'Φ = Q_enc / ε₀. Charges outside the surface send in as much flux as they let out, so they cancel.',
    note: 'Gauss: ∮E·dA = Q_enc/ε₀. Outside charges contribute zero net flux.',
  },
];

const heart = (full) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3.1 4 7 4c2.1 0 3.6 1.1 5 3 1.4-1.9 2.9-3 5-3 3.9 0 6.1 4.2 4.6 7.7C19.5 16.4 12 21 12 21z" fill="${full ? '#ff5d8f' : '#e6d6aa'}" stroke="#2d2a3e" stroke-width="2" stroke-linejoin="round"/></svg>`;

export function initQuiz(root) {
  let i = 0;
  let hearts = 3;
  let xp = 0;
  let picked = null;
  let checked = false;
  let mistakes = [];

  function header() {
    const pct = Math.round((i / QUESTIONS.length) * 100);
    return `
      <div class="quiz__top">
        <div class="progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="progress__bar" style="--value:${Math.max(4, pct)}%"></div>
        </div>
        <div class="quiz__hearts" aria-label="${hearts} hearts left">${[0, 1, 2].map((k) => heart(k < hearts)).join('')}</div>
      </div>`;
  }

  function splane(q) {
    const pts = [-3, -2, -1, 0, 1, 2, 3];
    return `
      <div class="splane" role="radiogroup" aria-label="Points on the real axis">
        <svg class="splane__axes" viewBox="0 0 320 160" aria-hidden="true">
          <path d="M10 80 H310 M160 150 V10" stroke="#8d88a3" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M302 74 l8 6 -8 6 M154 18 l6 -8 6 8" stroke="#8d88a3" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="306" y="68" text-anchor="end" font-family="Architects Daughter" font-size="14" fill="#8d88a3">Re</text>
          <text x="168" y="22" font-family="Architects Daughter" font-size="14" fill="#8d88a3">Im</text>
          <rect x="10" y="10" width="150" height="140" fill="rgba(47,191,113,.07)"/>
          <text x="18" y="142" font-family="Architects Daughter" font-size="13" fill="#1f9356">stable side</text>
        </svg>
        ${pts
          .map(
            (p) => `<button type="button" class="splane__pt" role="radio" aria-checked="${picked === p}" style="--x:${((p + 3.5) / 7) * 100}%" data-pick="${p}">
              <span class="visually-hidden">s = ${p}</span><span aria-hidden="true" class="splane__label">${p}</span>
            </button>`,
          )
          .join('')}
      </div>`;
  }

  function body() {
    const q = QUESTIONS[i];
    const opts =
      q.type === 'splane'
        ? splane(q)
        : `<div class="quiz__options" role="radiogroup" aria-labelledby="quiz-prompt">${q.options
            .map(
              (o, k) => `<button type="button" class="quiz__opt" role="radio" aria-checked="${picked === k}" data-pick="${k}">
                <kbd aria-hidden="true">${k + 1}</kbd><span>${o}</span></button>`,
            )
            .join('')}</div>`;
    return `
      <div class="quiz__q">
        <div class="quiz__asker">
          <div class="quiz__avatar">${crew[['nyq', 'polly', 'ozzy'][i % 3]]({ label: '' })}</div>
          <div class="quiz__bubble">
            <p id="quiz-prompt">${q.prompt}</p>
            ${q.math ? `<p class="quiz__math">${q.math}</p>` : ''}
          </div>
        </div>
        ${opts}
      </div>`;
  }

  function footer() {
    if (!checked) {
      return `<div class="quiz__foot">
        <button class="btn btn--ghost btn--sm" type="button" data-skip>Skip</button>
        <button class="btn" type="button" data-check ${picked === null ? 'disabled' : ''}>Check</button>
      </div>`;
    }
    const q = QUESTIONS[i];
    const right = picked === q.answer;
    return `<div class="quiz__foot quiz__foot--${right ? 'right' : 'wrong'}" role="status">
      <div class="quiz__verdict">
        <div class="quiz__verdict-face">${right ? crew.nyq({ mood: 'wink', label: '' }) : crew.cubert({ mood: 'sad', label: '' })}</div>
        <div>
          <strong>${right ? ['Nice!', 'Exactly.', 'Nailed it.'][i % 3] : 'Not quite'}</strong>
          <p>${q.explain}</p>
        </div>
      </div>
      <button class="btn ${right ? '' : 'btn--pink'}" type="button" data-continue>Continue</button>
    </div>`;
  }

  function done() {
    const best = Math.max(get('quizBest') ?? 0, xp);
    set('quizBest', best);
    const streak = (get('demoStreak') ?? 0) + 1;
    set('demoStreak', streak);
    return `
      <div class="quiz__done">
        <div class="quiz__done-crew">
          <div>${crew.polly({ mood: 'wow', label: '' })}</div>
          <div class="big">${crew.nyq({ mood: 'wink', label: '' })}</div>
          <div>${crew.cubert({ label: '' })}</div>
        </div>
        <h3>Lesson complete</h3>
        <div class="quiz__stats">
          <div class="stat stat--xp"><span>Total XP</span><strong>${xp}</strong></div>
          <div class="stat stat--acc"><span>Accuracy</span><strong>${Math.round(((QUESTIONS.length - mistakes.length) / QUESTIONS.length) * 100)}%</strong></div>
          <div class="stat stat--streak"><span>Streak</span><strong>${streak} 🔥</strong></div>
        </div>
        ${
          mistakes.length
            ? `<p class="quiz__saved">Cubert saved ${mistakes.length} note${mistakes.length > 1 ? 's' : ''} from this lesson. Tomorrow's quiz will bring ${mistakes.length > 1 ? 'them' : 'it'} back.</p>`
            : '<p class="quiz__saved">Perfect lesson. Tomorrow’s quiz moves on to something harder.</p>'
        }
        <div class="quiz__done-actions">
          <button class="btn btn--ghost" type="button" data-restart>Practice again</button>
          <button class="btn" type="button" data-signup data-track="control">Keep my streak</button>
        </div>
      </div>`;
  }

  function render() {
    if (i >= QUESTIONS.length || hearts === 0) {
      root.innerHTML = hearts === 0 ? outOfHearts() : done();
      if (hearts > 0) {
        const r = root.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + r.height * 0.3, 44);
      }
    } else {
      root.innerHTML = header() + body() + footer();
    }
    wire();
  }

  function outOfHearts() {
    return `<div class="quiz__done">
      <div style="width:120px">${crew.ozzy({ mood: 'sleepy', label: '' })}</div>
      <h3>Out of hearts</h3>
      <p class="quiz__saved">Every miss is in your notes now. Have a look, then try again.</p>
      <div class="quiz__done-actions"><button class="btn btn--blue" type="button" data-restart>Try again</button></div>
    </div>`;
  }

  function choose(v) {
    if (checked) return;
    picked = v;
    root.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.pick) === v)));
    root.querySelector('[data-check]').disabled = false;
  }

  function check() {
    if (picked === null || checked) return;
    checked = true;
    const q = QUESTIONS[i];
    const right = picked === q.answer;
    if (right) xp += 10;
    else {
      hearts -= 1;
      mistakes.push(q);
      setTimeout(() => toast({ title: 'Cubert saved a note', body: q.note, who: 'cubert' }), 500);
    }
    // mark options
    root.querySelectorAll('[data-pick]').forEach((b) => {
      const v = Number(b.dataset.pick);
      b.disabled = true;
      if (v === q.answer) b.dataset.state = 'right';
      else if (v === picked) b.dataset.state = 'wrong';
    });
    root.querySelector('.quiz__foot').outerHTML = footer();
    root.querySelector('.quiz__hearts').outerHTML = header().match(/<div class="quiz__hearts"[\s\S]*?<\/div>/)[0];
    wireFoot();
    root.querySelector('[data-continue]')?.focus({ preventScroll: true });
  }

  function next() {
    i += 1;
    picked = null;
    checked = false;
    render();
    root.querySelector('[data-pick]')?.focus({ preventScroll: true });
  }

  function wireFoot() {
    root.querySelector('[data-check]')?.addEventListener('click', check);
    root.querySelector('[data-continue]')?.addEventListener('click', next);
    root.querySelector('[data-skip]')?.addEventListener('click', () => {
      mistakes.push(QUESTIONS[i]);
      next();
    });
  }

  function wire() {
    root.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.pick))));
    wireFoot();
    root.querySelector('[data-restart]')?.addEventListener('click', () => {
      i = 0;
      hearts = 3;
      xp = 0;
      picked = null;
      checked = false;
      mistakes = [];
      render();
    });
  }

  root.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    const q = QUESTIONS[i];
    if (!q) return;
    if (q.type === 'choice' && /^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
    if (e.key === 'Enter' && !e.target.matches('button')) {
      if (!checked) check();
      else next();
    }
  });

  render();
}
