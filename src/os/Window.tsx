import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { closest, prefersReducedMotion } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { clampWindow, genieFrames, zoomFromIcon } from './genie';
import { useOS, type Win } from './store';
import './window.css';

function dockRect(id: string) {
  return (
    document.querySelector<HTMLElement>(`[data-dock="${id}"]`)?.getBoundingClientRect() ?? null
  );
}

type Props = { win: Win; title: string; children: ReactNode };

export function Window({ win, title, children }: Props) {
  const { focus, close, minimize, toggleMax, move, doneRestoring, focused } = useOS();
  const ref = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const { id } = win;

  // Zoom open from the dock icon, then move focus into the window.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(
      '.win-body input, .win-body textarea, .win-body button, .win-body a[href]',
    );
    (first ?? el).focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const icon = dockRect(id);
    const frames = icon
      ? zoomFromIcon(el.getBoundingClientRect(), icon)
      : [
          { opacity: 0, transform: 'scale(.94)' },
          { opacity: 1, transform: 'none' },
        ];
    el.animate(frames, { duration: icon ? 420 : 220, easing: 'cubic-bezier(.16,1,.3,1)' });
  }, [id]);

  // Play the genie in reverse when restored from the dock.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !win.restoring) return;
    const icon = dockRect(id);
    if (!icon || prefersReducedMotion()) {
      doneRestoring(id);
      return;
    }
    const a = el.animate(genieFrames(el.getBoundingClientRect(), icon).toReversed(), {
      duration: 520,
      easing: 'cubic-bezier(.3,0,.2,1)',
    });
    a.onfinish = () => doneRestoring(id);
  }, [win.restoring, id, doneRestoring]);

  // Keep the window reachable when the viewport shrinks.
  useEffect(() => {
    const fit = () => {
      if (win.x > window.innerWidth - 120 || win.y > window.innerHeight - 120) {
        move(
          id,
          Math.max(16, window.innerWidth - win.w - 16),
          Math.max(40, window.innerHeight - win.h - 110),
        );
      }
    };
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [win.x, win.y, win.w, win.h, id, move]);

  const onMinimize = () => {
    const el = ref.current;
    const icon = dockRect(id);
    if (!el || !icon || prefersReducedMotion() || busy.current) {
      minimize(id);
      return;
    }
    busy.current = true;
    const a = el.animate(genieFrames(el.getBoundingClientRect(), icon), {
      duration: 560,
      easing: 'cubic-bezier(.55,0,.3,1)',
      fill: 'forwards',
    });
    a.onfinish = () => {
      busy.current = false;
      minimize(id);
      a.cancel();
    };
  };

  // The store marks the window as closing; window.css plays the animation before removal.
  const onClose = () => close(id);

  const onBarDown = (e: PointerEvent<HTMLElement>) => {
    if (closest(e.target, 'button,input,a')) return;
    focus(id);
    if (win.maximized) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onBarMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = clampWindow(
      d.ox + e.clientX - d.sx,
      d.oy + e.clientY - d.sy,
      win.w,
      window.innerWidth,
      window.innerHeight,
    );
    move(id, p.x, p.y);
  };
  const onBarUp = () => {
    drag.current = null;
  };
  const onBarDouble = (e: MouseEvent<HTMLElement>) => {
    if (!closest(e.target, 'button')) toggleMax(id);
  };
  const isFocused = focused === id;
  const live = useLatest({ isFocused, onClose });

  // Window-level listeners are attached natively: the window is a region, not a control.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const raise = () => {
      if (!live.current.isFocused) focus(id);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !closest(e.target, 'input,textarea')) {
        e.stopPropagation();
        live.current.onClose();
      }
    };
    el.addEventListener('focusin', raise);
    el.addEventListener('pointerdown', raise, true);
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('focusin', raise);
      el.removeEventListener('pointerdown', raise, true);
      el.removeEventListener('keydown', onKey);
    };
  }, [focus, id, live]);
  const style: CSSProperties = win.maximized
    ? { left: 0, top: 30, width: '100%', height: 'calc(100% - 30px - 96px)', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <section
      ref={ref}
      className={`win${isFocused ? ' focused' : ''}${win.maximized ? ' max' : ''}${win.closing ? ' closing' : ''}`}
      style={{ ...style, display: win.minimized ? 'none' : undefined }}
      aria-label={title}
      tabIndex={-1}
    >
      <header
        className="win-bar"
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
        onPointerCancel={onBarUp}
        onDoubleClick={onBarDouble}
      >
        <div className="lights">
          <button
            type="button"
            className="tlb close"
            aria-label={`Close ${title}`}
            title="Close (Esc)"
            onClick={onClose}
          />
          <button
            type="button"
            className="tlb min"
            aria-label={`Minimise ${title}`}
            title="Minimise"
            onClick={onMinimize}
          />
          <button
            type="button"
            className="tlb zoom"
            aria-label={win.maximized ? `Restore ${title}` : `Zoom ${title}`}
            title="Zoom"
            onClick={() => toggleMax(id)}
          />
        </div>
        <h2 className="win-title">{title}</h2>
      </header>
      {/* Focusable so keyboard users can scroll long, text-only windows (axe: scrollable-region-focusable). */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <section className="win-body" aria-label={`${title} content`} tabIndex={0}>
        {children}
      </section>
    </section>
  );
}
