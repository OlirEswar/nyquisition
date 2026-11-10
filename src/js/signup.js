// Onboarding dialog (Duolingo-style steps) + log in. No backend yet: accounts
// live in localStorage so the whole flow behaves like the real thing.

import { crew } from './crew.js';
import { confetti, toast } from './toast.js';
import { fakeRequest, get, isEmail, set } from './store.js';

const TRACKS = [
  { id: 'control', label: 'Control theory', note: 'Feedback, stability, root locus', who: 'nyq' },
  { id: 'em', label: 'Electromagnetics', note: 'Fields, Maxwell, waves', who: 'ozzy' },
  { id: 'signals', label: 'Signals & systems', note: 'Fourier, Laplace, sampling', who: 'polly' },
  { id: 'circuits', label: 'Circuits', note: 'Op-amps, filters, transients', who: 'cubert' },
];
const LEVELS = [
  { id: 'taking', label: 'Taking the class now', note: 'Keep up with lectures' },
  { id: 'rusty', label: 'Took it, forgot it', note: 'Rebuild the foundations' },
  { id: 'working', label: 'Use it at work', note: 'Sharpen the hard parts' },
  { id: 'new', label: 'Brand new to it', note: 'Start from the basics' },
];
const GOALS = [
  { id: 5, label: '5 min a day', note: 'Casual' },
  { id: 10, label: '10 min a day', note: 'Regular' },
  { id: 15, label: '15 min a day', note: 'Serious' },
  { id: 20, label: '20 min a day', note: 'Intense' },
];

const closeIcon =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5.5l13.5 13M18.5 5L5.5 18.6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>';
const backIcon =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let dialog;
let state;

const trackLabel = (id) => TRACKS.find((t) => t.id === id)?.label ?? 'Control theory';

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.setAttribute('aria-labelledby', 'signup-title');
  dialog.setAttribute('data-lenis-prevent', '');
  document.body.append(dialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('dialog-open'));
}

function head({ step, total, back = true }) {
  const pct = total ? Math.round((step / total) * 100) : 100;
  return `
    <div class="dialog__head">
      ${
        back && step > 0
          ? `<button class="dialog__close" style="margin:0" type="button" data-back>${backIcon}<span class="visually-hidden">Back</span></button>`
          : ''
      }
      ${
        total
          ? `<div class="progress" role="progressbar" aria-label="Sign-up progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="progress__bar" style="--value:${pct}%"></div></div>`
          : '<div style="flex:1"></div>'
      }
      <button class="dialog__close" type="button" data-close>${closeIcon}<span class="visually-hidden">Close</span></button>
    </div>`;
}

function choiceStep({ title, sub, items, key, withIcons }) {
  return `
    <div class="dialog__body">
      <div style="display:flex;gap:var(--s-3);align-items:center;margin-bottom:var(--s-4)">
        <div style="width:64px;flex:none">${crew.nyq({ mood: 'happy', label: '' })}</div>
        <div class="sheet" style="padding:var(--s-3) var(--s-4);border-radius:16px;box-shadow:none;border-width:2px">
          <h2 id="signup-title" style="font-size:var(--step-2)">${title}</h2>
          ${sub ? `<p style="color:var(--ink-soft);font-size:.95rem">${sub}</p>` : ''}
        </div>
      </div>
      <div class="choice-grid" role="radiogroup" aria-labelledby="signup-title">
        ${items
          .map(
            (it) => `
          <button type="button" class="choice" role="radio" aria-checked="${state[key] === it.id}" data-choice="${key}" data-value="${it.id}">
            ${withIcons ? crew[it.who]({ label: '' }) : ''}
            <strong>${it.label}</strong><span>${it.note}</span>
          </button>`,
          )
          .join('')}
      </div>
      <button class="btn btn--block" style="margin-top:var(--s-5)" type="button" data-next ${state[key] == null ? 'disabled' : ''}>Continue</button>
    </div>`;
}

function accountStep() {
  return `
    <form class="dialog__body" novalidate data-account>
      <div style="display:flex;gap:var(--s-3);align-items:center;margin-bottom:var(--s-4)">
        <div style="width:64px;flex:none">${crew.cubert({ label: '' })}</div>
        <div>
          <h2 id="signup-title" style="font-size:var(--step-2)">Save your progress</h2>
          <p style="color:var(--ink-soft);font-size:.95rem">Cubert keeps your notes and streak in your account.</p>
        </div>
      </div>
      <div style="display:grid;gap:var(--s-4)">
        <div class="field">
          <label for="su-name">Name</label>
          <input class="input" id="su-name" name="name" autocomplete="given-name" value="${state.name ?? ''}" required />
          <span class="error">Add a name so Nyq knows what to call you.</span>
        </div>
        <div class="field">
          <label for="su-email">Email</label>
          <input class="input" id="su-email" name="email" type="email" autocomplete="email" value="${state.email ?? ''}" required />
          <span class="error">Enter an email like you@school.edu.</span>
        </div>
        <div class="field">
          <label for="su-pass">Password</label>
          <input class="input" id="su-pass" name="password" type="password" autocomplete="new-password" minlength="8" required />
          <span class="hint">At least 8 characters.</span>
          <span class="error">Use at least 8 characters.</span>
        </div>
        <button class="btn btn--block" type="submit">Create account</button>
        <p style="font-size:.85rem;color:var(--ink-soft);text-align:center">By creating an account you agree to our <a href="/legal.html#terms">Terms</a> and <a href="/legal.html#privacy">Privacy policy</a>.</p>
      </div>
    </form>`;
}

function doneStep(user) {
  return `
    <div class="dialog__body" style="text-align:center;display:grid;justify-items:center;gap:var(--s-3)">
      <div style="display:flex;gap:var(--s-2);align-items:end">
        <div style="width:58px">${crew.polly({ mood: 'wow', label: '' })}</div>
        <div style="width:96px">${crew.nyq({ mood: 'wink', label: '' })}</div>
        <div style="width:58px">${crew.ozzy({ label: '' })}</div>
      </div>
      <h2 id="signup-title" style="font-size:var(--step-3)">You're in, ${escapeHTML(user.name)}</h2>
      <p class="lede" style="margin-inline:auto">Your first ${trackLabel(user.track)} lesson is ready. We'll send a ${user.goal}-minute quiz every morning, tuned to what you got wrong the day before.</p>
      <div class="sheet" style="width:100%;padding:var(--s-4);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s-2);box-shadow:none;border-width:2px">
        <div><strong style="font-family:var(--font-display);font-size:1.6rem;color:var(--flame)">1</strong><div style="font-size:.85rem">day streak</div></div>
        <div><strong style="font-family:var(--font-display);font-size:1.6rem;color:var(--nyq-deep)">${user.goal}</strong><div style="font-size:.85rem">min goal</div></div>
        <div><strong style="font-family:var(--font-display);font-size:1.6rem;color:var(--ozzy-deep)">0</strong><div style="font-size:.85rem">notes saved</div></div>
      </div>
      <button class="btn btn--block" type="button" data-start>Start lesson 1</button>
      <button class="link-btn" type="button" data-signout>Not you? Sign out</button>
    </div>`;
}

function loginStep() {
  return `
    ${head({ step: 0, total: 0, back: false })}
    <form class="dialog__body" novalidate data-login-form>
      <div style="display:flex;gap:var(--s-3);align-items:center;margin-bottom:var(--s-4)">
        <div style="width:64px;flex:none">${crew.ozzy({ label: '' })}</div>
        <div>
          <h2 id="signup-title" style="font-size:var(--step-2)">Welcome back</h2>
          <p style="color:var(--ink-soft);font-size:.95rem">Your streak missed you.</p>
        </div>
      </div>
      <div style="display:grid;gap:var(--s-4)">
        <div class="field">
          <label for="li-email">Email</label>
          <input class="input" id="li-email" name="email" type="email" autocomplete="email" required />
          <span class="error" data-email-error>Enter the email you signed up with.</span>
        </div>
        <div class="field">
          <label for="li-pass">Password</label>
          <input class="input" id="li-pass" name="password" type="password" autocomplete="current-password" required />
          <span class="error">Enter your password.</span>
        </div>
        <button class="btn btn--block btn--blue" type="submit">Log in</button>
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--s-2);font-size:.92rem">
          <button class="link-btn" type="button" data-forgot>Forgot password?</button>
          <button class="link-btn" type="button" data-to-signup>Create an account</button>
        </div>
      </div>
    </form>`;
}

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const STEPS = ['track', 'level', 'goal', 'account'];

function render() {
  const user = get('user');
  if (state.mode === 'login') {
    dialog.innerHTML = loginStep();
  } else if (state.mode === 'done' || (user && state.mode !== 'signup-force')) {
    dialog.innerHTML = head({ step: 0, total: 0, back: false }) + doneStep(user ?? state);
  } else {
    const step = STEPS[state.step];
    const body =
      step === 'track'
        ? choiceStep({ title: 'What do you want to get good at?', items: TRACKS, key: 'track', withIcons: true })
        : step === 'level'
          ? choiceStep({ title: 'Where are you starting from?', sub: 'Your first lessons are pitched at this level. The AI adjusts from there.', items: LEVELS, key: 'level' })
          : step === 'goal'
            ? choiceStep({ title: 'Pick a daily goal', sub: 'You can change it any time.', items: GOALS, key: 'goal' })
            : accountStep();
    dialog.innerHTML = head({ step: state.step, total: STEPS.length + 1 }) + body;
  }
  wire();
  const focusTarget = dialog.querySelector('[aria-checked="true"], .choice, input, [data-start]');
  focusTarget?.focus({ preventScroll: true });
}

function validate(form) {
  let ok = true;
  form.querySelectorAll('input[required]').forEach((input) => {
    const field = input.closest('.field');
    let valid = input.value.trim().length > 0;
    if (input.type === 'email') valid = isEmail(input.value);
    if (input.minLength > 0) valid = input.value.length >= input.minLength;
    field.toggleAttribute('data-invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid && ok) {
      input.focus();
      ok = false;
    }
  });
  return ok;
}

async function withLoading(btn, label, fn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${label}`;
  try {
    await fn();
  } finally {
    if (btn.isConnected) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}

function wire() {
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-back]')?.addEventListener('click', () => {
    state.step = Math.max(0, state.step - 1);
    render();
  });
  const choices = [...dialog.querySelectorAll('[data-choice]')];
  choices.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.choice;
      state[key] = key === 'goal' ? Number(btn.dataset.value) : btn.dataset.value;
      choices.forEach((c) => c.setAttribute('aria-checked', String(c === btn)));
      dialog.querySelector('[data-next]').disabled = false;
    });
    btn.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = choices[(i + dir + choices.length) % choices.length];
      next.focus();
      next.click();
    });
  });
  dialog.querySelector('[data-next]')?.addEventListener('click', () => {
    state.step += 1;
    render();
  });

  const account = dialog.querySelector('[data-account]');
  account?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(account));
    state.name = data.name;
    state.email = data.email;
    if (!validate(account)) return;
    await withLoading(account.querySelector('[type=submit]'), 'Creating account', () => fakeRequest(1100));
    const user = { name: data.name.trim(), email: data.email.trim(), track: state.track, level: state.level, goal: state.goal, joined: Date.now() };
    set('user', user);
    state.mode = 'done';
    render();
    const r = dialog.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + 120);
    refreshSignupButtons();
  });

  const login = dialog.querySelector('[data-login-form]');
  login?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(login)) return;
    const email = login.email.value.trim().toLowerCase();
    await withLoading(login.querySelector('[type=submit]'), 'Logging in', () => fakeRequest(900));
    const user = get('user');
    if (!user || user.email.toLowerCase() !== email) {
      const field = login.email.closest('.field');
      field.setAttribute('data-invalid', '');
      field.querySelector('[data-email-error]').textContent = 'No account uses that email. Check the spelling or create an account.';
      login.email.focus();
      return;
    }
    dialog.close();
    toast({ title: `Welcome back, ${user.name}`, body: 'Your next quiz is ready whenever you are.', who: 'ozzy' });
    refreshSignupButtons();
  });
  dialog.querySelector('[data-forgot]')?.addEventListener('click', async (e) => {
    const email = dialog.querySelector('#li-email');
    if (!isEmail(email.value)) {
      const field = email.closest('.field');
      field.setAttribute('data-invalid', '');
      field.querySelector('[data-email-error]').textContent = 'Enter your email first, then we can send a reset link.';
      email.focus();
      return;
    }
    e.target.disabled = true;
    await fakeRequest(700);
    e.target.disabled = false;
    toast({ title: 'Reset link sent', body: `If ${email.value.trim()} has an account, a link is on its way.`, who: 'cubert' });
  });
  dialog.querySelector('[data-to-signup]')?.addEventListener('click', () => {
    state = freshState({ mode: 'signup-force' });
    render();
  });
  dialog.querySelector('[data-start]')?.addEventListener('click', () => {
    dialog.close();
    const lesson = document.getElementById('lesson');
    if (lesson) lesson.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else location.href = '/#lesson';
  });
  dialog.querySelector('[data-signout]')?.addEventListener('click', () => {
    set('user', null);
    refreshSignupButtons();
    state = freshState({ mode: 'signup-force' });
    render();
    toast({ title: 'Signed out', who: 'ozzy', mood: 'sleepy' });
  });
}

const freshState = (extra = {}) => ({ step: 0, track: null, level: null, goal: null, mode: 'signup', ...extra });

export function openSignup({ track, plan, mode, email } = {}) {
  if (!dialog) build();
  state = freshState({ mode: mode ?? 'signup' });
  if (track && TRACKS.some((t) => t.id === track)) {
    state.track = track;
    state.step = 1;
  }
  if (plan) state.plan = plan;
  if (email) state.email = email;
  render();
  dialog.showModal();
  // showModal() moves focus to the first focusable (the close button); start on the choices instead
  dialog.querySelector('[aria-checked="true"], .choice, input, [data-start]')?.focus({ preventScroll: true });
  document.documentElement.classList.add('dialog-open');
}

/** Header buttons reflect whether someone has an account. */
export function refreshSignupButtons() {
  const user = get('user');
  document.querySelectorAll('.site-header [data-signup], .mobile-menu [data-signup]').forEach((b) => {
    b.textContent = user ? 'Continue learning' : 'Get started';
  });
  document.querySelectorAll('.site-header [data-login], .mobile-menu [data-login]').forEach((b) => {
    b.hidden = Boolean(user);
  });
}
