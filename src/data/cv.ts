// Everything here comes from Atul's CV. Edit this file to update the portfolio's content.

/**
 * Private contact details come from `.env` (see `.env.example`), so they are not in the repo.
 * Vite bakes VITE_* values into the build; scripts that run under Node read process.env.
 */
function env(key: string): string {
  const fromVite = (import.meta.env as Record<string, string | undefined> | undefined)?.[key];
  const fromNode = typeof process === 'undefined' ? undefined : process.env[key];
  return (fromVite ?? fromNode ?? '').trim();
}

export const profile = {
  name: 'Atul Bhadoriya',
  first: 'Atul',
  role: 'Senior Mobile Engineer',
  tagline: 'I build Flutter and React Native apps that start fast, stay up, and ship every sprint.',
  location: 'Delhi, India',
  /** The year his career started: the Android internship in December 2021. */
  since: 2021,
  /** VITE_CONTACT_EMAIL in .env. Empty when unset: Mail and the ID card then hide it. */
  email: env('VITE_CONTACT_EMAIL'),
  /** VITE_CONTACT_PHONE in .env. Only the résumé shows it; optional. */
  phone: env('VITE_CONTACT_PHONE'),
  linkedin: 'https://linkedin.com/in/winlooper',
  linkedinLabel: 'linkedin.com/in/winlooper',
  github: 'https://github.com/Atulwinlooper',
  githubUser: 'Atulwinlooper',
  languages: ['English (fluent)', 'Hindi (native)'],
  summary:
    'Senior Mobile Engineer with 5+ years of experience designing, developing and delivering production-grade cross-platform mobile apps with Flutter and React Native. I work in Clean Architecture, BLoC, TypeScript and modular design, automate CI/CD, and own Android and iOS releases end to end, across enterprise SaaS, government, social and commerce.',
};

/**
 * Projects are described without product, client or employer names (they are under NDA).
 * Each one: what the product is, Atul's role, the engineering problems and the outcome.
 */
export type Project = {
  id: string;
  short: string;
  name: string;
  domain: string;
  category: 'Enterprise' | 'Commerce' | 'Government' | 'Social';
  tech: 'Flutter' | 'React Native';
  color: string;
  ink: string;
  /** Who used it, at what scale. */
  scale: string;
  role: string;
  platforms: string;
  summary: string;
  challenges: { title: string; text: string }[];
  outcome: string;
  /** One factual line for the résumé (from the CV, no client names). */
  brief: string;
  stack: string[];
};

export const projects: Project[] = [
  {
    id: 'quality',
    short: 'QM',
    name: 'Quality management for manufacturers',
    domain: 'Enterprise SaaS',
    category: 'Enterprise',
    tech: 'React Native',
    color: '#FF7A3D',
    ink: '#160C07',
    scale: 'Rolled out to ten enterprise customers',
    role: 'Mobile engineer, architecture to store',
    platforms: 'Android and iOS',
    summary:
      'A B2B app that takes quality checks off clipboards and onto phones. Inspectors on the factory floor run audits, log non-conformances with photos, and follow corrective actions through to closure, while managers see the same status live on the web platform.',
    challenges: [
      {
        title: 'Live status across devices',
        text: 'A WebSocket channel keeps audit status in step between phones and the web dashboard, with REST for everything that does not need to be live.',
      },
      {
        title: 'Screens assembled, not rebuilt',
        text: 'A typed, shared component library covers forms, checklists and media capture, so each new module reuses the same building blocks.',
      },
      {
        title: 'Releases nobody has to babysit',
        text: 'Fastlane lanes build, sign and ship both platforms from one command, and Sentry alerts surface crashes before a customer reports them.',
      },
    ],
    outcome:
      'Release day went from a manual checklist to a single command, and production issues fell steadily from one release to the next.',
    brief:
      'Built a B2B quality-management app end to end for 10 enterprise customers, with a shared component library, Fastlane releases and Sentry monitoring.',
    stack: ['React Native', 'TypeScript', 'Redux', 'REST', 'WebSocket', 'Sentry', 'Fastlane'],
  },
  {
    id: 'shop',
    short: 'SH',
    name: 'Consumer shopping app',
    domain: 'eCommerce',
    category: 'Commerce',
    tech: 'Flutter',
    color: '#E3A93E',
    ink: '#2A1A04',
    scale: 'Used by more than 10,000 shoppers',
    role: 'Mobile developer',
    platforms: 'Android and iOS',
    summary:
      'A shopping app for browsing a large catalogue, building a cart and paying in-app, with order updates and offers delivered as push notifications.',
    challenges: [
      {
        title: 'A checkout that cannot double-charge',
        text: 'Payment flows are modelled as explicit states in BLoC, so a dropped connection or a back-press mid-payment always resolves to one clear order state.',
      },
      {
        title: 'Notifications people want',
        text: 'Firebase Cloud Messaging topics separate order updates from promotions, so transactional messages are never buried.',
      },
      {
        title: 'Hands-off Android releases',
        text: 'GitHub Actions builds, signs and uploads every release, so shipping stopped depending on one person’s laptop.',
      },
    ],
    outcome: 'A production app serving 10,000+ users, released on an automated pipeline.',
    brief:
      'Built a production Flutter shopping app for 10,000+ users, with payment gateway checkout, Firebase Cloud Messaging and automated Android deployment.',
    stack: ['Flutter', 'Dart', 'BLoC', 'REST', 'Payment gateway', 'Firebase', 'GitHub Actions'],
  },
  {
    id: 'fashion',
    short: 'FM',
    name: 'B2B and B2C fashion marketplace',
    domain: 'Fashion commerce',
    category: 'Commerce',
    tech: 'Flutter',
    color: '#D9798E',
    ink: '#2A0B14',
    scale: 'Retail shoppers and wholesale buyers',
    role: 'Senior Flutter developer, led the mobile apps',
    platforms: 'Android and iOS',
    summary:
      'One platform with two storefronts: wholesale buyers placing bulk orders and shoppers buying retail. Both run on a single Flutter codebase, with live inventory and in-app payments.',
    challenges: [
      {
        title: 'Two products, one codebase',
        text: 'Clean Architecture with feature modules keeps the wholesale and retail experiences separate where they differ and shared where they do not.',
      },
      {
        title: 'A fast first screen',
        text: 'Deferred initialisation, a lighter first frame and image caching made cold start noticeably quicker, about 30% by the team’s measurements.',
      },
      {
        title: 'A widget kit for the whole team',
        text: 'Product cards, filters, size pickers and checkout steps live in one tested library, so new screens take days, not weeks.',
      },
    ],
    outcome: 'Both storefronts shipped and maintained on the App Store and Google Play.',
    brief:
      'Led B2B and B2C fashion commerce apps on Clean Architecture and BLoC; cut startup time by 30% and shipped to the App Store and Google Play.',
    stack: [
      'Flutter',
      'Dart',
      'Clean Architecture',
      'BLoC',
      'WebSocket',
      'Payment gateway',
      'GitHub Actions',
    ],
  },
  {
    id: 'public',
    short: 'GV',
    name: 'Citizen services for public agencies',
    domain: 'Government',
    category: 'Government',
    tech: 'Flutter',
    color: '#7FB7C9',
    ink: '#0B1A1F',
    scale: 'Two government agencies',
    role: 'Led architecture and development',
    platforms: 'Android',
    summary:
      'Mobile apps that let citizens sign in securely, fill in official forms and submit documents to two public agencies, without a visit to an office.',
    challenges: [
      {
        title: 'Security from the first line',
        text: 'Token-based authentication, encrypted storage for credentials and strict input validation on every form, reviewed against the agencies’ security requirements.',
      },
      {
        title: 'Fast on modest phones',
        text: 'Leaner API payloads and fewer round trips made screens load quicker on the low-end devices and slow networks many citizens use.',
      },
      {
        title: 'Built to outlast the team',
        text: 'Clean Architecture with clear layers, so the agencies’ apps can be maintained and extended long after launch.',
      },
    ],
    outcome:
      'Both apps passed security review and run in production, with a much smaller set of findings than earlier builds.',
    brief:
      'Led the architecture of apps for two government agencies; secure authentication and input validation cut vulnerabilities by 40%.',
    stack: ['Flutter', 'Dart', 'Clean Architecture', 'REST', 'Secure storage'],
  },
  {
    id: 'community',
    short: 'CM',
    name: 'Community social app',
    domain: 'Social',
    category: 'Social',
    tech: 'React Native',
    color: '#8A8FD9',
    ink: '#0E1030',
    scale: 'A community of 1,000+ members',
    role: 'Mobile developer',
    platforms: 'Android and iOS',
    summary:
      'A social app with profiles, a feed and posts with photos and video, plus push notifications that bring members back when something happens.',
    challenges: [
      {
        title: 'Media that uploads reliably',
        text: 'Camera capture, compression before upload, and progress with retry, so posts survive patchy mobile connections.',
      },
      {
        title: 'Simple, predictable state',
        text: 'Hookstate keeps feed and profile state small and local, with reusable components shared across screens.',
      },
      {
        title: 'Automated deployments',
        text: 'Android builds go out through GitHub Actions on every release.',
      },
    ],
    outcome: 'Shipped and grown to a community of more than a thousand members.',
    brief:
      'Built social networking features for 1,000+ members: push notifications, camera capture and media upload.',
    stack: ['React Native', 'Hookstate', 'REST', 'Push notifications', 'GitHub Actions'],
  },
];

export type Job = {
  role: string;
  company: string;
  start: string;
  end: string;
  current?: boolean;
  points: string[];
  stack: string;
  /** Release-history codename for this chapter. */
  codename: string;
  /** Tools used in this role (drives the diff between versions). */
  tools: string[];
};

export const jobs: Job[] = [
  {
    role: 'Software Engineer',
    company: 'Pixelque Pvt. Ltd.',
    codename: 'Autopilot',
    tools: ['React Native', 'TypeScript', 'Redux', 'WebSocket', 'Sentry', 'Fastlane', 'Agile'],
    start: 'Aug 2025',
    end: 'Present',
    current: true,
    stack: 'React Native',
    points: [
      'Own production React Native enterprise apps for B2B customers, from architecture to store.',
      'Improved stability by 30% with Sentry monitoring and performance work.',
      'Cut development effort by 40% with reusable components and modular architecture.',
      'Made release cycles 60% faster with Fastlane deployment pipelines.',
      'Delivered 20 production features with Product, QA, Backend and Design in Agile sprints.',
    ],
  },
  {
    role: 'Senior Flutter Developer',
    company: 'Lovoj Technology Pvt. Ltd.',
    codename: 'Runway',
    tools: [
      'Flutter',
      'Dart',
      'BLoC',
      'Clean Architecture',
      'WebSocket',
      'Payment gateways',
      'GitHub Actions',
      'App Store',
    ],
    start: 'Oct 2023',
    end: 'Jul 2025',
    stack: 'Flutter · BLoC',
    points: [
      'Led Flutter B2B and B2C fashion commerce apps on Clean Architecture and BLoC.',
      'Cut app startup time by 30% through rendering optimisation and performance tuning.',
      'Improved development efficiency by 45% with reusable widgets and modular components.',
      'Shipped Android and iOS releases and raised quality through code reviews.',
    ],
  },
  {
    role: 'Mobile Application Developer',
    company: 'Perfect Ergonomics Pvt. Ltd.',
    codename: 'Hardened',
    tools: ['Flutter', 'Dart', 'Clean Architecture', 'REST', 'Secure auth'],
    start: 'Jun 2023',
    end: 'Oct 2023',
    stack: 'Flutter · Clean Architecture',
    points: [
      'Led architecture and development of government apps with Flutter and Clean Architecture.',
      'Cut security vulnerabilities by 40% with secure authentication and input validation.',
      'Improved app performance by 30% through API optimisation.',
    ],
  },
  {
    role: 'Mobile Application Developer',
    company: 'Codenia Technologies LLP',
    codename: 'Two Frameworks',
    tools: [
      'Flutter',
      'React Native',
      'REST',
      'Payment gateways',
      'Push notifications',
      'GitHub Actions',
    ],
    start: 'Mar 2022',
    end: 'Jun 2023',
    stack: 'Flutter · React Native',
    points: [
      'Built production apps for social networking and eCommerce in Flutter and React Native.',
      'Integrated REST APIs, payment gateways, push notifications and media.',
      'Supported Android production deployments with GitHub Actions.',
    ],
  },
  {
    role: 'Android Developer Intern',
    company: 'DGTLmart (Khetan Enterprises)',
    codename: 'Hello, World',
    tools: ['Android', 'Android Studio', 'REST', 'Git'],
    start: 'Dec 2021',
    end: 'Jun 2022',
    stack: 'Android',
    points: [
      'Built screens and features for production Android apps at DGTLmart.',
      'Fixed bugs and improved UI quality across releases.',
      'Learned the release loop end to end: builds, testing and Play Store publishing.',
    ],
  },
];

export const education = [
  {
    degree: 'Master of Computer Applications (MCA)',
    school: "Lingaya's Vidyapeeth, Haryana",
    years: '2017 – 2020',
    note: 'GPA 9.3 / 10',
  },
  {
    degree: 'Bachelor of Computer Applications (BCA)',
    school: 'D.A.V. Centenary College, Haryana',
    years: '2015 – 2018',
    note: '',
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Mobile', items: ['Flutter', 'React Native', 'React'] },
  { group: 'Languages', items: ['Dart', 'TypeScript', 'JavaScript (ES6+)', 'Node.js (basic)'] },
  {
    group: 'Architecture',
    items: [
      'Clean Architecture',
      'Modular Architecture',
      'Component-based design',
      'BLoC',
      'Redux',
      'Hookstate',
      'React Context API',
    ],
  },
  { group: 'API and backend', items: ['REST APIs', 'WebSocket', 'Payment gateways'] },
  { group: 'CI/CD', items: ['GitHub Actions', 'Fastlane', 'Bitrise', 'Git'] },
  {
    group: 'Platforms',
    items: ['Android Studio', 'Xcode', 'Google Play Console', 'App Store Connect'],
  },
  {
    group: 'Testing and monitoring',
    items: [
      'Jest',
      'React Native Testing Library',
      'Firebase',
      'Sentry',
      'Crash monitoring',
      'Performance optimisation',
    ],
  },
  {
    group: 'Practices',
    items: [
      'Agile',
      'Scrum',
      'Code reviews',
      'Release management',
      'Cross-functional collaboration',
    ],
  },
];

export const techniques = [
  {
    name: 'Release Automation',
    value: '−60%',
    pct: 60,
    tools: 'Fastlane · GitHub Actions · Bitrise',
    effect: 'Release cycle time on an enterprise app',
  },
  {
    name: 'Component Forge',
    value: '−50%',
    pct: 50,
    tools: 'Reusable components · modular design',
    effect: 'Development effort on an enterprise platform',
  },
  {
    name: 'Performance Tuning',
    value: '+42%',
    pct: 42,
    tools: 'Rendering · API optimisation',
    effect: 'Speed gain on the government platform',
  },
  {
    name: 'Secure Coding',
    value: '−40%',
    pct: 40,
    tools: 'Secure auth · input validation',
    effect: 'Vulnerabilities on government apps',
  },
  {
    name: 'Crash Watch',
    value: '+30%',
    pct: 30,
    tools: 'Sentry · Firebase',
    effect: 'Crash-free stability on an enterprise app',
  },
];
