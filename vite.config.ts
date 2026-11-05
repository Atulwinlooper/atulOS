import { defineConfig, loadEnv, type Plugin } from 'vite-plus';
import react from '@vitejs/plugin-react';
import { cspString, headersFile } from './security.config';

/** Production-only hardening: a CSP <meta> tag and a `_headers` file for static hosts. */
/** Fills __SITE_URL__ in index.html from VITE_SITE_URL; empty (relative URLs) when unset. */
function siteUrl(): Plugin {
  let url = '';
  return {
    name: 'atulos-site-url',
    configResolved(c) {
      url = (loadEnv(c.mode, c.root, 'VITE_').VITE_SITE_URL ?? '').replace(/\/+$/, '');
    },
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', url),
  };
}

function securityHeaders(): Plugin {
  return {
    name: 'atulos-security-headers',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: cspString() },
        injectTo: 'head-prepend',
      },
    ],
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile() });
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrl(), securityHeaders()],
  // No data: URIs, so the CSP can keep font-src and img-src to 'self'.
  build: { sourcemap: false, target: 'es2022', assetsInlineLimit: 0 },
  server: { port: 5173, open: true },

  // Oxlint, type-aware, so `vp check` also type-checks.
  lint: {
    ignorePatterns: ['dist/**', 'node_modules/**'],
    options: { typeAware: true, typeCheck: true },
    plugins: ['react', 'jsx-a11y', 'typescript', 'unicorn', 'oxc'],
    categories: { correctness: 'error', suspicious: 'warn', perf: 'warn' },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-no-target-blank': 'error',
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Oxfmt replaces Prettier.
  fmt: {
    ignorePatterns: ['dist/**', 'node_modules/**'],
    singleQuote: true,
    semi: true,
    printWidth: 100,
    sortPackageJson: true,
  },

  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
});
