import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initChrome, initDraw, lenis } from './chrome.js';
import { crew, crewInfo } from './crew.js';
import { initQuiz } from './quiz.js';
import { initForget } from './sims/forget.js';
import { initStep } from './sims/step.js';
import { initCourses } from './courses.js';
import { openSignup } from './signup.js';
import { confetti, toast } from './toast.js';
import { get, hasWebGL, isEmail, prefersReducedMotion, set } from './store.js';

gsap.registerPlugin(ScrollTrigger);
initChrome();
if (lenis) lenis.on('scroll', ScrollTrigger.update);
const reduced = prefersReducedMotion();
const webgl = hasWebGL();

/* ----------------------------------------------------------------- hero */
function heroWave() {
  // Sample the sine at a little over the Nyquist rate: lollipop stems + dots.
  const g = document.querySelector('.hero__samples');
  const colors = ['#2fbf71', '#ff5d8f', '#3e8bff', '#ffc234'];
  const period = 164; // px per cycle in the path above
  const n = 13;
  let html = '';
  for (let i = 0; i < n; i++) {
    const x = 4 + (i * 492) / (n - 1);
    const y = 35 - 33 * Math.sin(((x - 4) / period) * Math.PI * 2);
    html += `<g style="animation-delay:${500 + i * 70}ms"><line x1="${x}" y1="35" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r="6" fill="${colors[i % 4]}"/></g>`;
  }
  g.innerHTML = html;
}
heroWave();

document.querySelector('[data-mini-crew]').innerHTML = ['nyq', 'polly', 'ozzy', 'cubert'].map((id) => crew[id]({ label: '' })).join('');
document.querySelector('[data-final-crew]').innerHTML = ['polly', 'nyq', 'ozzy', 'cubert'].map((id) => crew[id]({ label: '', mood: id === 'nyq' ? 'wink' : 'happy' })).join('');

const LINES = {
  nyq: ['Gain of 100,000!', 'Hi! Quiz time?', 'That tickles my inputs', 'Ow, my output pin', 'Again! Again!'],
  polly: ['Wheee!', 'I feel unstable…', 'Do it again!', 'Right half-plane, here I come', 'Oscillating!'],
  ozzy: ['Steady now.', 'I cancel that out.', 'Hello there.', 'Easy on the phase.', 'Mind the margin.'],
  cubert: ['Noted.', 'Writing that down.', 'Careful, sharp pencil!', 'That goes in your notes.', 'Filed under: fun.'],
};

const bubbles = document.querySelector('[data-bubbles]');
const heroCanvas = document.querySelector('[data-hero-canvas]');
function say(text, pos) {
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  const canvasRect = heroCanvas.getBoundingClientRect();
  const heroRect = bubbles.getBoundingClientRect();
  b.style.left = `${canvasRect.left - heroRect.left + pos.x}px`;
  b.style.top = `${canvasRect.top - heroRect.top + pos.y}px`;
  bubbles.append(b);
  b.addEventListener('animationend', () => b.remove());
}

let hero = null;
if (webgl) {
  import('./three/hero.js').then(({ initHero }) => {
    let pokeTotal = 0;
    hero = initHero(heroCanvas, {
      onPoke: (c, pos, recent) => {
        pokeTotal += 1;
        const lines = LINES[c.kind];
        let line = lines[(pokeTotal + recent) % lines.length];
        if (c.kind === 'polly' && recent >= 5) {
          line = 'AAA I’M OSCILLATING';
          if (recent === 5) toast({ title: 'Polly crossed into the right half-plane', body: 'Unstable poles grow without bound. Give her a second to calm down.', who: 'polly', mood: 'wow' });
        }
        say(line, pos);
        if (pokeTotal === 12 && !get('pokeBadge')) {
          set('pokeBadge', true);
          toast({ title: 'Achievement: Persistent excitation', body: 'You poked the crew 12 times. That’s how system identification works, too.', who: 'nyq', mood: 'wink' });
        }
      },
    });
  });
} else {
  heroCanvas.outerHTML = `<div class="hero__stage hero__fallback" aria-hidden="true" style="display:flex;align-items:end;justify-content:flex-end;gap:12px;padding:0 8vw 14vh">${['polly', 'nyq', 'ozzy', 'cubert'].map((id) => `<div style="width:${id === 'nyq' ? 130 : 96}px">${crew[id]({ label: '' })}</div>`).join('')}</div>`;
}
document.querySelectorAll('[data-poke]').forEach((b) => b.addEventListener('click', () => hero?.pokeById(b.dataset.poke)));
document.querySelector('[data-scatter]').addEventListener('click', () => hero?.scatter());

/* --------------------------------------------------------------- lesson */
initQuiz(document.querySelector('[data-quiz]'));

/* --------------------------------------------------------------- memory */
initForget(document.querySelector('[data-forget]'));

/* ---------------------------------------------------------------- notes */
initStep(document.querySelector('[data-step]'));
let fieldReady = false;
const notebook = document.querySelector('[data-notebook]');
const noteTabs = [...notebook.querySelectorAll('[role=tab]')];
function showNote(tab) {
  noteTabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (tab.id === 'tab-field' && !fieldReady) {
    fieldReady = true;
    import('./sims/field.js').then(({ initField }) => initField(document.querySelector('[data-field]')));
  }
}
noteTabs.forEach((t, i) => {
  t.addEventListener('click', () => showNote(t));
  t.addEventListener('keydown', (e) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = noteTabs[(i + dir + noteTabs.length) % noteTabs.length];
    next.focus();
    showNote(next);
  });
});

/* ------------------------------------------------------------- ask nyq */
const ANSWERS = [
  {
    match: /damp|overshoot|ζ|zeta|ring/i,
    text: 'More damping pushes both poles toward the real axis, so there’s less oscillation riding on the response. Overshoot only depends on ζ. Try ζ = 0.7 in your note: about 5% overshoot, which is why it’s a common design target.',
    cite: 'From your note “Second-order systems” (Tuesday): You picked “overshoot goes up”. Notice it only depends on ζ, not ωₙ.',
    tab: 'tab-step',
  },
  {
    match: /two|positive|like charge|repel|null/i,
    text: 'Field lines from two positive charges push away from each other. Exactly halfway between equal charges the fields cancel, which is called a null point. In your field note, tap “Add +” and drag it near the first one to see it.',
    cite: 'From your note “Field lines” (last week): Two like charges: the lines push apart and leave a null point between them.',
    tab: 'tab-field',
  },
  {
    match: /quiz|forget|review|weak/i,
    text: 'Your three shakiest ideas right now: partial fractions with repeated roots, what Gauss’s law says about outside charges, and reading phase margin off a Bode plot. Tomorrow’s quiz opens with the first one.',
    cite: 'Based on 4 saved notes and 11 missed questions over the last 2 weeks.',
  },
];
const askLog = document.querySelector('[data-ask-log]');
const askForm = document.querySelector('[data-ask-form]');
document.querySelector('[data-ask-avatar]').innerHTML = crew.nyq({ label: '' });
function ask(q) {
  q = q.trim();
  if (!q) return;
  const you = document.createElement('div');
  you.className = 'msg msg--you';
  you.textContent = q;
  const reply = document.createElement('div');
  reply.className = 'msg msg--nyq';
  reply.innerHTML = '<span class="msg__typing" aria-label="Nyq is typing"><i></i><i></i><i></i></span>';
  askLog.append(you, reply);
  const hit = ANSWERS.find((a) => a.match.test(q));
  const a = hit ?? {
    text: 'I don’t have a note on that yet. I’ve added it to tomorrow’s quiz so we can find out what you already know, and Cubert will start a note from whatever trips you up.',
    cite: 'New topic, no notes yet.',
  };
  setTimeout(() => {
    reply.textContent = '';
    const p = document.createElement('p');
    reply.append(p);
    const cite = document.createElement('cite');
    cite.textContent = a.cite;
    let k = 0;
    const words = a.text.split(' ');
    const typeNext = () => {
      p.textContent = words.slice(0, ++k).join(' ');
      if (k < words.length) setTimeout(typeNext, reduced ? 0 : 28);
      else {
        reply.append(cite);
        if (a.tab) {
          const open = document.createElement('button');
          open.className = 'link-btn';
          open.type = 'button';
          open.style.marginTop = '8px';
          open.textContent = 'Open this note';
          open.addEventListener('click', () => {
            const tab = document.getElementById(a.tab);
            showNote(tab);
            notebook.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          reply.append(open);
        }
      }
    };
    typeNext();
  }, 900);
}
askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  ask(askForm.q.value);
  askForm.reset();
});
document.querySelectorAll('[data-ask-suggest] .chip').forEach((c) =>
  c.addEventListener('click', () => {
    ask(c.textContent);
    c.remove();
  }),
);

/* ------------------------------------------------------------ cart-pole */
const play = document.querySelector('[data-play]');
function initPlay() {
  const timeEl = play.querySelector('[data-time]');
  const bestEl = play.querySelector('[data-best]');
  const hint = play.querySelector('[data-hint]');
  if (matchMedia('(pointer: coarse)').matches) hint.textContent = 'drag left and right under Ozzy to balance him';
  const over = play.querySelector('[data-over]');
  const nudgeBtn = play.querySelector('[data-nudge]');
  const strip = play.querySelector('[data-strip]');
  const sctx = strip.getContext('2d');
  let samples = [];
  let best = get('cartBest') ?? 0;
  bestEl.textContent = `${best.toFixed(1)} s`;
  nudgeBtn.hidden = true;

  function drawStrip() {
    const dpr = Math.min(devicePixelRatio, 2);
    const w = strip.clientWidth;
    const h = strip.clientHeight;
    if (strip.width !== Math.round(w * dpr)) {
      strip.width = Math.round(w * dpr);
      strip.height = Math.round(h * dpr);
    }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, w, h);
    sctx.strokeStyle = 'rgba(141,136,163,.5)';
    sctx.setLineDash([4, 6]);
    sctx.beginPath();
    sctx.moveTo(0, h / 2);
    sctx.lineTo(w, h / 2);
    sctx.stroke();
    sctx.setLineDash([]);
    sctx.strokeStyle = '#ff5d8f';
    sctx.lineWidth = 2.5;
    sctx.lineJoin = 'round';
    sctx.beginPath();
    const maxN = Math.floor(w / 3);
    const pts = samples.slice(-maxN);
    pts.forEach((th, i) => {
      const x = w - (pts.length - 1 - i) * 3;
      const y = h / 2 - (th / 1.2) * (h / 2 - 4);
      i ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
    });
    sctx.stroke();
  }

  let lastPhase = 'ready';
  import('./three/cartpole.js').then(({ initCartPole }) => {
    const game = initCartPole(play.querySelector('[data-cartpole]'), {
      onSample: (th) => {
        samples.push(th);
        if (samples.length > 600) samples = samples.slice(-400);
        drawStrip();
      },
      onState: ({ phase, mode, time }) => {
        hint.style.opacity = phase === 'ready' && mode === 'you' ? 1 : 0;
        if (phase === 'fallen' && lastPhase !== 'fallen') {
          const title = play.querySelector('[data-over-title]');
          const body = play.querySelector('[data-over-body]');
          if (mode === 'you') {
            const t = game.state.time;
            const isBest = t > best;
            if (isBest) {
              best = t;
              set('cartBest', best);
              bestEl.textContent = `${best.toFixed(1)} s`;
            }
            title.textContent = isBest && t > 3 ? `New best: ${t.toFixed(1)} s` : `Ozzy fell after ${t.toFixed(1)} s`;
            body.textContent =
              t < 3
                ? 'Move the cart under the pole the way it’s leaning, like balancing a broom on your hand.'
                : t < 10
                  ? 'Good reflexes. Nyq’s controller does this by watching four numbers: angle, angular speed, position and speed.'
                  : 'You’re basically a PD controller now. Unit 8 shows you the math behind what your hand just did.';
            play.querySelector('[data-handoff]').hidden = false;
          } else {
            title.textContent = 'You beat the controller';
            body.textContent = 'Big nudges push the pole past where the cart can catch it. Real controllers have limits too, which is what saturation is about.';
            play.querySelector('[data-handoff]').hidden = true;
          }
          setTimeout(() => {
            over.hidden = false;
            play.querySelector('[data-retry]').focus({ preventScroll: true });
          }, 700);
        }
        if (phase !== 'fallen') over.hidden = true;
        lastPhase = phase;
      },
    });

    setInterval(() => {
      if (game.state.phase === 'playing') timeEl.textContent = `${game.state.time.toFixed(1)} s`;
    }, 100);

    const driveBtns = play.querySelectorAll('[data-drive]');
    const setMode = (mode) => {
      driveBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.drive === mode)));
      nudgeBtn.hidden = mode !== 'nyq';
      samples = [];
      drawStrip();
      timeEl.textContent = '0.0 s';
      game.setMode(mode);
      if (mode === 'nyq') toast({ title: 'Nyq is driving', body: 'Click the canvas or press Nudge to knock Ozzy. The controller fights back.', who: 'nyq' });
    };
    driveBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.drive)));
    nudgeBtn.addEventListener('click', () => game.nudge(Math.random() > 0.5 ? 1 : -1));
    play.querySelector('[data-reset]').addEventListener('click', () => {
      samples = [];
      drawStrip();
      timeEl.textContent = '0.0 s';
      game.reset();
    });
    play.querySelector('[data-retry]').addEventListener('click', () => {
      samples = [];
      drawStrip();
      timeEl.textContent = '0.0 s';
      game.reset();
      play.querySelector('[data-cartpole]').focus({ preventScroll: true });
    });
    play.querySelector('[data-handoff]').addEventListener('click', () => setMode('nyq'));
  });
}

/* --------------------------------------------------------------- courses */
const courses = initCourses(document.querySelector('#courses'));
if (reduced) courses.setProgress(1);
else {
  ScrollTrigger.create({
    trigger: '[data-path]',
    start: 'top 75%',
    end: 'bottom 55%',
    scrub: 0.6,
    onUpdate: (self) => courses.setProgress(self.progress),
  });
}
document.querySelectorAll('[data-track-tab]').forEach((t) => t.addEventListener('click', () => ScrollTrigger.refresh()));

/* ------------------------------------------------------------------ crew */
const crewTabs = document.querySelector('[data-crew-tabs]');
const crewCard = document.querySelector('[data-crew-card]');
let cast = null;
crewTabs.innerHTML = crewInfo
  .map((c, i) => `<button class="chip" role="tab" style="--c:${c.color}" aria-selected="${i === 0}" data-crew="${c.id}">${c.name}</button>`)
  .join('');
function showCrew(id) {
  const c = crewInfo.find((x) => x.id === id);
  crewTabs.querySelectorAll('[data-crew]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.crew === id)));
  crewCard.innerHTML = `
    <div>${crew[id]({ label: '' })}</div>
    <div class="crew__card-text">
      <h3>${c.name}</h3>
      <p class="crew__role">${c.role}, ${c.shape.toLowerCase()}</p>
      <p style="margin-top:var(--s-2)">${c.bio}</p>
      <dl><dt>Likes</dt><dd>${c.likes}</dd></dl>
    </div>`;
}
showCrew('nyq');
crewTabs.querySelectorAll('[data-crew]').forEach((b) =>
  b.addEventListener('click', () => {
    showCrew(b.dataset.crew);
    cast?.select(b.dataset.crew);
  }),
);

/* ---------------------------------------------------- lazy 3D sections */
function whenNear(el, fn) {
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin: '400px' },
  );
  io.observe(el);
}
if (webgl) {
  whenNear(play, initPlay);
  whenNear(document.querySelector('[data-cast]'), () =>
    import('./three/cast.js').then(({ initCast }) => {
      cast = initCast(document.querySelector('[data-cast]'), { onSelect: (id) => showCrew(id) });
    }),
  );
} else {
  play.querySelector('.play__stage').innerHTML = '<div class="empty"><p>This mini-game needs WebGL, which your browser has turned off.</p></div>';
  document.querySelector('.crew__stage').hidden = true;
}

/* --------------------------------------------------------------- pricing */
const PRICES = {
  monthly: { price: '$8.99', note: 'a month' },
  yearly: { price: '$4.99', note: 'a month, billed $59.88 yearly' },
};
document.querySelectorAll('[data-billing]').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-billing]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const p = PRICES[b.dataset.billing];
    const priceEl = document.querySelector('[data-price]');
    priceEl.textContent = p.price;
    document.querySelector('[data-price-note]').textContent = p.note;
    if (!reduced) gsap.fromTo(priceEl, { scale: 0.8, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(3)' });
  }),
);

/* ----------------------------------------------------------------- final */
const finalForm = document.querySelector('[data-final-form]');
finalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = finalForm.email.value.trim();
  if (email && !isEmail(email)) {
    finalForm.email.setAttribute('aria-invalid', 'true');
    toast({ title: 'That email looks off', body: 'Check for a typo, like a missing @ or domain.', who: 'polly', mood: 'wow' });
    finalForm.email.focus();
    return;
  }
  finalForm.email.removeAttribute('aria-invalid');
  openSignup({ email });
});

/* ---------------------------------------------------- the pencil pops */
// One orchestrated moment per section: the section heading's doodle underline
// draws itself, and the crew mascot on the path rides along (see courses).
if (!reduced) {
  document.querySelectorAll('.section-head h2, .lesson__copy h2').forEach((h) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 14');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('h-underline', 'doodle');
    svg.setAttribute('data-draw', '');
    svg.innerHTML = '<path d="M3 9 C 60 3, 120 12, 180 6 S 270 5, 297 8"/>';
    h.after(svg);
  });
  initDraw(document.querySelector('main'));
}

// Easter egg for the curious: Konami-free, just type "nyquist"
let typed = '';
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  typed = (typed + e.key.toLowerCase()).slice(-7);
  if (typed === 'nyquist') {
    confetti();
    toast({ title: 'f_s > 2 f_max', body: 'Sample at more than twice the highest frequency and nothing is lost. Same goes for your memory.', who: 'ozzy' });
  }
});
