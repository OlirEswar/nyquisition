import { initChrome } from './chrome.js';
import { crew } from './crew.js';
import { JOBS, LOCATIONS, TEAMS } from './data/jobs.js';
import { get } from './store.js';

initChrome();

document.querySelector('[data-team-photo]').innerHTML = `
  <div class="team-row">
    <div style="width:30%;rotate:-6deg">${crew.polly({ label: '', mood: 'wink' })}</div>
    <div style="width:38%">${crew.nyq({ label: '' })}</div>
    <div style="width:28%;rotate:5deg">${crew.ozzy({ label: '', mood: 'wow' })}</div>
  </div>
  <div class="team-row team-row--front"><div style="width:30%">${crew.cubert({ label: '' })}</div></div>`;

const params = new URLSearchParams(location.search);
const state = { team: TEAMS.includes(params.get('team')) ? params.get('team') : 'All', loc: '', q: '' };
const teamWho = { Engineering: 'nyq', Learning: 'ozzy', Design: 'polly', Operations: 'cubert' };
const teamTag = { Engineering: 'tag--nyq', Learning: 'tag--ozzy', Design: 'tag--polly', Operations: 'tag--cubert' };

const teams = document.querySelector('[data-teams]');
const counts = Object.fromEntries(TEAMS.map((t) => [t, JOBS.filter((j) => j.team === t).length]));
teams.innerHTML = ['All', ...TEAMS]
  .map((t) => `<button class="chip" type="button" data-team="${t}" aria-pressed="${t === state.team}">${t} <span class="chip__n">${t === 'All' ? JOBS.length : counts[t]}</span></button>`)
  .join('');
const loc = document.querySelector('[data-location]');
loc.insertAdjacentHTML('beforeend', LOCATIONS.map((l) => `<option>${l}</option>`).join(''));
const search = document.querySelector('[data-search]');
const list = document.querySelector('[data-roles]');
const count = document.querySelector('[data-count]');

function render() {
  const q = state.q.toLowerCase();
  const rows = JOBS.filter(
    (j) =>
      (state.team === 'All' || j.team === state.team) &&
      (!state.loc || j.location === state.loc) &&
      (!q || `${j.title} ${j.summary} ${j.team}`.toLowerCase().includes(q)),
  );
  count.textContent = `${rows.length} open role${rows.length === 1 ? '' : 's'}`;
  if (!rows.length) {
    list.innerHTML = `<li class="empty">${crew.ozzy({ mood: 'sleepy', label: '' })}<h3>No roles match those filters</h3><p>Try another team or location, or send a general application below.</p><button class="btn btn--sm btn--ghost" type="button" data-reset>Clear filters</button></li>`;
    list.querySelector('[data-reset]').addEventListener('click', () => {
      state.team = 'All';
      state.loc = '';
      state.q = '';
      loc.value = '';
      search.value = '';
      teams.querySelectorAll('[data-team]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.team === 'All')));
      render();
    });
    return;
  }
  list.innerHTML = rows
    .map((j) => {
      const applied = get(`applied:${j.id}`);
      return `<li>
        <a class="role" href="/job.html?id=${j.id}">
          <span class="role__who" aria-hidden="true">${crew[teamWho[j.team]]({ label: '' })}</span>
          <span class="role__main">
            <span class="role__title">${j.title}</span>
            <span class="role__summary">${j.summary}</span>
          </span>
          <span class="role__meta">
            <span class="tag ${teamTag[j.team]}">${j.team}</span>
            <span>${j.location}</span>
            <span>${j.type}</span>
            ${applied ? '<span class="role__applied">Applied</span>' : ''}
          </span>
        </a>
      </li>`;
    })
    .join('');
}

teams.addEventListener('click', (e) => {
  const b = e.target.closest('[data-team]');
  if (!b) return;
  state.team = b.dataset.team;
  teams.querySelectorAll('[data-team]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
});
loc.addEventListener('change', () => {
  state.loc = loc.value;
  render();
});
search.addEventListener('input', () => {
  state.q = search.value.trim();
  render();
});
render();
