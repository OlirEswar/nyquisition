// Blog content. In production this comes from the CMS; the shape matches.

export const AUTHORS = {
  maya: { name: 'Maya Okafor', role: 'Learning science lead', who: 'ozzy' },
  tom: { name: 'Tomás Reyes', role: 'Curriculum, control systems', who: 'nyq' },
  ines: { name: 'Inés Varga', role: 'Product designer', who: 'polly' },
  sam: { name: 'Sam Whitfield', role: 'Co-founder', who: 'cubert' },
  lee: { name: 'Lee Park', role: 'Curriculum, electromagnetics', who: 'ozzy' },
};

export const CATEGORIES = ['Learning science', 'Study guides', 'Inside Nyquisition'];

export const POSTS = [
  {
    slug: 'nyquist-rate-of-memory',
    title: 'The Nyquist rate of memory',
    excerpt: 'Sample a signal too slowly and you lose it. The same is true of the things you learn. Here is how our scheduler decides when to quiz you.',
    category: 'Learning science',
    author: 'maya',
    date: '2026-10-28',
    mins: 7,
    featured: true,
    cover: { who: 'ozzy', tint: '#dbe9ff', motif: 'samples' },
    body: `
<p>Every engineer learns the sampling theorem at some point: if you want to reconstruct a signal, you need to sample it at more than twice its highest frequency. Sample slower and the signal aliases into something it isn't.</p>
<p>Memory behaves a lot like this. Each idea you learn starts to fade the moment you stop using it. Check in on it often enough and it stays intact. Wait too long and what comes back is a distorted version: the sign error, the missing factor of 2π, the half-remembered rule about when the Nyquist plot encircles −1.</p>
<h2>A memory model for every concept</h2>
<p>Nyquisition keeps a small model for every concept you've seen. Each model tracks one main number, <strong>stability</strong>: roughly how many days it takes for your chance of recalling that idea to drop to 80%.</p>
<p>When you answer correctly, stability grows. How much depends on how hard the question was and how close you were to forgetting. A correct answer on an idea you were about to lose teaches the model (and you) much more than an answer on something you saw yesterday.</p>
<blockquote>The best time to review is just before you'd forget. Earlier wastes your time; later means re-learning.</blockquote>
<h2>Concepts aren't independent</h2>
<p>Engineering knowledge is a graph. Inverse Laplace transforms depend on partial fractions, which depend on algebra you did in high school. When you miss a question about step responses, the cause might sit two levels down.</p>
<p>So our models share information along the prerequisite graph. A weak prerequisite lowers our confidence in everything built on it, which is why you sometimes get a quick partial-fractions warm-up before a control systems question.</p>
<h2>What this means for your five minutes</h2>
<ul>
<li>About a third of each daily quiz is new material.</li>
<li>The rest is review, chosen from the concepts with the lowest predicted recall.</li>
<li>Review questions change form, so you're recalling the idea, not the question.</li>
</ul>
<p>In our beta, learners who kept a streak for 30 days remembered 3.4× as many concepts on a surprise test as a control group who studied the same material in one long session.</p>`,
  },
  {
    slug: 'five-minutes-vs-an-hour',
    title: 'Why five minutes beats an hour of re-reading',
    excerpt: 'Re-reading feels productive and mostly isn’t. Retrieval practice feels hard and works. A short tour of the research behind daily quizzes.',
    category: 'Learning science',
    author: 'maya',
    date: '2026-10-09',
    mins: 5,
    cover: { who: 'cubert', tint: '#fff1c7', motif: 'curve' },
    body: `
<p>Ask students how they study for an exam and most will say they re-read their notes and highlight. It's comfortable: the material looks familiar, so it feels learned.</p>
<p>Familiarity isn't the same as being able to use something. Decades of research on <strong>retrieval practice</strong> show that pulling information out of memory, even when it's effortful and you sometimes fail, strengthens it far more than reading it again.</p>
<h2>Desirable difficulty</h2>
<p>The psychologists Robert and Elizabeth Bjork call this a <em>desirable difficulty</em>: conditions that make learning feel slower in the moment but make it last. Spacing practice out, mixing problem types, and testing yourself all qualify.</p>
<h2>Why short and daily wins</h2>
<p>An hour once a week is one retrieval event per idea. Five minutes every day spreads those retrievals out, and spacing is the other half of the effect. Short sessions also fit around a lab, a job or a commute, so you actually do them.</p>
<h2>What we changed because of it</h2>
<ul>
<li>We almost never show you an explanation before asking a question. You try first, then we explain.</li>
<li>Getting things wrong is expected. A good daily quiz has an accuracy of around 80%, not 100%.</li>
<li>Hints cost nothing, but we track them, so a hinted answer counts as a weaker retrieval.</li>
</ul>
<p>If a lesson feels a bit hard, that's the point.</p>`,
  },
  {
    slug: 'control-ideas-everyone-forgets',
    title: 'Five control theory ideas everyone forgets',
    excerpt: 'From the meaning of a pole to why phase margin matters, these are the concepts our learners miss most often six months after their course.',
    category: 'Study guides',
    author: 'tom',
    date: '2026-09-22',
    mins: 8,
    sim: 'step',
    cover: { who: 'nyq', tint: '#d9f5e3', motif: 'step' },
    body: `
<p>We looked at which control systems questions our learners got wrong most often, months after they'd first answered them correctly. Five ideas came up again and again.</p>
<h2>1. A pole is a mode of behaviour, not just a root</h2>
<p>Each pole contributes a term like e<sup>pt</sup> to the response. Its real part sets how fast that term grows or decays; its imaginary part sets how fast it oscillates. Once you see poles as behaviours, the s-plane becomes a map of how a system moves.</p>
<h2>2. Damping ratio sets overshoot, by itself</h2>
<p>For a standard second-order system, percent overshoot depends only on ζ. Natural frequency changes how fast everything happens, not the shape. Try it in the plot below: change ωₙ and the overshoot readout doesn't move.</p>
<div data-embed="step"></div>
<h2>3. Steady-state error depends on system type</h2>
<p>Count the integrators (poles at the origin) in the open loop. Type 0 tracks a step with finite error, type 1 tracks a step perfectly and a ramp with finite error. The final value theorem gives the exact number.</p>
<h2>4. Phase margin is the real stability budget</h2>
<p>Gain margin gets more attention, but phase margin predicts how much a closed loop will ring. A rule of thumb that holds up surprisingly well: ζ ≈ PM / 100 for phase margins under about 60°.</p>
<h2>5. The Nyquist criterion counts encirclements</h2>
<p>Z = N + P. Closed-loop unstable poles equal clockwise encirclements of −1 plus open-loop unstable poles. Most mistakes come from forgetting P when the open loop is itself unstable.</p>
<p>All five now appear more often in the review queue for anyone who has finished the relevant units.</p>`,
  },
  {
    slug: 'gauss-law-visually',
    title: 'Gauss’s law, visually',
    excerpt: 'Flux through a closed surface depends only on the charge inside. Drag some charges around and see why outside charges cancel out.',
    category: 'Study guides',
    author: 'lee',
    date: '2026-09-04',
    mins: 6,
    sim: 'field',
    cover: { who: 'polly', tint: '#ffe0ea', motif: 'field' },
    body: `
<p>Gauss's law is short enough to fit on a sticky note: the electric flux through any closed surface equals the enclosed charge divided by ε₀. It's also one of the most commonly misremembered results in a first E&amp;M course.</p>
<h2>Flux as counting field lines</h2>
<p>Think of flux as the number of field lines poking out through a surface, minus the number poking in. A positive charge sends lines outward. A negative charge pulls them in.</p>
<div data-embed="field"></div>
<h2>Why charges outside don't count</h2>
<p>Draw any closed surface that doesn't contain a particular charge. Every field line from that charge that enters the surface has to leave it somewhere else. In minus out is zero. That's the whole argument, and it doesn't depend on the surface's shape.</p>
<h2>Where people slip up</h2>
<ul>
<li><strong>Zero flux doesn't mean zero field.</strong> The field on the surface can be large; it just integrates to zero.</li>
<li><strong>Symmetry is what makes it useful.</strong> Gauss's law is always true, but it only gives you E directly when symmetry lets you pull E out of the integral.</li>
<li><strong>Conductors.</strong> In electrostatics, E is zero inside a conductor, so any excess charge must live on the surface.</li>
</ul>`,
  },
  {
    slug: 'drawing-bode-plots-in-four-taps',
    title: 'Drawing a Bode plot in four taps',
    excerpt: 'Most learning apps ask multiple choice questions. We wanted you to sketch asymptotes on a phone. Here’s how we designed the interaction.',
    category: 'Inside Nyquisition',
    author: 'ines',
    date: '2026-08-18',
    mins: 6,
    cover: { who: 'polly', tint: '#ffe0ea', motif: 'bode' },
    body: `
<p>Engineering is full of things you draw: Bode plots, root loci, free-body diagrams, field lines. Multiple choice can test whether you recognise the right drawing, but recognising and producing are different skills.</p>
<h2>The constraint: a thumb on a phone</h2>
<p>Freehand sketching on a 6-inch screen is miserable, and grading a freehand sketch is worse. We needed something between free drawing and picking from a list.</p>
<h2>Snap to what matters</h2>
<p>A straight-line Bode magnitude plot is made of segments with slopes in multiples of 20 dB per decade, with corners at pole and zero frequencies. So instead of drawing, you <strong>tap the corner frequencies</strong> on a log axis and <strong>choose the slope</strong> after each one. Four taps draws most textbook problems.</p>
<h2>Feedback that shows the gap</h2>
<p>When you check your answer, we overlay the correct asymptotes in green on top of yours. Wrong corners wobble; wrong slopes get a small arrow showing which way to bend. It shows you exactly where your picture differs from the right one.</p>
<h2>What we learned in testing</h2>
<ul>
<li>People got faster at Bode plots on paper after two weeks of tapping them.</li>
<li>The most common mistake wasn't slopes; it was forgetting that a pole at the origin starts the line already sloping.</li>
<li>Haptics matter. A small tick on each snap made the whole thing feel like drawing with a ruler.</li>
</ul>`,
  },
  {
    slug: 'meet-the-crew',
    title: 'Designing characters out of math symbols',
    excerpt: 'Why our mascot is an op-amp, why Polly is unstable, and how we kept four very simple shapes expressive in both 2D and low-poly 3D.',
    category: 'Inside Nyquisition',
    author: 'ines',
    date: '2026-07-30',
    mins: 5,
    cover: { who: 'nyq', tint: '#d9f5e3', motif: 'crew' },
    body: `
<p>We wanted characters that an engineer would recognise immediately and that a five-year-old could draw. That ruled out anything with hands.</p>
<h2>One symbol, one personality</h2>
<p><strong>Nyq</strong> is an op-amp: the triangle from every circuit diagram, pointing forward. It amplifies, so it's the encouraging one. <strong>Polly</strong> is the × you draw for a pole, and lives life a little too close to instability. <strong>Ozzy</strong> is the ○ for a zero, calm and good at cancelling things out. <strong>Cubert</strong> is a unit cube who takes notes.</p>
<h2>Expressive with almost nothing</h2>
<p>Each character has the same face kit: two eyes, a mouth, two cheek blushes. Everything else comes from motion: squash and stretch, a head tilt, Polly's wobble getting worse each time you poke her.</p>
<h2>2D and 3D from the same rules</h2>
<p>In the app the crew is flat; on our website they're low-poly 3D models with ink outlines. We kept the silhouettes identical and limited the 3D versions to the same five colours, so they read as the same characters at any size.</p>
<p>Fun fact: the outlines on the website redraw themselves six times a second, very slightly differently each time, so they look hand-drawn.</p>`,
  },
  {
    slug: 'beta-by-the-numbers',
    title: 'Our beta, by the numbers',
    excerpt: 'Eighteen thousand learners, 2.1 million questions, and the one feature request we heard more than any other.',
    category: 'Inside Nyquisition',
    author: 'sam',
    date: '2026-07-08',
    mins: 4,
    cover: { who: 'cubert', tint: '#fff1c7', motif: 'bars' },
    body: `
<p>Nyquisition opened its beta in January with control theory and a few hundred students. Six months later, here's where things stand.</p>
<h2>The numbers</h2>
<ul>
<li><strong>18,400</strong> active learners, about 60% students and 40% working engineers.</li>
<li><strong>2.1 million</strong> questions answered.</li>
<li><strong>41 days</strong>: the median streak among people who made it past their first week.</li>
<li><strong>312,000</strong> notes saved by Cubert, most often about Laplace transform pairs.</li>
</ul>
<h2>What surprised us</h2>
<p>We expected students cramming for exams. We didn't expect so many practising engineers using it to refresh what they learned ten years ago, often right before an interview or a design review.</p>
<h2>The most requested feature</h2>
<p>Signals and systems, by a wide margin. It's now live, along with circuits. Electromagnetics left beta last month.</p>
<h2>What's next</h2>
<p>Practice exams generated from your weak spots, classroom tools for instructors, and Android widgets so your streak lives on your home screen. Thanks for helping us build it.</p>`,
  },
  {
    slug: 'laplace-pairs-you-need',
    title: 'The only Laplace pairs you need to memorise',
    excerpt: 'Six transform pairs and three properties will get you through almost every inverse Laplace problem. Here they are, with ways to make them stick.',
    category: 'Study guides',
    author: 'tom',
    date: '2026-06-17',
    mins: 5,
    cover: { who: 'ozzy', tint: '#dbe9ff', motif: 'step' },
    body: `
<p>Laplace tables can run to dozens of entries. In practice, nearly every problem in an intro controls course reduces to a handful of pairs after partial fractions.</p>
<h2>The six pairs</h2>
<ul>
<li>δ(t) ↔ 1</li>
<li>u(t) ↔ 1/s</li>
<li>t·u(t) ↔ 1/s²</li>
<li>e<sup>−at</sup> ↔ 1/(s + a)</li>
<li>sin(ωt) ↔ ω/(s² + ω²)</li>
<li>cos(ωt) ↔ s/(s² + ω²)</li>
</ul>
<h2>The three properties</h2>
<ul>
<li><strong>Frequency shift:</strong> e<sup>−at</sup>f(t) ↔ F(s + a). This turns sin and cos into damped oscillations.</li>
<li><strong>Differentiation:</strong> f′(t) ↔ sF(s) − f(0).</li>
<li><strong>Time shift:</strong> f(t − T)u(t − T) ↔ e<sup>−sT</sup>F(s).</li>
</ul>
<h2>Making them stick</h2>
<p>Don't drill the table. Derive each pair once from the definition, then let the daily quiz ask you for them in both directions, mixed in with other material. After a few weeks you'll recognise them on sight.</p>`,
  },
];

export const postBySlug = (slug) => POSTS.find((p) => p.slug === slug);

export function formatDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
