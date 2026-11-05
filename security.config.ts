/**
 * One source of truth for AtulOS security headers.
 * - The CSP is injected as a <meta> tag into production builds (works on any static host).
 * - The full header set is emitted as `dist/_headers` (Netlify, Cloudflare Pages) and
 *   mirrored in `vercel.json`; a unit test keeps that file in sync.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  // React sets inline `style` attributes for animation; no inline <style> or scripts are used.
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://api.github.com',
    'https://github-contributions-api.jogruber.de',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'", 'mailto:'],
  'manifest-src': ["'self'"],
  'worker-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

export const cspString = (extra: Record<string, string[]> = {}) =>
  Object.entries({ ...CSP_DIRECTIVES, ...extra })
    .map(([k, v]) => [k, ...v].join(' '))
    .join('; ');

/** Headers only a server can send (frame-ancestors is ignored in a <meta> CSP). */
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': cspString({ 'frame-ancestors': ["'none'"] }),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

export const headersFile = () =>
  `/*\n${Object.entries(SECURITY_HEADERS)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')}\n`;
