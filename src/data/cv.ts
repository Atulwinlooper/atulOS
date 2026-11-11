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
  /** This site's source code. */
  source: 'https://github.com/Atulwinlooper/atulOS',
  languages: ['English (fluent)', 'Hindi (native)'],
  summary:
    'Senior Mobile Engineer with 5+ years of experience designing, developing and delivering production-grade cross-platform mobile apps with Flutter and React Native. I work in Clean Architecture, BLoC, TypeScript and modular design, automate CI/CD, and own Android and iOS releases end to end, across enterprise SaaS, government, social and commerce.',
};

/**
 * Most projects are described without product, client or employer names (they are under NDA).
 * Apps that are public and cleared to share are named, with their store links.
 * Each one: what the product is, Atul's role, the engineering problems and the outcome.
 */
export type Project = {
  id: string;
  short: string;
  name: string;
  domain: string;
  category: 'Enterprise' | 'Commerce' | 'Government' | 'Social' | 'Side projects';
  tech: 'Flutter' | 'React Native' | 'Android (Java)' | 'Web';
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
  /** Store listings, the live site or the source code, for work that can be named. */
  links?: { label: string; url: string }[];
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
    id: 'kapaas',
    short: 'KM',
    name: 'Kapaas Mitra',
    domain: 'Agriculture · Government',
    category: 'Government',
    tech: 'Flutter',
    color: '#7FB7C9',
    ink: '#0B1A1F',
    scale: 'Cotton farmers in a national productivity project · 1K+ installs, rated 4.5',
    role: 'Led architecture and development',
    platforms: 'Android',
    summary:
      'A Flutter app for the Confederation of Indian Textile Industry (CITI) and ICAR-Central Institute of Cotton Research, supporting a government cotton-productivity project under the National Food Security Mission. It brings cotton farmers the project’s recommended practices for their region.',
    challenges: [
      {
        title: 'Security from the first line',
        text: 'Token-based authentication, encrypted storage for credentials and strict input validation on every form, built to meet government security review.',
      },
      {
        title: 'Fast on modest phones',
        text: 'Leaner API payloads and fewer round trips, so screens load quickly on the low-end devices and slow rural networks many farmers use.',
      },
      {
        title: 'Built to outlast the team',
        text: 'Clean Architecture with clear layers, so the app can be maintained and extended long after launch.',
      },
    ],
    outcome:
      'Live on Google Play, rated 4.5 by farmers, and passed security review with far fewer findings than earlier builds.',
    brief:
      'Led architecture of government apps including Kapaas Mitra (cotton productivity, CITI and ICAR-CICR); secure authentication and input validation cut vulnerabilities by 40%.',
    stack: ['Flutter', 'Dart', 'Clean Architecture', 'REST', 'Secure storage'],
    links: [
      {
        label: 'Google Play',
        url: 'https://play.google.com/store/apps/details?id=com.mitra.kapas',
      },
    ],
  },
  {
    id: 'vpeeps',
    short: 'VP',
    name: 'VPeeps and the Viddi apps',
    domain: 'Social · Live video',
    category: 'Social',
    tech: 'Android (Java)',
    color: '#8A8FD9',
    ink: '#0E1030',
    scale: 'VPeeps: 100K+ installs on Google Play, plus three sister apps',
    role: 'Android developer: features, maintenance and releases',
    platforms: 'Android',
    summary:
      'A family of social apps from Viddi. VPeeps is a real-time social timeline with posts, reposts, replies and private chat; VPeepme is for short videos with music and effects; Park and Mirage Edge are music lounges where people video-chat, go live and listen to DJs together.',
    challenges: [
      {
        title: 'Video, live and chat',
        text: 'Built and maintained the video, live-streaming and chat features that sit at the centre of all four apps.',
      },
      {
        title: 'Four apps, one release rhythm',
        text: 'Owned Google Play releases across the family: builds, store listings and staged rollouts.',
      },
      {
        title: 'Growing without breaking',
        text: 'Added new features to live apps used by a large audience, fixing issues release by release instead of rewriting.',
      },
    ],
    outcome: 'VPeeps passed 100,000 installs on Google Play; all four apps are live on the store.',
    brief:
      'Android (Java) developer on VPeeps (100K+ installs), VPeepme, Park and Mirage Edge: video, live and chat features, and Play Store releases.',
    stack: ['Java', 'Android SDK', 'REST', 'Real-time video', 'Chat', 'Push notifications'],
    links: [
      {
        label: 'VPeeps',
        url: 'https://play.google.com/store/apps/details?id=com.corewebconnections.vpops',
      },
      { label: 'VPeepme', url: 'https://play.google.com/store/apps/details?id=com.vpeep.me' },
      { label: 'Park', url: 'https://play.google.com/store/apps/details?id=com.park.viddi' },
      {
        label: 'Mirage Edge',
        url: 'https://play.google.com/store/apps/details?id=com.edgewet.com',
      },
    ],
  },
  {
    id: 'easipaper',
    short: 'EP',
    name: 'EasiPaper',
    domain: 'Finance · Paperwork',
    category: 'Side projects',
    tech: 'Web',
    color: '#E8C76A',
    ink: '#2A2108',
    scale: '39 free tools for salary, tax, rent and HR paperwork in India',
    role: 'Founder: product, design and build',
    platforms: 'Web, mobile-friendly',
    summary:
      'My own product: 39 free calculators and document makers for everyday Indian paperwork. Rent receipts for HRA, old vs new tax regime, in-hand salary, invoices with GST, payslips (even in bulk from a CSV), and offer, relieving and experience letters.',
    challenges: [
      {
        title: 'Private by design',
        text: 'Every tool runs in the browser. There is no account and no server that sees what you type; saved details stay on your own device.',
      },
      {
        title: 'Four audiences, one site',
        text: 'Tools grouped for tenants, salaried employees, freelancers and HR teams, so each person finds their paperwork in a couple of taps.',
      },
      {
        title: 'Rules that change every year',
        text: 'Tax calculators follow FY 2026-27 under the Income-tax Act, 2025, with the logic kept in one place so yearly changes are quick.',
      },
    ],
    outcome: 'Live at easipaper.in: free, no sign-up, 39 tools and growing.',
    brief:
      'Built EasiPaper (easipaper.in), a free site of 39 browser-only calculators and document makers for Indian salary, tax, rent and HR paperwork.',
    stack: ['Web', 'Client-side only', 'PDF generation', 'Local storage', 'SEO'],
    links: [{ label: 'Visit easipaper.in', url: 'https://easipaper.in' }],
  },
  {
    id: 'netseye',
    short: 'NE',
    name: 'NetSeye',
    domain: 'Home security · Android TV',
    category: 'Side projects',
    tech: 'Flutter',
    color: '#5FB89A',
    ink: '#06221A',
    scale: 'Open source (MIT) · Android phones and Android TV',
    role: 'Sole developer',
    platforms: 'Android, Android TV',
    summary:
      'A Flutter app to watch CP Plus and other ONVIF / RTSP home cameras on phones and TVs over home Wi-Fi only: no internet, no cloud account, no server. The cameras stay viewable even when the internet is down.',
    challenges: [
      {
        title: 'Taming camera firmware',
        text: 'A small native relay keeps streams alive on CP Plus firmware that needs RTCP receiver reports, and repairs the malformed stream descriptions older firmware sends.',
      },
      {
        title: 'Built for the TV remote',
        text: 'Full D-pad control, a 2 × 2 camera wall and an on-screen keyboard designed for the remote, with quality that falls back when a TV’s decoder can’t keep up.',
      },
      {
        title: 'Smooth, small, secure',
        text: 'Hardware decoding through Media3 / ExoPlayer into a Flutter texture, connections reused between screens, a 16 MB app, and camera passwords stored encrypted on the device.',
      },
    ],
    outcome:
      'Open source on GitHub, with unit, widget and golden tests, and APKs for phones and Android TV.',
    brief:
      'Built NetSeye (open source: github.com/Atulwinlooper/netseye), a Flutter app for watching ONVIF / RTSP cameras on Android phones and TV over local Wi-Fi, with a native Kotlin playback layer.',
    stack: ['Flutter', 'Dart', 'Kotlin', 'Media3 / ExoPlayer', 'ONVIF', 'RTSP', 'Android TV'],
    links: [{ label: 'Source on GitHub', url: 'https://github.com/Atulwinlooper/netseye' }],
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
      'Led architecture and development of government apps with Flutter and Clean Architecture, including Kapaas Mitra for CITI and ICAR-CICR.',
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
      'Android (Java)',
      'REST',
      'Payment gateways',
      'Push notifications',
      'GitHub Actions',
    ],
    start: 'Mar 2022',
    end: 'Jun 2023',
    stack: 'Flutter · React Native · Android',
    points: [
      'Built production apps for social networking and eCommerce in Flutter and React Native.',
      'Built video, live and chat features for Viddi’s Android apps (Java): VPeeps (100K+ installs), VPeepme, Park and Mirage Edge, and owned their Play Store releases.',
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
