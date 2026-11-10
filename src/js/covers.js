// Generated blog cover art: graph paper, a doodled motif, and a crew member.

import { crew } from './crew.js';

const INK = '#2d2a3e';

const MOTIFS = {
  samples: () => {
    let s = '<path d="M30 120 C 70 40, 110 40, 150 120 S 230 200, 270 120 S 350 40, 390 120" fill="none" stroke="#8d88a3" stroke-width="3" stroke-dasharray="8 8"/>';
    for (let i = 0; i <= 12; i++) {
      const x = 30 + i * 30;
      const y = 120 - 70 * Math.sin(((x - 30) / 240) * Math.PI * 2);
      const c = ['#2fbf71', '#ff5d8f', '#3e8bff', '#ffc234'][i % 4];
      s += `<line x1="${x}" y1="120" x2="${x}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="8" fill="${c}" stroke="${INK}" stroke-width="3"/>`;
    }
    return s;
  },
  curve: () =>
    `<path d="M40 50 C 80 160, 140 190, 380 200" fill="none" stroke="#ff5d8f" stroke-width="5" stroke-linecap="round"/>
     <path d="M40 50 L80 80 L80 52 L150 74 L150 52 L260 70 L260 52 L380 62" fill="none" stroke="#3e8bff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
     <path d="M40 30 V210 H390" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  step: () =>
    `<path d="M40 30 V210 H390" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M40 110 H390" stroke="#8d88a3" stroke-width="2.5" stroke-dasharray="6 8"/>
     <path d="M40 210 C 70 210, 80 40, 120 60 S 170 140, 200 110 S 250 96, 280 112 S 340 110, 390 110" fill="none" stroke="#2fbf71" stroke-width="5.5" stroke-linecap="round"/>`,
  field: () => {
    let s = '';
    for (let i = 0; i < 7; i++) {
      const dy = (i - 3) * 26;
      s += `<path d="M140 120 C 200 ${120 + dy * 2.4}, 240 ${120 + dy * 2.4}, 300 120" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".6"/>`;
    }
    s += `<circle cx="140" cy="120" r="22" fill="#ff5d8f" stroke="${INK}" stroke-width="3.5"/><path d="M130 120h20M140 110v20" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle cx="300" cy="120" r="22" fill="#3e8bff" stroke="${INK}" stroke-width="3.5"/><path d="M290 120h20" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  },
  bode: () =>
    `<path d="M40 30 V210 H390" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M40 70 H170 L290 170 L390 210" fill="none" stroke="#ff5d8f" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
     <circle cx="170" cy="70" r="9" fill="#ffc234" stroke="${INK}" stroke-width="3"/><circle cx="290" cy="170" r="9" fill="#ffc234" stroke="${INK}" stroke-width="3"/>
     <path d="M40 76 C 120 80, 160 90, 200 112 S 300 168, 390 204" fill="none" stroke="#8d88a3" stroke-width="2.5" stroke-dasharray="6 7"/>`,
  crew: () => '',
  bars: () =>
    [60, 95, 80, 140, 120, 175]
      .map((h, i) => `<rect x="${60 + i * 52}" y="${210 - h}" width="34" height="${h}" rx="6" fill="${['#2fbf71', '#ff5d8f', '#3e8bff', '#ffc234'][i % 4]}" stroke="${INK}" stroke-width="3"/>`)
      .join('') + `<path d="M40 210 H390" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
};

export function cover(post, { size = 'card' } = {}) {
  const { who, tint, motif } = post.cover;
  const id = `g-${post.slug}-${size}`;
  const mascot =
    motif === 'crew'
      ? ['nyq', 'polly', 'ozzy', 'cubert']
          .map((w, i) => `<g transform="translate(${50 + i * 90} ${70 + (i % 2) * 24}) scale(1.25)">${crew[w]({ label: '' }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`)
          .join('')
      : `<g transform="translate(330 120) scale(1.55) rotate(${who === 'polly' ? 8 : -6} 32 32)">${crew[who]({ label: '', mood: 'happy' }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`;
  return `<svg class="cover" viewBox="0 0 440 240" preserveAspectRatio="xMaxYMid slice" role="img" aria-label="Illustration for ${post.title.replace(/"/g, '')}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(120,186,214,.45)" stroke-width="1"/></pattern></defs>
    <rect width="440" height="240" fill="${tint}"/><rect width="440" height="240" fill="url(#${id})"/>
    ${MOTIFS[motif]?.() ?? ''}
    ${mascot}
  </svg>`;
}
