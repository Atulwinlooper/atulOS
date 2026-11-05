/** Small, framework-free helpers shared across the OS. */

/** True when `target` is a DOM Element (narrows EventTarget without unsafe casts). */
export function isElement(target: EventTarget | null): target is Element {
  return target instanceof Element;
}

/** `target.closest(selector)` that tolerates non-element targets. */
export function closest(target: EventTarget | null, selector: string): Element | null {
  return isElement(target) ? target.closest(selector) : null;
}

/** True when the user asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Runs `step(dt)` on every animation frame until the returned function is called.
 * `dt` is the elapsed time in 60 fps frames, capped at 2 so a backgrounded tab
 * does not make physics jump.
 */
export function rafLoop(step: (dt: number, now: number) => void): () => void {
  const state = { id: 0, last: performance.now() };
  const tick = (now: number) => {
    state.id = requestAnimationFrame(tick);
    const dt = Math.min(2, (now - state.last) / 16.67);
    state.last = now;
    step(dt, now);
  };
  state.id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(state.id);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
