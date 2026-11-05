import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './dom';

/**
 * Keeps a ref pointing at the latest value without writing to it during render.
 * Use it to read fresh state inside long-lived listeners and animation loops.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Live `prefers-reduced-motion` value. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Live viewport size. */
export function useViewport() {
  const [v, setV] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}
