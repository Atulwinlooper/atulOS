import { describe, expect, it } from 'vite-plus/test';
import { lidsFor, NAP, napStage, type Mode } from './mood';

/** Plays out `ms` of silence one tick at a time, recording every mood he passes through. */
function leaveAlone(ms: number, from: Mode = 'idle') {
  const seen: Mode[] = [from];
  let m = from;
  for (let t = 0; t <= ms; t += 250) {
    const next = napStage(m, t);
    if (next !== m) seen.push(next);
    m = next;
  }
  return seen;
}

describe('falling asleep naturally', () => {
  it('yawns, gets drowsy, dozes, then sleeps, in that order', () => {
    expect(leaveAlone(NAP.sleep + 1000)).toEqual(['idle', 'yawn', 'drowsy', 'dozing', 'sleep']);
  });
  it('is still awake just before the first yawn', () => {
    expect(leaveAlone(NAP.yawn - 300)).toEqual(['idle']);
  });
  it('never skips straight to sleep, even after a long absence', () => {
    expect(napStage('idle', 10 * 60_000)).toBe('yawn');
  });
  it('leaves other moods alone', () => {
    for (const m of ['dizzy', 'poked', 'happy', 'waking'] as Mode[]) {
      expect(napStage(m, 99_999)).toBe(m);
    }
  });
  it('closes his eyes slowly while dozing, with one jerk awake', () => {
    const lids = Array.from({ length: 21 }, (_, i) =>
      lidsFor('dozing', ((NAP.sleep - NAP.dozing) * i) / 20, false, 0),
    );
    expect(lids[0].lid).toBeLessThan(0.6);
    expect(lids[20].lid).toBe(1);
    expect(lids.some((p) => p.lid < 0.3)).toBe(true); // the jerk
    expect(Math.max(...lids.map((p) => p.speed))).toBeGreaterThan(0.3);
    expect(lids[20].speed).toBeLessThan(0.05); // eyelids drift, not snap
  });
  it('blinks heavily when drowsy and quickly when awake', () => {
    expect(lidsFor('drowsy', 0, true, 0).speed).toBeLessThan(lidsFor('idle', 0, true, 0).speed);
    expect(lidsFor('idle', 0, false, 0).lid).toBe(0);
    expect(lidsFor('sleep', 0, false, 0).lid).toBe(1);
  });
});

describe('mood classes', () => {
  it('never animate the whole character by accident (the yawn zoom bug)', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/character/character.css', 'utf8');
    const moods: Mode[] = [
      'idle',
      'yawn',
      'drowsy',
      'dozing',
      'sleep',
      'waking',
      'dizzy',
      'poked',
      'happy',
    ];
    for (const m of moods) {
      // A mood may style parts of him (".char-poked svg"), never the root element itself.
      expect(css).not.toMatch(new RegExp(`\\.char-${m}\\s*\\{`));
    }
  });
});
