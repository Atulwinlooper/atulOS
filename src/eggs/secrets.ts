import type { IconId } from '../games/kit';

export type SecretId =
  | 'swing'
  | 'hoodie'
  | 'sudo'
  | 'poke'
  | 'flip'
  | 'konami'
  | 'bin'
  | 'nap'
  | 'highscore'
  | 'dizzy'
  | 'pat'
  | 'flicker'
  | 'cipher'
  | 'comeback'
  | 'exit'
  | 'vault';

/**
 * The twelve letters of the passphrase that opens the Vault. Each of the first twelve secrets
 * reveals the letter at its `slot`. Keep this in sync with the slots below.
 */
export const PASSPHRASE = 'SHIPEVERYDAY';

export type Secret = {
  id: SecretId;
  title: string;
  /** What a visitor sees before finding it: a riddle, never instructions. */
  riddle: string;
  /** What they see once it is found. */
  text: string;
  /** Position of this secret's letter in PASSPHRASE, if it has one. */
  slot?: number;
  sticker: { icon: IconId; color: string };
};

export const SECRETS: Secret[] = [
  {
    id: 'swing',
    title: 'Card shark',
    riddle: 'The badge that hangs can also fly. Spin it until the strap complains.',
    text: 'You spun the ID card on its lanyard.',
    slot: 0,
    sticker: { icon: 'card', color: '#FF7A3D' },
  },
  {
    id: 'hoodie',
    title: 'Deep work',
    riddle: 'Two strings, one hood. Some work needs a cocoon.',
    text: 'You tugged his drawstrings and he pulled his hood up.',
    slot: 1,
    sticker: { icon: 'shield', color: '#8A8FD9' },
  },
  {
    id: 'sudo',
    title: 'Root access',
    riddle: 'Superusers ask with four letters. Ask the shell to hire him.',
    text: 'sudo hire atul: permission granted.',
    slot: 2,
    sticker: { icon: 'lock', color: '#8FD19E' },
  },
  {
    id: 'poke',
    title: 'Personal space',
    riddle: 'Knock on the same door five times and even the busiest engineer answers.',
    text: 'You poked him five times in a row.',
    slot: 3,
    sticker: { icon: 'button', color: '#F6D38C' },
  },
  {
    id: 'flip',
    title: 'Flip side',
    riddle: 'Every card has two faces. Only one is shown to strangers.',
    text: 'You turned the ID card over and read the note on the back.',
    slot: 4,
    sticker: { icon: 'image', color: '#7FB7C9' },
  },
  {
    id: 'konami',
    title: 'Retro mode',
    riddle: 'Up, up, down, down. Your thumbs remember the rest.',
    text: 'Code accepted. Enter it again to switch back.',
    slot: 5,
    sticker: { icon: 'star', color: '#D9798E' },
  },
  {
    id: 'bin',
    title: 'Not that file',
    riddle: 'Some files fear the trash. Try it, and see who stops you.',
    text: 'You tried to throw his CV in the Bin.',
    slot: 6,
    sticker: { icon: 'wrench', color: '#E3A93E' },
  },
  {
    id: 'nap',
    title: 'Power nap',
    riddle: 'Silence is a lullaby. Do nothing, and watch closely.',
    text: 'You left him alone until he yawned, nodded off and fell asleep.',
    slot: 7,
    sticker: { icon: 'clock', color: '#B9A6FF' },
  },
  {
    id: 'highscore',
    title: 'Challenger',
    riddle: 'He left his scores in the Arcade. They are not unbeatable.',
    text: "You beat Atul's best score.",
    slot: 8,
    sticker: { icon: 'bolt', color: '#FF9A63' },
  },
  {
    id: 'dizzy',
    title: 'Dizzy spell',
    riddle: 'Circle the one who watches you. Make his world go round.',
    text: 'You circled him until he got dizzy.',
    slot: 9,
    sticker: { icon: 'gauge', color: '#7FB7C9' },
  },
  {
    id: 'pat',
    title: 'Good engineer',
    riddle: 'Good work deserves a hand on the head. Back and forth.',
    text: 'You patted him on the head.',
    slot: 10,
    sticker: { icon: 'heart', color: '#E3311D' },
  },
  {
    id: 'flicker',
    title: 'Who turned out the lights?',
    riddle: 'On, off, on, off. The room remembers who plays with the switch.',
    text: 'You flicked the light six times in four seconds.',
    slot: 11,
    sticker: { icon: 'flame', color: '#F6D38C' },
  },
  {
    id: 'cipher',
    title: 'Codebreaker',
    riddle:
      'Not everything in his home folder is visible. Look closer, then read between the letters.',
    text: 'You found the hidden notes and cracked the cipher.',
    sticker: { icon: 'git', color: '#8FD19E' },
  },
  {
    id: 'comeback',
    title: 'You came back',
    riddle: 'Wander off to another tab, then return. Someone was counting.',
    text: 'You switched tabs and came back. He noticed.',
    sticker: { icon: 'bell', color: '#7FB7C9' },
  },
  {
    id: 'exit',
    title: 'Not so fast',
    riddle: 'Head for the door at the top of the window. He has one last thing to say.',
    text: 'You reached for the tabs and he tried to stop you leaving.',
    sticker: { icon: 'phone', color: '#D9798E' },
  },
  {
    id: 'vault',
    title: 'The vault',
    riddle:
      'Twelve letters, one door. Somewhere there is a vault that opens with what he does, every day.',
    text: 'You opened the vault and read what was inside.',
    sticker: { icon: 'rocket', color: '#FF7A3D' },
  },
];

/** The passphrase as revealed so far: a letter where its secret is found, null elsewhere. */
export function revealed(found: readonly SecretId[]): (string | null)[] {
  return PASSPHRASE.split('').map((ch, i) => {
    const s = SECRETS.find((x) => x.slot === i);
    return s && found.includes(s.id) ? ch : null;
  });
}

/** True when `guess` is the passphrase, ignoring case, spaces and punctuation. */
export const isPassphrase = (guess: string) =>
  guess.toUpperCase().replace(/[^A-Z]/g, '') === PASSPHRASE;

/** ROT13, for the hidden note in the terminal. */
export const rot13 = (s: string) =>
  s.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });

/**
 * Atul's own best scores, shown in the Arcade as the score to beat. Placeholders until he
 * plays: replace with real scores. Widget Match is moves (lower is better).
 */
export const ATUL_BEST = {
  bugSmash: 9600,
  shipIt: 1800,
  snake: 40,
  widgetMatchEasy: 8,
  widgetMatch: 12,
  widgetMatchHard: 20,
  merge: 6000,
  review: 2500,
  stack: 24,
  typing: 1500,
};

const KEY = 'atulos.secrets';

/** Reads and parses a localStorage value; null when missing, unreadable or malformed. */
export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

const isSecretId = (v: unknown): v is SecretId => SECRETS.some((s) => s.id === v);

export function loadFound(): SecretId[] {
  const v = readJSON(KEY);
  return Array.isArray(v) ? [...new Set(v.filter(isSecretId))] : [];
}
export function saveFound(ids: SecretId[]) {
  save(KEY, ids);
}

/** A stored finite number, or null. */
export function loadNumber(key: string): number | null {
  const v = readJSON(key);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
