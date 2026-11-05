import { useEffect, useRef, useState } from 'react';
import { rafLoop } from '../lib/dom';
import { useReducedMotion } from '../lib/hooks';
import { AppTile } from './icons';
import { useOS, type AppId } from './store';
import { APP_TITLES } from './titles';
import './dock.css';

type Tile = Parameters<typeof AppTile>[0]['id'];
type DockItem = { id: AppId | 'bin'; tile: Tile };

export const DOCK: DockItem[] = [
  { id: 'about', tile: 'desk' },
  { id: 'projects', tile: 'projects' },
  { id: 'experience', tile: 'experience' },
  { id: 'skills', tile: 'skills' },
  { id: 'terminal', tile: 'terminal' },
  { id: 'arcade', tile: 'arcade' },
  { id: 'resume', tile: 'resume' },
  { id: 'mail', tile: 'mail' },
];
const TRAY: DockItem[] = [
  { id: 'settings', tile: 'settings' },
  { id: 'bin', tile: 'bin' },
];

export const BASE = 52;
export const MAX = 88;
/** How far from the pointer icons are affected: about two and a half icons each side. */
export const RANGE = 160;
const GAP = 8;
const SEP = 13; // separator plus its margins

/** Icon size for a pointer `distance` px from the icon's resting centre (cosine falloff). */
export function magnify(distance: number) {
  if (distance > RANGE) return BASE;
  return BASE + (MAX - BASE) * Math.cos((distance / RANGE) * (Math.PI / 2)) ** 2;
}

/**
 * Resting centres (relative to the dock's centre) of each icon, from the layout at BASE size.
 * Magnifying from rest positions, not the moving ones, is what keeps the macOS dock steady.
 */
export function restCentres(count: number, sepAfter: number) {
  const total = count * BASE + (count - 1) * GAP + SEP + GAP;
  const out: number[] = [];
  let x = -total / 2;
  for (let i = 0; i < count; i++) {
    out.push(x + BASE / 2);
    x += BASE + GAP;
    if (i === sepAfter - 1) x += SEP + GAP;
  }
  return out;
}

const ITEMS = [...DOCK, ...TRAY];
const CENTRES = restCentres(ITEMS.length, DOCK.length);

export function Dock({ onBin }: { onBin: () => void }) {
  const { open, wins } = useOS();
  const reduced = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  const [bouncing, setBouncing] = useState<string | null>(null);

  // Every frame, ease each icon toward its target size and write it straight to the DOM, so
  // slot and icon always grow together and neighbours are pushed apart, never overlapped.
  useEffect(() => {
    const el = nav.current;
    if (!el || reduced) return undefined;
    const pointer = { x: 0, inside: false };
    const size = ITEMS.map(() => BASE);
    const items = [...el.querySelectorAll<HTMLElement>('.dock-item[data-i]')];
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.inside = true;
      pointer.x = e.clientX;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    const stop = rafLoop((dt) => {
      const centre = window.innerWidth / 2;
      let moving = false;
      ITEMS.forEach((_, i) => {
        const target = pointer.inside ? magnify(Math.abs(pointer.x - (centre + CENTRES[i]))) : BASE;
        const next = size[i] + (target - size[i]) * Math.min(1, 0.28 * dt);
        if (Math.abs(next - size[i]) > 0.05) moving = true;
        size[i] = Math.abs(target - next) < 0.05 ? target : next;
      });
      if (!moving && !pointer.inside) return;
      items.forEach((item, i) => item.style.setProperty('--s', size[i].toFixed(2)));
    });
    return () => {
      stop();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  const launch = (item: DockItem) => {
    if (item.id === 'bin') {
      onBin();
      return;
    }
    if (!wins.some((w) => w.id === item.id) && !reduced) {
      setBouncing(item.id);
      window.setTimeout(() => setBouncing(null), 700);
    }
    open(item.id);
  };

  const render = (item: DockItem) => {
    const running = item.id !== 'bin' && wins.some((w) => w.id === item.id);
    const title = item.id === 'bin' ? 'Bin' : APP_TITLES[item.id];
    return (
      <li key={item.id} className="dock-item" data-i={ITEMS.indexOf(item)}>
        <button
          type="button"
          data-dock={item.id}
          className={`dock-btn${bouncing === item.id ? ' bounce' : ''}`}
          aria-label={running ? `${title}, open` : title}
          onClick={() => launch(item)}
        >
          <span className="dock-icon">
            <AppTile id={item.tile} size={MAX} />
          </span>
          <span className="dock-tip" aria-hidden="true">
            {title}
          </span>
        </button>
        <span className={`dock-dot${running ? ' on' : ''}`} aria-hidden="true" />
      </li>
    );
  };

  return (
    <nav ref={nav} className="dock glass" aria-label="Dock">
      <ul>
        {DOCK.map(render)}
        <li className="dock-sep" aria-hidden="true" />
        {TRAY.map(render)}
      </ul>
    </nav>
  );
}
