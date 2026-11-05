import { describe, expect, it } from 'vite-plus/test';
import {
  ATUL_BEST,
  isPassphrase,
  loadFound,
  loadNumber,
  PASSPHRASE,
  readJSON,
  revealed,
  rot13,
  saveFound,
  SECRETS,
} from './secrets';

describe('secrets persistence', () => {
  it('round-trips found secrets', () => {
    saveFound(['flip', 'sudo']);
    expect(loadFound()).toEqual(['flip', 'sudo']);
  });
  it('drops unknown ids, duplicates and junk from storage', () => {
    localStorage.setItem('atulos.secrets', JSON.stringify(['flip', 'flip', 'nope', 3, null]));
    expect(loadFound()).toEqual(['flip']);
    localStorage.setItem('atulos.secrets', '{"__proto__":{"x":1}}');
    expect(loadFound()).toEqual([]);
    localStorage.setItem('atulos.secrets', 'not json');
    expect(loadFound()).toEqual([]);
  });
  it('reads only finite numbers as scores', () => {
    localStorage.setItem('s', '42');
    expect(loadNumber('s')).toBe(42);
    for (const bad of ['"42"', '1e999', 'null', '[1]', '{']) {
      localStorage.setItem('s', bad);
      expect(loadNumber('s')).toBeNull();
    }
    expect(loadNumber('missing')).toBeNull();
    expect(readJSON('missing')).toBeNull();
  });
  it('has a unique, hinted entry for every secret', () => {
    const ids = SECRETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SECRETS) expect(s.title.length).toBeGreaterThan(0);
    for (const v of Object.values(ATUL_BEST)) expect(v).toBeGreaterThan(0);
  });
});

describe('the mystery trail', () => {
  it('gives every passphrase letter to exactly one secret', () => {
    const slots = SECRETS.flatMap((s) => (s.slot === undefined ? [] : [s.slot])).toSorted(
      (a, b) => a - b,
    );
    expect(slots).toEqual(Array.from({ length: PASSPHRASE.length }, (_, i) => i));
  });
  it('reveals letters only for found secrets', () => {
    expect(revealed([]).every((l) => l === null)).toBe(true);
    const r = revealed(['swing', 'dizzy']);
    expect(r[0]).toBe('S');
    expect(r.filter(Boolean)).toHaveLength(2);
    const all = revealed(SECRETS.map((s) => s.id));
    expect(all.join('')).toBe(PASSPHRASE);
  });
  it('accepts the passphrase however it is typed', () => {
    expect(isPassphrase('ship every day')).toBe(true);
    expect(isPassphrase('Ship-Every-Day!')).toBe(true);
    expect(isPassphrase('ship every night')).toBe(false);
  });
  it('rot13 round-trips, so the terminal note can be decoded', () => {
    const note = 'The passphrase is what he does, every day.';
    expect(rot13(rot13(note))).toBe(note);
    expect(rot13(note)).not.toContain('passphrase');
  });
  it('writes riddles, not instructions, for every secret', () => {
    for (const s of SECRETS) {
      expect(s.riddle.length).toBeGreaterThan(20);
      expect(s.riddle).not.toMatch(/click|press the|five times in a row/i);
    }
  });
});
