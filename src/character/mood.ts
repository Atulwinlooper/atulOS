/**
 * Atul's moods, and how his face and head move in each. Pure, so the nap sequence is testable.
 */
export type Mode =
  | 'idle'
  | 'yawn'
  | 'drowsy'
  | 'dozing'
  | 'sleep'
  | 'waking'
  | 'dizzy'
  | 'poked'
  | 'happy';

/** Milliseconds without input at which each nap stage begins. */
export const NAP = {
  yawn: 14_000,
  drowsy: 16_500,
  dozing: 23_000,
  sleep: 30_000,
} as const;

/** The stages he drifts through when left alone. Any other mood is left as it is. */
const ORDER: Mode[] = ['idle', 'yawn', 'drowsy', 'dozing', 'sleep'];

/**
 * The next mood after `idleMs` without input. He moves one stage at a time, so even after a
 * long absence (say, a background tab) he still yawns before dozing off.
 */
export function napStage(mode: Mode, idleMs: number): Mode {
  const i = ORDER.indexOf(mode);
  if (i < 0 || i === ORDER.length - 1) return mode;
  const next = ORDER[i + 1];
  const starts: Record<string, number> = NAP;
  return idleMs >= starts[next] ? next : mode;
}

export type Pose = {
  /** Eyelid closure, 0 open to 1 shut. */
  lid: number;
  /** How fast the lids move toward `lid` each frame (0..1). Slow for falling asleep. */
  speed: number;
  /** Extra head drop (px, + is down) and tilt (degrees). */
  nod: number;
  tilt: number;
  /** Extra gaze offset (px, + is down). */
  gazeY: number;
};

const DOZE_MS = NAP.sleep - NAP.dozing;

/** Face and head pose for mood `mode`, `inMode` ms after it began. */
export function lidsFor(mode: Mode, inMode: number, blinking: boolean, now: number): Pose {
  switch (mode) {
    case 'yawn': {
      // Eyes squeeze shut at the peak of the yawn, head tips back.
      const peak = inMode > 300 && inMode < 1800;
      return { lid: peak ? 0.85 : 0.35, speed: 0.12, nod: -8, tilt: -4, gazeY: -3 };
    }
    case 'drowsy':
      return {
        lid: blinking ? 1 : 0.45 + Math.sin(now / 1700) * 0.06,
        speed: blinking ? 0.1 : 0.06,
        nod: 4 + Math.sin(now / 1300) * 2,
        tilt: 3,
        gazeY: 4,
      };
    case 'dozing': {
      // Eyelids slowly win. Halfway through he nods off and jerks awake once, then drifts off.
      const p = Math.min(1, inMode / DOZE_MS);
      const jerk = p > 0.42 && p < 0.5;
      return {
        lid: jerk ? 0.25 : 0.5 + 0.5 * p,
        speed: jerk ? 0.4 : 0.035,
        nod: jerk ? -2 : 4 + 12 * p,
        tilt: jerk ? 0 : 3 + 5 * p,
        gazeY: 5,
      };
    }
    case 'sleep':
      return { lid: 1, speed: 0.04, nod: 12, tilt: 8, gazeY: 5 };
    case 'waking':
      return { lid: 0, speed: 0.05, nod: 2, tilt: 2, gazeY: 0 };
    case 'poked':
      return { lid: 0.85, speed: 0.5, nod: 0, tilt: 0, gazeY: 0 };
    case 'happy':
      return { lid: 1, speed: 0.3, nod: 0, tilt: -3, gazeY: 0 };
    case 'dizzy':
      return { lid: 0, speed: 0.3, nod: 0, tilt: 0, gazeY: 0 };
    default:
      return { lid: blinking ? 1 : 0, speed: 0.55, nod: 0, tilt: 0, gazeY: 0 };
  }
}
