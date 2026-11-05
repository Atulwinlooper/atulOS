import { describe, expect, it } from 'vite-plus/test';
import { jobs } from '../data/cv';
import {
  classify,
  diffTools,
  duration,
  lanes,
  metricParts,
  monthIndex,
  monthsBetween,
} from './release';

const NOW = new Date(2026, 10, 5);

describe('release history helpers', () => {
  it('measures job lengths in months', () => {
    expect(monthsBetween('Aug 2025', 'Present', NOW)).toBe(16);
    expect(monthsBetween('Jun 2023', 'Oct 2023', NOW)).toBe(5);
    expect(duration(16)).toBe('1 yr 4 mos');
    expect(duration(12)).toBe('1 yr');
    expect(duration(1)).toBe('1 mo');
  });
  it('sorts CV lines into patch-note sections', () => {
    expect(classify('Cut app startup time by 30%')).toBe('improved');
    expect(classify('Cut security vulnerabilities by 40%')).toBe('fixed');
    expect(classify('Led Flutter B2B and B2C fashion commerce apps')).toBe('new');
  });
  it('highlights metrics without losing any text', () => {
    const line = 'Delivered 20 production features and cut effort by 40%.';
    const parts = metricParts(line);
    expect(parts.map((p) => p.text).join('')).toBe(line);
    expect(parts.filter((p) => p.metric).map((p) => p.text)).toEqual(['20', '40%']);
  });
  it('diffs the toolbox between versions', () => {
    expect(diffTools(['Flutter', 'REST'], ['Flutter', 'Fastlane'])).toEqual({
      added: ['Fastlane'],
      removed: ['REST'],
      kept: ['Flutter'],
    });
  });
  it('has a codename and tools for every job, in time order', () => {
    for (const j of jobs) {
      expect(j.codename.length).toBeGreaterThan(0);
      expect(j.tools.length).toBeGreaterThan(0);
    }
  });
});

describe('career timeline lanes', () => {
  it('stacks overlapping roles and keeps back-to-back roles on one row', () => {
    expect(
      lanes([
        { start: 0, end: 6 },
        { start: 3, end: 18 },
        { start: 18, end: 22 },
      ]),
    ).toEqual([0, 1, 0]);
  });
  it('starts the career in December 2021: five years by November 2026', () => {
    const first = jobs.at(-1);
    expect(first?.start).toBe('Dec 2021');
    expect(duration(monthsBetween('Dec 2021', 'Present', NOW))).toBe('5 yrs');
    expect(monthIndex('Dec 2021', NOW)).toBeLessThan(monthIndex('Mar 2022', NOW));
  });
});
