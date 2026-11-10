import { initChrome } from './chrome.js';
import { crew } from './crew.js';
import { jobById } from './data/jobs.js';
import { confetti, toast } from './toast.js';
import { fakeRequest, get, isEmail, set } from './store.js';

initChrome();

const main = document.querySelector('[data-job]');
const id = new URLSearchParams(location.search).get('id');

const GENERAL = {
  id: 'general',
  title: 'General application',
  team: 'Any team',
  location: 'Pittsburgh or remote',
  type: 'Full-time',
  salary: null,
  summary: 'Tell us what you’d build, teach or fix at Nyquisition. We read every one.',
  about: 'We don’t always have a posting for the right person. If you care about how engineers learn and have a skill we’d be lucky to have, write to us.',
  doing: [],
  need: [],
  nice: [],
  benefits: 'Full benefits, equity, and a $1,500 yearly learning budget (textbooks count).',
};

const job = id === 'general' ? GENERAL : jobById(id);
const teamWho = { Engineering: 'nyq', Learning: 'ozzy', Design: 'polly', Operations: 'cubert', 'Any team': 'cubert' };

if (!job) {
  document.title = 'Role not found | Nyquisition';
  main.innerHTML = `<div class="wrap empty" style="padding-block:var(--s-9)">
    ${crew.polly({ mood: 'sad', label: '' })}
    <h1 style="font-size:var(--step-4)">That role isn't open any more</h1>
    <p class="lede">It may have been filled. Here's everything we're hiring for right now.</p>
    <a class="btn" href="/careers.html#roles">See open roles</a>
  </div>`;
} else {
  render();
}

function list(title, items) {
  return items.length ? `<section><h2>${title}</h2><ul class="ticks">${items.map((x) => `<li>${x}</li>`).join('')}</ul></section>` : '';
}

function render() {
  document.title = `${job.title} | Careers at Nyquisition`;
  main.innerHTML = `
    <div class="wrap job">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/careers.html">Careers</a><span aria-hidden="true">/</span><a href="/careers.html#roles">Open roles</a></nav>
      <div class="job__layout">
        <article class="job__main">
          <header class="job__head">
            <div class="job__who" aria-hidden="true">${crew[teamWho[job.team]]({ label: '' })}</div>
            <h1>${job.title}</h1>
            <ul class="job__facts">
              <li><span>Team</span>${job.team}</li>
              <li><span>Location</span>${job.location}</li>
              <li><span>Type</span>${job.type}</li>
              ${job.salary ? `<li><span>Salary</span>${job.salary}</li>` : ''}
            </ul>
          </header>
          <div class="prose job__body">
            <p class="lede">${job.summary}</p>
            <section><h2>About the role</h2><p>${job.about}</p></section>
            ${list('What you’ll do', job.doing)}
            ${list('What you’ll need', job.need)}
            ${list('Nice to have', job.nice)}
            <section><h2>Benefits</h2><p>${job.benefits} See the full list on our <a href="/careers.html">careers page</a>.</p></section>
          </div>
          <section class="apply sheet" id="apply" aria-labelledby="apply-title" data-apply></section>
        </article>
        <aside class="job__side">
          <div class="side-card sheet">
            <p class="hand">psst. it takes about 4 minutes</p>
            <a class="btn btn--block" href="#apply">Apply for this role</a>
            <button class="btn btn--ghost btn--block" type="button" data-copy>Copy link to role</button>
            <p class="side-card__note">We reply to every application within two weeks.</p>
          </div>
        </aside>
      </div>
    </div>`;
  main.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast({ title: 'Link copied', body: 'Send it to a friend who’d be great here.', who: 'nyq' });
    } catch {
      toast({ title: 'Couldn’t copy the link', body: 'Copy it from the address bar instead.', who: 'polly', mood: 'sad' });
    }
  });
  renderApply();
}

function renderApply() {
  const box = main.querySelector('[data-apply]');
  const applied = get(`applied:${job.id}`);
  const sideCta = main.querySelector('.side-card .btn[href="#apply"]');
  if (sideCta) sideCta.textContent = applied ? 'View your application' : 'Apply for this role';
  if (applied) {
    box.innerHTML = `
      <div class="apply__done">
        <div class="apply__done-crew" aria-hidden="true">${crew.cubert({ label: '' })}${crew.nyq({ label: '', mood: 'wink' })}</div>
        <h2 id="apply-title">Application received</h2>
        <p>Thanks, ${escapeHTML(applied.name)}. You applied on ${new Date(applied.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Reference <strong>${applied.ref}</strong>.</p>
        <p class="apply__next">We'll email ${escapeHTML(applied.email)} within two weeks either way. If it's a fit, the next step is a 30-minute intro call.</p>
        <div class="apply__done-actions">
          <a class="btn btn--ghost" href="/careers.html#roles">See other roles</a>
          <button class="link-btn" type="button" data-withdraw>Withdraw application</button>
        </div>
      </div>`;
    box.querySelector('[data-withdraw]').addEventListener('click', async (e) => {
      e.target.disabled = true;
      await fakeRequest(600);
      set(`applied:${job.id}`, null);
      toast({ title: 'Application withdrawn', body: 'You can apply again any time.', who: 'ozzy' });
      renderApply();
    });
    return;
  }
  const draft = get(`draft:${job.id}`) ?? {};
  box.innerHTML = `
    <h2 id="apply-title">Apply</h2>
    <p class="apply__intro">Fields marked optional really are. No cover letter needed; the question below is enough.</p>
    <form class="apply__form" novalidate data-form>
      <div class="apply__grid">
        <div class="field">
          <label for="a-name">Full name</label>
          <input class="input" id="a-name" name="name" autocomplete="name" required value="${escapeAttr(draft.name)}" />
          <span class="error">Enter your name.</span>
        </div>
        <div class="field">
          <label for="a-email">Email</label>
          <input class="input" id="a-email" name="email" type="email" autocomplete="email" required value="${escapeAttr(draft.email)}" />
          <span class="error">Enter an email like you@example.com.</span>
        </div>
        <div class="field">
          <label for="a-link">LinkedIn, portfolio or GitHub <span class="hint">(optional)</span></label>
          <input class="input" id="a-link" name="link" type="url" placeholder="https://" value="${escapeAttr(draft.link)}" />
          <span class="error">Enter a full link starting with https://</span>
        </div>
        <div class="field">
          <label for="a-where">Where are you based?</label>
          <select class="select" id="a-where" name="where" required>
            <option value="">Choose one</option>
            ${['Pittsburgh area', 'Elsewhere in the US', 'Canada', 'Latin America', 'Somewhere else'].map((o) => `<option ${draft.where === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
          <span class="error">Choose where you’re based.</span>
        </div>
      </div>
      <div class="field">
        <span class="field__label" id="resume-label">Résumé</span>
        <label class="drop" data-drop>
          <input type="file" name="resume" accept=".pdf,.doc,.docx" aria-labelledby="resume-label" data-file required />
          <span class="drop__icon" aria-hidden="true">${crew.cubert({ label: '' })}</span>
          <span class="drop__text"><strong>Drop your résumé here</strong> or <u>choose a file</u><br /><span class="hint">PDF or Word, up to 10 MB</span></span>
        </label>
        <span class="error" data-file-error>Attach your résumé as a PDF or Word file.</span>
      </div>
      <div class="field">
        <label for="a-why">${job.id === 'general' ? 'What would you do at Nyquisition?' : 'What’s something hard you learned recently, and how did you learn it?'}</label>
        <textarea class="textarea" id="a-why" name="why" required minlength="80" maxlength="1500">${escapeHTML(draft.why ?? '')}</textarea>
        <span class="hint" data-counter>0 / 1500, at least 80 characters</span>
        <span class="error">Write at least 80 characters. A few sentences is plenty.</span>
      </div>
      <div class="field field--check">
        <label class="check"><input type="checkbox" name="consent" required /> <span>Nyquisition can keep my application for 12 months and contact me about other roles. <a href="/legal.html#privacy">Privacy policy</a></span></label>
        <span class="error">Tick the box so we can process your application.</span>
      </div>
      <div class="apply__submit">
        <button class="btn" type="submit">Submit application</button>
        <span class="hint" data-saved aria-live="polite"></span>
      </div>
    </form>`;
  wireForm(box.querySelector('[data-form]'));
}

function wireForm(form) {
  // form.name is the form's own name attribute, so always go through elements
  const f = (n) => form.elements.namedItem(n);
  const file = form.querySelector('[data-file]');
  const drop = form.querySelector('[data-drop]');
  const fileErr = form.querySelector('[data-file-error]');
  const why = f('why');
  const counter = form.querySelector('[data-counter]');
  const saved = form.querySelector('[data-saved]');
  let chosen = null;

  const updateCounter = () => (counter.textContent = `${why.value.length} / 1500${why.value.length < 80 ? ', at least 80 characters' : ''}`);
  why.addEventListener('input', updateCounter);
  updateCounter();

  // autosave draft
  let t;
  form.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const d = Object.fromEntries(new FormData(form));
      delete d.resume;
      delete d.consent;
      set(`draft:${job.id}`, d);
      saved.textContent = 'Draft saved on this device';
    }, 500);
  });

  function setFile(f) {
    const field = drop.closest('.field');
    if (!f) return;
    const okType = /\.(pdf|docx?)$/i.test(f.name);
    if (!okType || f.size > 10 * 1024 * 1024) {
      chosen = null;
      fileErr.textContent = !okType ? `“${f.name}” isn’t a PDF or Word file.` : `That file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`;
      field.setAttribute('data-invalid', '');
      return;
    }
    chosen = f;
    field.removeAttribute('data-invalid');
    drop.classList.add('has-file');
    drop.querySelector('.drop__text').innerHTML = `<strong>${escapeHTML(f.name)}</strong><br /><span class="hint">${Math.max(1, Math.round(f.size / 1024))} KB. Click to replace.</span>`;
  }
  file.addEventListener('change', () => setFile(file.files[0]));
  ['dragenter', 'dragover'].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    }),
  );
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let first = null;
    const fail = (el, bad) => {
      const field = el.closest('.field');
      field.toggleAttribute('data-invalid', bad);
      el.setAttribute?.('aria-invalid', String(bad));
      if (bad && !first) first = el;
    };
    fail(f('name'), !f('name').value.trim());
    fail(f('email'), !isEmail(f('email').value));
    fail(f('link'), Boolean(f('link').value.trim()) && !/^https?:\/\/\S+\.\S+/.test(f('link').value.trim()));
    fail(f('where'), !f('where').value);
    if (!chosen) {
      fileErr.textContent = 'Attach your résumé as a PDF or Word file.';
      fail(file, true);
    }
    fail(why, why.value.trim().length < 80);
    fail(f('consent'), !f('consent').checked);
    if (first) {
      first.focus();
      first.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Uploading résumé';
    await fakeRequest(900);
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Submitting';
    await fakeRequest(700);
    const ref = `NYQ-${job.id.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    set(`applied:${job.id}`, { name: f('name').value.trim(), email: f('email').value.trim(), at: Date.now(), ref });
    set(`draft:${job.id}`, null);
    renderApply();
    const box = main.querySelector('[data-apply]');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const r = box.getBoundingClientRect();
    confetti(r.left + r.width / 2, Math.max(120, r.top + 80));
  });
}

function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function escapeAttr(s) {
  return escapeHTML(s ?? '');
}
