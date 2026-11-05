import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vite-plus/test';

// jsdom lacks a few browser APIs the OS uses. Stub them with inert versions.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
/** A finished-immediately stand-in for Web Animations, enough for the genie and zoom code. */
class InstantAnimation extends EventTarget {
  onfinish: (() => void) | null = null;
  finished = Promise.resolve(this);
  constructor() {
    super();
    queueMicrotask(() => this.onfinish?.());
  }
  cancel() {}
}
const instantAnimate = () => new InstantAnimation();
if (!Element.prototype.animate) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- partial test double
  Element.prototype.animate = instantAnimate as unknown as Element['animate'];
}
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => undefined;
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;
globalThis.fetch = vi.fn(() => Promise.reject(new Error('network disabled in tests')));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
