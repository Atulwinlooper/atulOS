import { describe, expect, it } from 'vite-plus/test';
import { beats, shuffle } from './kit';
import { CONFLICT, move, slideRow, stuck } from './MergeConflict';
import { cut } from './StackOverflow';
import { target } from './TypingSprint';

describe('Merge Conflict (2048 rules)', () => {
  it('slides and merges each pair once', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], points: 8 });
    expect(slideRow([0, 2, 0, 2])).toEqual({ row: [4, 0, 0, 0], points: 4 });
    expect(slideRow([4, 4, 8, 0])).toEqual({ row: [8, 8, 0, 0], points: 8 });
    expect(slideRow([2, 4, 8, 16])).toEqual({ row: [2, 4, 8, 16], points: 0 });
  });
  it('treats a conflict as a wall nothing passes or merges through', () => {
    expect(slideRow([0, CONFLICT, 2, 2]).row).toEqual([0, CONFLICT, 4, 0]);
    expect(slideRow([2, CONFLICT, 0, 2]).row).toEqual([2, CONFLICT, 2, 0]);
  });
  it('moves the whole board in each direction', () => {
    const b = [
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ];
    expect(move(b, 'left').board[0]).toEqual([4, 0, 0, 0]);
    expect(move(b, 'right').board[0]).toEqual([0, 0, 0, 4]);
    expect(move(b, 'up').board.map((r) => r[0])).toEqual([4, 0, 0, 0]);
    expect(move(b, 'down').board.map((r) => r[0])).toEqual([0, 0, 0, 4]);
    expect(move(b, 'left').moved).toBe(true);
  });
  it('knows when the game is over', () => {
    const full = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(stuck(full)).toBe(true);
    full[0][1] = 2;
    expect(stuck(full)).toBe(false);
  });
});

describe('Stack Overflow cut', () => {
  it('keeps only the overlap and drops the overhang', () => {
    expect(cut({ x: 130, w: 100 }, { x: 100, w: 100 })).toMatchObject({
      x: 130,
      w: 70,
      perfect: false,
      chip: { x: 200, w: 30 },
    });
    expect(cut({ x: 80, w: 100 }, { x: 100, w: 100 })).toMatchObject({
      x: 100,
      w: 80,
      chip: { x: 80, w: 20 },
    });
  });
  it('snaps near-misses to a perfect drop', () => {
    expect(cut({ x: 103, w: 100 }, { x: 100, w: 100 })).toMatchObject({
      x: 100,
      w: 100,
      perfect: true,
    });
  });
  it('misses entirely when nothing overlaps', () => {
    expect(cut({ x: 300, w: 50 }, { x: 100, w: 100 })).toBeNull();
  });
});

describe('Typing Sprint targeting', () => {
  it('aims at the lowest word the typed text starts', () => {
    const words = [
      { text: 'widget', y: 10 },
      { text: 'widget', y: 60 },
      { text: 'state', y: 90 },
    ];
    expect(target(words, 'wid')).toEqual({ text: 'widget', y: 60 });
    expect(target(words, 'x')).toBeNull();
    expect(target(words, '')).toBeNull();
  });
});

describe('score helpers', () => {
  it('compares scores in the right direction', () => {
    expect(beats(10, null)).toBe(true);
    expect(beats(10, 9)).toBe(true);
    expect(beats(10, 11)).toBe(false);
    expect(beats(8, 10, true)).toBe(true);
  });
  it('shuffles without losing cards', () => {
    const deck = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(deck).toSorted((a, b) => a - b)).toEqual(deck);
  });
});
