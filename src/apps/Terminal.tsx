import { useEffect, useRef, useState, type ReactNode } from 'react';
import { jobs, profile, projects, skills } from '../data/cv';
import { rot13 } from '../eggs/secrets';
import { confetti } from '../eggs/confetti';
import { Snake } from '../games/Snake';
import { useOS, type AppId } from '../os/store';

type Line = { id: number; node: ReactNode };

const PROMPT = (
  <>
    <span className="t-user">atul@atulos</span> <span className="t-path">~</span> %
  </>
);
// Hidden notes for the secrets trail. NOTE_1 is ROT13, NOTE_2 is base64.
const NOTE_1 = rot13('The passphrase is what he does, every day. Twelve letters, one per secret.');
const NOTE_2 = 'VGhlIGRvb3IgaXMgaW4geW91ciBob21lIGZvbGRlci4gVHJ5OiBvcGVuIHZhdWx0';

const OPENABLE: Record<string, AppId> = {
  projects: 'projects',
  experience: 'experience',
  skills: 'skills',
  resume: 'resume',
  cv: 'resume',
  about: 'about',
  mail: 'mail',
  contact: 'mail',
  hire: 'mail',
  arcade: 'arcade',
  games: 'arcade',
  settings: 'settings',
  secrets: 'secrets',
  vault: 'vault',
  '.vault': 'vault',
};
const COMMANDS = [
  'help',
  'whoami',
  'about',
  'ls',
  'cat',
  'open',
  'projects',
  'experience',
  'skills',
  'resume',
  'contact',
  'hire',
  'play',
  'ship',
  'neofetch',
  'date',
  'echo',
  'history',
  'clear',
  'exit',
];

export function Terminal() {
  const { open, close, findSecret, isPhone } = useOS();
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: 0,
      node: (
        <span className="muted">
          AtulOS 5.0 (zsh). Type <b className="t-hl">help</b> to see what you can do here.
        </span>
      ),
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'shell' | 'password' | 'snake'>('shell');
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const id = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const print = (...nodes: ReactNode[]) =>
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: ++id.current, node }))]);

  // Focus the prompt on open, but not on phones, where it would pop the keyboard over the sheet.
  useEffect(() => {
    // Not on touch screens: focusing would pop up the keyboard before anyone asked to type.
    if (!isPhone && !matchMedia('(pointer: coarse)').matches)
      inputRef.current?.focus({ preventScroll: true });
  }, [isPhone]);
  // Keep the newest output in view after every render.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollHeight - el.scrollTop > el.clientHeight)
      el.scrollTo({ top: el.scrollHeight });
  });

  const quitSnake = (score: number) => {
    setMode('shell');
    print(<span className="muted">Snake ended. Score {score}.</span>);
    if (!matchMedia('(pointer: coarse)').matches)
      window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (mode === 'password') {
      print(
        <span className="muted">
          [sudo] password for recruiter: {'•'.repeat(Math.max(4, raw.length))}
        </span>,
      );
      setMode('shell');
      print(
        <span className="t-ok">✓ Permission granted.</span>,
        <span>Opening Mail. Atul will reply within a day.</span>,
      );
      confetti();
      findSecret('sudo');
      window.setTimeout(() => open('mail', { subject: "Let's work together" }), 900);
      return;
    }
    print(
      <span>
        {PROMPT} {raw}
      </span>,
    );
    if (!cmd) return;
    setHist((h) => [...h, cmd]);
    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(' ');

    switch (name.toLowerCase()) {
      case 'help':
        print(
          <div className="t-help">
            {[
              ['whoami', 'who you are talking to'],
              ['cat stack.txt', 'the tools I use'],
              ['ls ~/shipped', 'apps I have shipped'],
              ['open <app>', 'projects, experience, skills, resume, mail, arcade'],
              ['play snake', 'a game, right here in the terminal'],
              ['./ship', 'watch a release go out'],
              ['neofetch', 'system info'],
              ['clear', 'clear the screen'],
            ].map(([c, d]) => (
              <span key={c}>
                <b className="t-hl">{c.padEnd(16, ' ')}</b>
                <span className="muted">{d}</span>
              </span>
            ))}
            <span className="muted">There are a few commands not on this list.</span>
          </div>,
        );
        break;
      case 'whoami':
        print(`${profile.name} · ${profile.role} · ${profile.location}`);
        break;
      case 'about':
        print(profile.summary);
        break;
      case 'ls':
        if (/\.notes/.test(arg)) print(<span className="t-dir">0x01.txt 0x02.txt</span>);
        else if (/(^|\s)-\w*a/.test(arg))
          print(
            <span className="t-dir">
              ./ ../ <span className="t-hl">.notes/</span> <span className="t-hl">.vault/</span>{' '}
              shipped/ stack.txt experience.log resume.pdf secrets.txt
            </span>,
          );
        else if (arg.includes('shipped'))
          print(<span className="t-dir">{projects.map((p) => `${p.id}/`).join('  ')}</span>);
        else
          print(
            <span className="t-dir">shipped/ stack.txt experience.log resume.pdf secrets.txt</span>,
          );
        break;
      case 'cat':
        if (arg.startsWith('stack')) {
          print(
            ...skills.slice(0, 6).map((g) => (
              <span key={g.group}>
                <span className="faint">{g.group.toLowerCase().padEnd(16, ' ')}</span>
                {g.items.join(' · ')}
              </span>
            )),
          );
        } else if (arg.startsWith('experience')) {
          print(...jobs.map((j) => `${j.start.padEnd(9)} ${j.role} @ ${j.company}`));
        } else if (/\.notes\/?0x01/.test(arg)) {
          print(
            <span className="faint">-----BEGIN NOTE----- shift: 13</span>,
            NOTE_1,
            <span className="faint">-----END NOTE-----</span>,
          );
        } else if (/\.notes\/?0x02/.test(arg)) {
          print(
            <span className="faint">-----BEGIN NOTE----- encoding: base64</span>,
            NOTE_2,
            <span className="faint">-----END NOTE-----</span>,
          );
        } else if (arg.startsWith('.vault')) {
          print('cat: .vault: Is a door, not a file. Try opening it.');
        } else if (arg.startsWith('secrets')) {
          print('Opening secrets.txt…');
          open('secrets');
        } else if (arg.startsWith('resume')) {
          print('That is a PDF. Opening Resume instead.');
          open('resume');
        } else print(`cat: ${arg || '(nothing)'}: No such file`);
        break;
      case 'open': {
        const app = OPENABLE[arg.toLowerCase()];
        if (app) {
          print(`Opening ${arg}…`);
          open(app);
        } else
          print(
            `open: unknown app "${arg}". Try: projects, experience, skills, resume, mail, arcade`,
          );
        break;
      }
      case 'projects':
      case 'experience':
      case 'skills':
      case 'resume':
      case 'contact':
      case 'hire':
      case 'mail':
      case 'arcade':
        print(`Opening ${name}…`);
        open(OPENABLE[name.toLowerCase()]);
        break;
      case 'rot13': {
        const out = rot13(arg);
        print(out || 'usage: rot13 <text>');
        if (/passphrase/i.test(out)) findSecret('cipher');
        break;
      }
      case 'base64': {
        const text = arg.replace(/^(-d|--decode)\s+/, '');
        try {
          const out = /^(-d|--decode)\s/.test(arg) ? atob(text) : btoa(text);
          print(out);
        } catch {
          print('base64: invalid input');
        }
        break;
      }
      case 'cd':
        if (arg.startsWith('.vault')) {
          print('The door is locked. Opening it…');
          open('vault');
        } else if (arg.startsWith('.notes')) print('You are in .notes. Try: ls .notes');
        else print(`cd: ${arg || '~'}: this shell only lets you look around`);
        break;
      case 'sudo':
        if (/^hire\s+atul/i.test(arg)) {
          setMode('password');
          print(<span className="muted">[sudo] password for recruiter:</span>);
        } else {
          print(
            `${profile.first.toLowerCase()} is not in the sudoers file. This incident will be reported to his recruiter.`,
          );
        }
        break;
      case 'play':
      case 'snake':
        if (name === 'snake' || arg === 'snake') {
          print(
            <span className="muted">
              Starting Snake.dart. Arrow keys or WASD to move, Q to quit.
            </span>,
          );
          setMode('snake');
        } else print('play: try "play snake"');
        break;
      case './ship':
      case 'ship':
        [
          'Running tests…',
          '✓ 214 tests passed',
          'Building Android and iOS…',
          '✓ Signed builds ready',
          'Uploading with Fastlane…',
          '✓ Released. Release time −60%.',
        ].forEach((l, i) =>
          window.setTimeout(
            () => print(<span className={l.startsWith('✓') ? 't-ok' : 'muted'}>{l}</span>),
            i * 420,
          ),
        );
        break;
      case 'neofetch':
        print(
          <pre className="t-neo">{`   ▄▄▄▄▄      atul@atulos
  █  अ  █     ─────────────
  █     █     OS      AtulOS 5.0
   ▀▀▀▀▀      Host    ${profile.location}
              Uptime  since ${profile.since}
              Shell   zsh (Flutter, React Native)
              Arch    Clean Architecture + BLoC
              CI/CD   Fastlane · GitHub Actions · Bitrise`}</pre>,
        );
        break;
      case 'date':
        print(new Date().toString());
        break;
      case 'echo':
        print(arg);
        break;
      case 'history':
        print(...hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));
        break;
      case 'clear':
        setLines([]);
        break;
      case 'exit':
        close('terminal');
        break;
      case 'rm':
        print('Nice try. Atul refactors code, he never deletes it.');
        break;
      case 'vim':
      case 'nano':
        print('Opening an editor in a portfolio? Bold. Use "open about" instead.');
        break;
      default:
        print(`zsh: command not found: ${name}. Try "help".`);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input);
      setInput('');
      setHi(-1);
    } else if (e.key === 'ArrowUp' && hist.length) {
      e.preventDefault();
      const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1);
      setHi(n);
      setInput(hist[n]);
    } else if (e.key === 'ArrowDown' && hi >= 0) {
      e.preventDefault();
      const n = hi + 1;
      if (n >= hist.length) {
        setHi(-1);
        setInput('');
      } else {
        setHi(n);
        setInput(hist[n]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const m = COMMANDS.find((c) => c.startsWith(input));
      if (m && input) setInput(m + ' ');
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="app term"
      ref={scroller}
      onClick={() => mode !== 'snake' && inputRef.current?.focus()}
      role="presentation"
    >
      {lines.map((l) => (
        <div key={l.id} className="t-line">
          {l.node}
        </div>
      ))}
      {mode === 'snake' ? (
        <Snake onQuit={quitSnake} />
      ) : (
        <label className="t-input">
          {mode === 'password' ? <span className="muted">Password:</span> : PROMPT}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            type={mode === 'password' ? 'password' : 'text'}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Terminal input"
          />
        </label>
      )}
    </div>
  );
}
