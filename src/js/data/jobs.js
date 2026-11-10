// Open roles. In production this is pulled from the ATS; the shape matches.

export const TEAMS = ['Engineering', 'Learning', 'Design', 'Operations'];
export const LOCATIONS = ['Pittsburgh', 'Remote (US)', 'Remote (Americas)'];

const BENEFITS_NOTE = 'Full benefits, equity, and a $1,500 yearly learning budget (textbooks count).';

export const JOBS = [
  {
    id: 'ml-learner-modeling',
    title: 'Machine Learning Engineer, Learner Modeling',
    team: 'Engineering',
    location: 'Pittsburgh',
    type: 'Full-time',
    salary: '$175,000 – $215,000',
    posted: '2026-10-30',
    summary: 'Own the models that predict what each learner is about to forget, and decide what goes in tomorrow’s quiz.',
    about:
      'Our scheduler models memory for millions of concept-learner pairs and shares information along a prerequisite graph. You will improve how we estimate stability, how we pick question types, and how we evaluate all of it against real retention outcomes.',
    doing: [
      'Design and ship memory and knowledge-tracing models that run for every learner, every day.',
      'Build offline evaluation that predicts retention, not just next-question accuracy.',
      'Run careful experiments with the learning science team and write up what you find.',
      'Work with curriculum to turn the prerequisite graph into something models can learn from.',
    ],
    need: [
      '4+ years building and shipping ML systems in production.',
      'Comfort with probabilistic modeling: Bayesian methods, survival models, or similar.',
      'Strong Python and SQL; experience with PyTorch or JAX.',
      'A habit of checking whether a metric actually measures what you care about.',
    ],
    nice: ['Background in educational data mining or psychometrics.', 'An engineering degree you still half-remember.'],
  },
  {
    id: 'ios-engineer',
    title: 'Senior iOS Engineer',
    team: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$165,000 – $200,000',
    posted: '2026-10-21',
    summary: 'Build the interactive question types (Bode plots, s-plane taps, field sketches) that make Nyquisition feel like a game.',
    about:
      'The iOS app is where most learners spend their five minutes. You will own interaction-heavy features end to end, from gesture handling and haptics to offline sync, alongside a designer and a curriculum engineer.',
    doing: [
      'Build new question types with SwiftUI, Core Animation and Metal where it matters.',
      'Make lessons work offline and sync streaks and notes reliably.',
      'Keep the app fast on four-year-old phones.',
      'Pair with design on motion and haptics until it feels right.',
    ],
    need: ['5+ years of iOS development with Swift and SwiftUI.', 'Shipped, polished, interaction-heavy UI.', 'Care for accessibility: VoiceOver, Dynamic Type, reduced motion.'],
    nice: ['Experience with Metal or SpriteKit.', 'Built something with a physics engine for fun.'],
  },
  {
    id: 'curriculum-control',
    title: 'Curriculum Engineer, Control Systems',
    team: 'Learning',
    location: 'Remote (Americas)',
    type: 'Full-time',
    salary: '$120,000 – $150,000',
    posted: '2026-10-14',
    summary: 'Turn control theory into hundreds of short, interactive questions that people actually remember.',
    about:
      'You will write and maintain the control systems course: units, questions, explanations and the interactive notes Cubert saves. You will work from real learner data to find what confuses people and fix it.',
    doing: [
      'Write questions, explanations and worked notes for control theory units.',
      'Spec new interactive question types with design and engineering.',
      'Read the data on what people get wrong and rewrite accordingly.',
      'Review AI-generated question variants for correctness and clarity.',
    ],
    need: [
      'A degree in electrical, mechanical or aerospace engineering, or equivalent.',
      'Deep comfort with classical and state-space control.',
      'Experience teaching: TA, tutor, instructor, or writing technical content people liked.',
    ],
    nice: ['Experience with MATLAB or Python control libraries.', 'Strong opinions about root locus sketching rules.'],
  },
  {
    id: 'content-lead-em',
    title: 'Content Lead, Electromagnetics',
    team: 'Learning',
    location: 'Pittsburgh',
    type: 'Full-time',
    salary: '$130,000 – $160,000',
    posted: '2026-09-29',
    summary: 'Lead the E&M course from vector calculus to transmission lines, and hire the people who write it with you.',
    about:
      'Electromagnetics just left beta. You will own its quality and roadmap, build a small team of curriculum engineers, and work closely with design to make fields and waves something you can poke.',
    doing: ['Own the E&M curriculum roadmap.', 'Hire and mentor two to three curriculum engineers.', 'Partner with design on simulations for fields, waves and transmission lines.'],
    need: ['Graduate-level E&M background.', 'Experience leading writers, TAs or a teaching team.', 'Clear, plain writing about hard ideas.'],
    nice: ['RF or antenna industry experience.', 'Has strong feelings about the Smith chart.'],
  },
  {
    id: 'product-designer',
    title: 'Product Designer, Interactive Learning',
    team: 'Design',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$140,000 – $175,000',
    posted: '2026-10-07',
    summary: 'Design the questions, notes and simulations that turn dense engineering into something playful.',
    about:
      'You will design across iOS, Android and web, prototyping in code or high-fidelity tools until interactions feel right. You will work with curriculum engineers on what to teach and with engineers on how to build it.',
    doing: ['Design new question types and interactive notes.', 'Prototype motion and interaction, not just static screens.', 'Run quick tests with learners every week.', 'Evolve the crew: expressions, animations and where they show up.'],
    need: ['A portfolio of shipped interactive products.', 'Prototyping skill in code, Figma, Rive or similar.', 'Comfort with technical subject matter.'],
    nice: ['Background in engineering, math or physics.', 'Game design experience.'],
  },
  {
    id: 'motion-3d',
    title: 'Motion and 3D Designer',
    team: 'Design',
    location: 'Remote (Americas)',
    type: 'Contract, 6 months',
    salary: '$85 – $110 / hour',
    posted: '2026-09-18',
    summary: 'Bring the crew to life in low-poly 3D and 2D animation for the app, web and video.',
    about:
      'Nyq, Polly, Ozzy and Cubert are made of simple shapes and a lot of motion. You will build their animation library and help us make low-poly 3D work everywhere from the website to app celebrations.',
    doing: ['Build a library of character animations.', 'Create low-poly 3D assets for web (three.js) and app.', 'Design celebration moments: streaks, unit completions, perfect lessons.'],
    need: ['A reel with character animation.', 'Blender or similar 3D tooling.', 'Experience exporting for real-time (glTF, Rive, Lottie).'],
    nice: ['Shader or three.js experience.'],
  },
  {
    id: 'backend-platform',
    title: 'Backend Engineer, Platform',
    team: 'Engineering',
    location: 'Pittsburgh',
    type: 'Full-time',
    salary: '$160,000 – $195,000',
    posted: '2026-08-26',
    summary: 'Keep streaks, notes and daily quizzes fast and reliable for a learner base that doubles every few months.',
    about:
      'Our backend is TypeScript and Go on Postgres, with a scheduling pipeline that builds every learner’s quiz overnight. You will own reliability, data models and the APIs the apps depend on.',
    doing: ['Scale the nightly quiz generation pipeline.', 'Design APIs for new question types and notes.', 'Own on-call with a small, calm rotation.'],
    need: ['4+ years of backend engineering.', 'Strong Postgres and data modeling skills.', 'Experience with Go or TypeScript in production.'],
    nice: ['Experience with event-driven systems.', 'You have opinions about time zones and streaks.'],
  },
  {
    id: 'learning-scientist',
    title: 'Learning Scientist',
    team: 'Learning',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$135,000 – $165,000',
    posted: '2026-08-12',
    summary: 'Design the studies that tell us whether people actually remember more, and publish what we learn.',
    about:
      'We make strong claims about retention, so we have to measure it properly. You will design experiments, define outcome measures and work with ML on models of memory and transfer.',
    doing: ['Design and analyze retention and transfer studies.', 'Define how we measure learning, not just engagement.', 'Partner with universities on research, and publish.'],
    need: ['PhD in cognitive psychology, education or a related field, or equivalent experience.', 'Experience with spacing, retrieval practice or related research.', 'Strong statistics (R or Python).'],
    nice: ['Experience in STEM education specifically.'],
  },
  {
    id: 'community-manager',
    title: 'Community Manager',
    team: 'Operations',
    location: 'Remote (Americas)',
    type: 'Full-time',
    salary: '$85,000 – $105,000',
    posted: '2026-07-31',
    summary: 'Grow and look after the community of students and engineers who keep their streaks together.',
    about:
      'Our learners already share streaks, memes about Polly and study tips. You will give that a home, run events with student engineering societies and bring what you hear back to the product team.',
    doing: ['Run our Discord and social channels.', 'Partner with engineering student societies.', 'Bring learner feedback to product every week.'],
    need: ['Experience running an online community.', 'Clear, warm writing.', 'Comfort around engineering students and their humour.'],
    nice: ['An engineering background.'],
  },
].map((j) => ({ ...j, benefits: BENEFITS_NOTE }));

export const jobById = (id) => JOBS.find((j) => j.id === id);
