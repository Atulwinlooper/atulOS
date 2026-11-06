import { prefersReducedMotion } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  loadFound,
  PASSPHRASE,
  readJSON,
  saveFound,
  SECRETS,
  save,
  type SecretId,
} from '../eggs/secrets';

export type AppId =
  | 'projects'
  | 'experience'
  | 'skills'
  | 'terminal'
  | 'resume'
  | 'about'
  | 'mail'
  | 'arcade'
  | 'settings'
  | 'secrets'
  | 'vault';

export type Phase = 'boot' | 'lock' | 'desktop';
export const WALLPAPERS = ['ember', 'midnight', 'dawn'] as const;
export type Wallpaper = (typeof WALLPAPERS)[number];
const isWallpaper = (v: unknown): v is Wallpaper => WALLPAPERS.some((w) => w === v);
export type Theme = 'dark' | 'light';
const isTheme = (v: unknown): v is Theme => v === 'dark' || v === 'light';

export type Win = {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** set when the window should play its restore animation from the dock */
  restoring: boolean;
  /** set while the window plays its close animation, just before it is removed */
  closing: boolean;
  props?: Record<string, string>;
};

/** How long the close animation runs (keep in sync with window.css and mobile.css). */
export const CLOSE_MS = 220;

export type Toast = { id: number; title: string; text: string; kind: 'secret' | 'info' };

/** Preferred window sizes. Windows shrink to fit small screens. */
export const SIZES: Record<AppId, [number, number]> = {
  projects: [880, 600],
  experience: [720, 620],
  skills: [780, 600],
  terminal: [760, 500],
  resume: [760, 640],
  about: [560, 560],
  mail: [560, 540],
  arcade: [940, 640],
  settings: [520, 480],
  secrets: [560, 600],
  vault: [520, 600],
};

type Ctx = {
  phase: Phase;
  setPhase: (p: Phase) => void;
  wins: Win[];
  focused: AppId | null;
  open: (id: AppId, props?: Record<string, string>) => void;
  close: (id: AppId) => void;
  minimize: (id: AppId) => void;
  focus: (id: AppId) => void;
  toggleMax: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  doneRestoring: (id: AppId) => void;
  found: SecretId[];
  findSecret: (id: SecretId) => void;
  resetSecrets: () => void;
  toasts: Toast[];
  toast: (title: string, text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  retro: boolean;
  setRetro: (v: boolean) => void;
  toggleRetro: () => void;
  wall: Wallpaper;
  setWall: (w: Wallpaper) => void;
  /** Moves to the next wallpaper and returns it. */
  cycleWall: () => Wallpaper;
  theme: Theme;
  /** Switches theme; `from` is where the light comes from, for the reveal animation. */
  setTheme: (t: Theme, from?: { x: number; y: number }) => void;
  isPhone: boolean;
};

const OSContext = createContext<Ctx | null>(null);

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside <OSProvider>');
  return ctx;
}

function usePhone() {
  // Narrow screens, and phones held sideways (short and touch-driven), get the phone shell.
  const q = '(max-width: 760px), (max-height: 500px) and (pointer: coarse)';
  const [phone, setPhone] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    // An on-screen keyboard shrinks the window. Switching layouts then would unmount the field
    // being typed in, close the keyboard, and flip straight back: so hold still while typing.
    const typing = () => {
      const el = document.activeElement;
      return (
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLInputElement && !['button', 'checkbox', 'radio'].includes(el.type))
      );
    };
    const on = () => {
      if (!typing()) setPhone(m.matches);
    };
    // Once typing stops and the keyboard is gone, catch up with any change (say, a rotation).
    let t = 0;
    const settle = () => {
      window.clearTimeout(t);
      t = window.setTimeout(on, 400);
    };
    m.addEventListener('change', on);
    document.addEventListener('focusout', settle);
    return () => {
      window.clearTimeout(t);
      m.removeEventListener('change', on);
      document.removeEventListener('focusout', settle);
    };
  }, []);
  return phone;
}

export function OSProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('boot');
  const [wins, setWins] = useState<Win[]>([]);
  const [found, setFound] = useState<SecretId[]>(loadFound);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [retro, setRetroState] = useState(false);
  const [wall, setWallState] = useState<Wallpaper>(() => {
    const v = readJSON('atulos.wall');
    return isWallpaper(v) ? v : 'ember';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const v = readJSON('atulos.theme');
    return isTheme(v) ? v : 'dark';
  });
  const isPhone = usePhone();
  const zTop = useRef(10);
  const toastId = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.wall = wall;
  }, [wall]);
  useEffect(() => {
    document.documentElement.classList.toggle('retro', retro);
  }, [retro]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#EFE9E1' : '#0B0A0C');
  }, [theme]);

  const toast = useCallback((title: string, text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, title, text, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  // Kept in a ref too, so findSecret can check and save without side effects in an updater.
  const foundRef = useRef(found);
  const findSecret = useCallback(
    (id: SecretId) => {
      if (foundRef.current.includes(id)) return;
      const next = [...foundRef.current, id];
      foundRef.current = next;
      saveFound(next);
      setFound(next);
      const s = SECRETS.find((x) => x.id === id);
      if (!s) return;
      const letter = s.slot === undefined ? '' : ` It revealed a letter: ${PASSPHRASE[s.slot]}.`;
      toast(
        `Secret found: ${s.title}`,
        `${s.text}${letter} ${next.length} of ${SECRETS.length}.`,
        'secret',
      );
    },
    [toast],
  );
  const resetSecrets = useCallback(() => {
    foundRef.current = [];
    setFound([]);
    saveFound([]);
  }, []);

  const focus = useCallback((id: AppId) => {
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w)));
  }, []);

  const open = useCallback((id: AppId, props?: Record<string, string>) => {
    setWins((ws) => {
      const existing = ws.find((w) => w.id === id);
      if (existing) {
        return ws.map((w) =>
          w.id === id
            ? {
                ...w,
                z: ++zTop.current,
                minimized: false,
                restoring: w.minimized,
                closing: false, // reopened mid-close: keep it
                props: props ?? w.props,
              }
            : w,
        );
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const [pw, ph] = SIZES[id];
      const w = Math.min(pw, vw - 32);
      const h = Math.min(ph, vh - 30 - 110);
      const n = ws.filter((x) => !x.minimized).length;
      const x = Math.max(16, Math.round((vw - w) / 2) + (n % 5) * 28 - 56);
      const y = Math.max(40, Math.round((vh - 110 - h) / 2) + (n % 5) * 24);
      return [
        ...ws,
        {
          id,
          x,
          y,
          w,
          h,
          z: ++zTop.current,
          minimized: false,
          maximized: false,
          restoring: false,
          closing: false,
          props,
        },
      ];
    });
  }, []);

  const close = useCallback((id: AppId) => {
    const remove = () => setWins((ws) => ws.filter((w) => !(w.id === id && w.closing)));
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, closing: true } : w)));
    // Removed after the close animation, unless it was reopened in the meantime.
    if (prefersReducedMotion()) queueMicrotask(remove);
    else window.setTimeout(remove, CLOSE_MS);
  }, []);
  const minimize = useCallback(
    (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w))),
    [],
  );
  const doneRestoring = useCallback(
    (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, restoring: false } : w))),
    [],
  );
  const toggleMax = useCallback(
    (id: AppId) =>
      setWins((ws) =>
        ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized, z: ++zTop.current } : w)),
      ),
    [],
  );
  const move = useCallback(
    (id: AppId, x: number, y: number) =>
      setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w))),
    [],
  );

  const focused = useMemo(() => {
    const visible = wins.filter((w) => !w.minimized && !w.closing);
    if (!visible.length) return null;
    return visible.reduce((a, b) => (a.z > b.z ? a : b)).id;
  }, [wins]);

  const setRetro = useCallback((v: boolean) => setRetroState(v), []);
  const toggleRetro = useCallback(() => setRetroState((r) => !r), []);
  const setWall = useCallback((w: Wallpaper) => {
    setWallState(w);
    save('atulos.wall', w);
  }, []);
  const wallRef = useLatest(wall);
  const cycleWall = useCallback(() => {
    const next = WALLPAPERS[(WALLPAPERS.indexOf(wallRef.current) + 1) % WALLPAPERS.length];
    setWall(next);
    return next;
  }, [setWall, wallRef]);
  const setTheme = useCallback((t: Theme, from?: { x: number; y: number }) => {
    save('atulos.theme', t);
    const root = document.documentElement;
    // The light spreads out from the bulb, where the browser supports view transitions.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !prefersReducedMotion()) {
      root.style.setProperty('--vt-x', `${from?.x ?? innerWidth / 2}px`);
      root.style.setProperty('--vt-y', `${from?.y ?? 0}px`);
      root.dataset.vt = t;
      doc.startViewTransition(() => {
        root.dataset.theme = t;
        setThemeState(t);
      });
    } else {
      setThemeState(t);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      phase,
      setPhase,
      wins,
      focused,
      open,
      close,
      minimize,
      focus,
      toggleMax,
      move,
      doneRestoring,
      found,
      findSecret,
      resetSecrets,
      toasts,
      toast,
      dismissToast,
      retro,
      setRetro,
      toggleRetro,
      wall,
      setWall,
      cycleWall,
      theme,
      setTheme,
      isPhone,
    }),
    [
      phase,
      setPhase,
      wins,
      focused,
      open,
      close,
      minimize,
      focus,
      toggleMax,
      move,
      doneRestoring,
      found,
      findSecret,
      resetSecrets,
      toasts,
      toast,
      dismissToast,
      retro,
      setRetro,
      toggleRetro,
      wall,
      setWall,
      cycleWall,
      theme,
      setTheme,
      isPhone,
    ],
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}
