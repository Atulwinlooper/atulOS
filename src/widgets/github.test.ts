import { describe, expect, it } from 'vite-plus/test';
import { isGitHubUser, parseContributions, parseUser } from './github';

describe('GitHub response parsing', () => {
  it('reads public counts', () => {
    expect(parseUser({ public_repos: 12, followers: 30, login: 'x' })).toEqual({
      repos: 12,
      followers: 30,
    });
  });
  it('rejects wrong shapes and hostile values', () => {
    expect(parseUser(null)).toEqual({});
    expect(parseUser([])).toEqual({});
    expect(parseUser({ public_repos: '12', followers: -1 })).toEqual({
      repos: undefined,
      followers: undefined,
    });
  });
  it('keeps the last 20 weeks of valid days', () => {
    const contributions = Array.from({ length: 365 }, (_, i) => ({
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      count: 1,
      level: 1,
    }));
    const r = parseContributions({ contributions });
    expect(r.days).toHaveLength(140);
    expect(r.total).toBe(140);
  });
  it('skips malformed days', () => {
    const r = parseContributions({
      contributions: [
        { date: '2026-01-01', count: 2, level: 1 },
        { date: '<img src=x>', count: 2, level: 1 },
        { date: '2026-01-02', count: 2, level: 9 },
        { date: '2026-01-03', count: 'lots', level: 1 },
      ],
    });
    expect(r).toEqual({ days: [{ date: '2026-01-01', count: 2, level: 1 }], total: 2 });
    expect(parseContributions({ contributions: 'x' })).toEqual({});
    expect(parseContributions(undefined)).toEqual({});
  });
  it('only accepts real usernames', () => {
    expect(isGitHubUser('Atulwinlooper')).toBe(true);
    expect(isGitHubUser('a-b')).toBe(true);
    for (const bad of ['', '-a', 'a--b', '../x', 'a/b', 'a?x=1', 'x'.repeat(40)]) {
      expect(isGitHubUser(bad)).toBe(false);
    }
  });
});
