import { describe, expect, it } from 'vite-plus/test';
import { resumeText } from './resume';
import { education, jobs, profile, projects, skills, techniques } from './cv';

describe('CV content', () => {
  it('has the essentials', () => {
    expect(profile.name).toBe('Atul Bhadoriya');
    // Contact details live in .env; a fork without one still builds and tests.
    if (profile.email) expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    for (const url of [profile.github, profile.linkedin]) expect(url).toMatch(/^https:\/\//);
  });
  it('has unique project ids and complete project cards', () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
    for (const p of projects) {
      expect(p.challenges.length).toBe(3);
      expect(p.summary.length).toBeGreaterThan(60);
      expect(p.stack.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#[\da-f]{6}$/i);
    }
  });
  it('has jobs, education, skills and techniques', () => {
    expect(jobs.length).toBeGreaterThan(0);
    expect(education.length).toBeGreaterThan(0);
    expect(skills.every((g) => g.items.length > 0)).toBe(true);
    expect(techniques.length).toBeGreaterThan(0);
  });
});

describe('project write-ups', () => {
  it('never name a client, product or employer, except apps cleared to share', () => {
    const names = /pixelque|lovoj|codenia|perfect ergonomics|\bqms\b/i;
    for (const p of projects) {
      const text = [
        p.name,
        p.summary,
        p.outcome,
        p.role,
        p.scale,
        ...p.challenges.flatMap((c) => [c.title, c.text]),
      ].join(' ');
      expect(text).not.toMatch(names);
    }
  });
});

describe('named apps', () => {
  it('link only to their Google Play listings', () => {
    for (const p of projects)
      for (const l of p.links ?? [])
        expect(l.url).toMatch(/^https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w.]+$/);
  });
});

describe('résumé', () => {
  it('includes every job and education entry, in plain ATS-readable text', () => {
    const text = resumeText();
    for (const j of jobs) expect(text).toContain(j.company);
    for (const e of education) expect(text).toContain(e.degree);
    expect(text).toContain('Dec 2021 – Jun 2022');
    expect(text).not.toMatch(/\bI (work|own|build)\b/);
  });
});
