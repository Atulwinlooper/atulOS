import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import { CSP_DIRECTIVES, SECURITY_HEADERS, cspString, headersFile } from '../security.config';

describe('security headers', () => {
  it('blocks inline and third-party scripts', () => {
    expect(CSP_DIRECTIVES['script-src']).toEqual(["'self'"]);
    expect(cspString()).not.toMatch(/unsafe-eval/);
    expect(CSP_DIRECTIVES['object-src']).toEqual(["'none'"]);
  });
  it('only allows the two GitHub data endpoints the widget needs', () => {
    expect(CSP_DIRECTIVES['connect-src']).toEqual([
      "'self'",
      'https://api.github.com',
      'https://github-contributions-api.jogruber.de',
    ]);
  });
  it('forbids framing (clickjacking)', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(headersFile()).toMatch(/^\/\*\n {2}Content-Security-Policy: /);
  });
  it('keeps vercel.json in sync with security.config.ts', () => {
    const vercel: unknown = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(vercel).toMatchObject({
      headers: expect.arrayContaining([
        {
          source: '/(.*)',
          headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
        },
      ]),
    });
  });
});
