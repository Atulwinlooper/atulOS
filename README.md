# AtulOS

Atul Bhadoriya's portfolio, built as an operating system: a boot sequence, a lock screen, a desktop
with widgets, windowed apps with a genie minimise, a magnifying dock, an eight-game Arcade, a
light switch, and sixteen hidden secrets that lead to a vault.

Built with **React 18 + TypeScript** on **[Vite+](https://viteplus.dev)**, the unified toolchain
(Vite 8, Rolldown, Vitest, Oxlint and Oxfmt). There is no ESLint or Prettier: `vp` lints, formats
and type-checks everything from `vite.config.ts`.

## Run it

Needs Node 22.18 or newer.

```bash
npm install
cp .env.example .env   # then fill in your contact details
npm run resume         # builds the résumé PDF and Word file (they are not in git)
npm run dev            # vp dev, opens http://localhost:5173
```

**Live:** https://atulos.pages.dev

| Script              | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server with hot reload (`vp dev`)        |
| `npm run build`     | Production build into `dist/` (`vp build`)   |
| `npm run preview`   | Serve the production build (`vp preview`)    |
| `npm run check`     | Format, lint and type-check (`vp check`)     |
| `npm run check:fix` | Fix formatting and lint issues automatically |
| `npm run test`      | Unit and component tests (`vp test`)         |
| `npm run test:e2e`  | Browser tests on the production build        |
| `npm run test:all`  | Everything above, in order                   |
| `npm run resume`    | Rebuild the résumé PDF and Word file         |

With the global Vite+ CLI installed (`curl -fsSL https://vite.plus | bash`) you can run the same
commands directly: `vp dev`, `vp check`, `vp build`.

## Editing the content

Everything about Atul lives in **`src/data/cv.ts`**: profile, projects, jobs, education, skills and
the technique meters. Change it there and every app updates. Private contact details (email,
phone) are not in the repo: they come from `.env` (copy `.env.example`).

- The résumé: built from `cv.ts` by `npm run resume` into `public/Atul_Bhadoriya_Resume.pdf` and
  `.docx` (single column, real text, standard headings, so applicant tracking systems read it).
  Re-run it after editing `cv.ts`.
- Your high scores for the Arcade: `ATUL_BEST` in `src/eggs/secrets.ts`.
- The secrets and their hints: `SECRETS` in the same file.

## Make your own

You're welcome to build your own portfolio from this. The code is MIT; the personal content is not
(see `CONTENT.md`), so swap in your own before you publish:

1. **Fork and install:** fork the repo, then `npm install` and `cp .env.example .env`.
2. **Your details:** in `.env`, set `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE` (optional, résumé only)
   and `VITE_SITE_URL` (your live address, for link previews).
3. **Your CV:** rewrite `src/data/cv.ts` (profile, jobs, projects, skills, education). Every app,
   the Terminal and the résumé read from it.
4. **Your résumé:** change the headline and file name in `src/data/resume.ts`, then `npm run resume`.
5. **Your look:** replace `public/og.png` (1200×630), `public/favicon.svg` and
   `public/apple-touch-icon.png`; change the अ mark in `src/os/Boot.tsx` and the dock; restyle the
   avatar in `src/character/` (keep the animation code, change the face, hair and clothes).
   Theme colours are tokens at the top of `src/styles.css`.
6. **Your secrets:** set your own passphrase, riddles and Arcade best scores in
   `src/eggs/secrets.ts`.
7. **Check it:** `npm run test:all` (unit tests, browser tests, accessibility).
8. **Ship it:** see Deploying below.

## Project layout

```
src/
  os/          shell: boot, lock, desktop, menu bar, dock, windows (genie), phone shell, store
  apps/        Projects, Experience, Skills, Terminal, Resume, About, Mail, Arcade, Settings, secrets.txt
  games/       Bug Smash, Ship It, Snake.dart, Widget Match
  character/   the illustrated Atul whose eyes follow the cursor
  widgets/     ID card on its elastic lanyard, GitHub, LinkedIn, clock, Now
  eggs/        secrets list, persistence, confetti
  lib/         shared DOM helpers and hooks
  data/cv.ts   all the content
e2e/           Playwright browser tests
security.config.ts  CSP and security headers (one source of truth)
```

## The Arcade

Eight games, each with a main menu, your best and last score, Atul's best, and a results screen:
Bug Smash, Ship It, Snake.dart, Widget Match (three difficulties), Merge Conflict (2048), Code
Review (breakout), Stack Overflow (tower stacker) and Typing Sprint. Atul's scores live in
`ATUL_BEST` in `src/eggs/secrets.ts`: they are placeholders until he plays.

## Lights on, lights off

A bulb hangs from the menu bar. Pull its cord for the light theme, pull and hold to change the
wallpaper (Shift+Enter on the keyboard). Settings has the same switches.

## The secrets (spoilers)

secrets.txt shows a riddle for each one. Every one of the first twelve reveals a letter of a
passphrase; all twelve open the hidden vault.

| #   | Secret                     | How                                                                 | Letter |
| --- | -------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Card shark                 | Fling the ID card hard enough to spin it                            | S      |
| 2   | Deep work                  | Tug both hoodie strings (or one, three times): hood up              | H      |
| 3   | Root access                | `sudo hire atul` in Terminal                                        | I      |
| 4   | Personal space             | Poke him five times                                                 | P      |
| 5   | Flip side                  | Click the ID card to read the back                                  | E      |
| 6   | Retro mode                 | The Konami code                                                     | V      |
| 7   | Not that file              | Drag the CV onto the Bin                                            | E      |
| 8   | Power nap                  | Leave him alone: he yawns, nods off, then sleeps                    | R      |
| 9   | Challenger                 | Beat Atul's best in any Arcade game                                 | Y      |
| 10  | Dizzy spell                | Circle the cursor around his head quickly                           | D      |
| 11  | Good engineer              | Rub his hair back and forth                                         | A      |
| 12  | Who turned out the lights? | Flick the bulb six times in four seconds                            | Y      |
| 13  | Codebreaker                | `ls -a`, `cat .notes/0x01.txt`, then `rot13` it                     |        |
| 14  | You came back              | Switch to another tab and come back                                 |        |
| 15  | Not so fast                | Move the mouse out through the top of the window (towards the tabs) |        |
| 16  | The vault                  | `open vault` and enter SHIPEVERYDAY                                 |        |

The passphrase is `PASSPHRASE` in `src/eggs/secrets.ts`; change it together with the slots.

## Testing

- **Unit and component tests** (`vp test`, Vitest + Testing Library in jsdom): lanyard physics, the
  dizzy spin detector, genie and dock maths, secrets storage, GitHub response parsing, CV data,
  security headers, and the real app booted from boot screen to desktop (windows, Terminal
  commands, the sudo egg, the Konami code).
- **End-to-end tests** (`npm run test:e2e`, Playwright on the production build, so the CSP is on):
  - layout at 1920×1080, 1440×900, 1280×720, 1024×768, tablet 768×1024, phones 390×844 and
    360×640, and a phone in landscape (844×390): no page scroll, no overlapping widgets, nothing
    off-screen, no console errors;
  - accessibility with axe (WCAG 2.2 AA) on the lock screen, home screen and every app, desktop
    and phone;
  - flows: drag, minimise and restore windows, `sudo hire atul`, the Bin dialog, keyboard-only
    use, wallpaper persistence, phone sheets and the phone's back gesture.

  First run only: `npx playwright install chromium`. Screenshots land in `e2e/.results/shots/`.

## Security and privacy

- **No third-party requests except two**: GitHub's public API and the contributions API for the
  GitHub widget. Fonts are self-hosted (no Google Fonts call), and there is no analytics.
- **Content Security Policy** in every production build (`security.config.ts`): scripts only from
  the site itself, no `eval`, no plugins, network limited to those two APIs.
- **Security headers** for hosts that support them (CSP with `frame-ancestors`, HSTS, nosniff,
  Referrer-Policy, Permissions-Policy, COOP): written to `dist/_headers` for Netlify and
  Cloudflare Pages and kept in `vercel.json` for Vercel. A test fails if the two drift apart.
- **Untrusted data is validated**: GitHub responses are checked field by field, and anything read
  back from `localStorage` is checked before use. User text (Terminal, Mail) is only ever rendered
  as text, and Mail builds an encoded `mailto:` link; there is no backend to attack.
- External links use `rel="noopener noreferrer"`. `npm audit` reports 0 vulnerabilities.

## Deploying

`npm run build` produces a static site in `dist/`. Drop it on Vercel, Netlify, Cloudflare Pages or
GitHub Pages; no server is needed. Run `npm run resume` first so the résumé is in `dist/`.

**Cloudflare Pages** (how https://atulos.pages.dev is hosted):

```bash
npm run resume && npm run build
npx wrangler@4 pages deploy dist --project-name=<your-project> --branch=main
```

Use `pages deploy` only. Other Wrangler commands (such as `pages project create` in Wrangler 4.15x)
may try to convert the project to Workers and rewrite `package.json` and `vite.config.ts`. Create
the project in the dashboard (Workers & Pages → Create → Pages → Direct Upload) instead.
Set `VITE_SITE_URL` to your domain in `.env` or your host's environment variables (for example
`https://atul.dev`) before building, so link previews on LinkedIn, X and WhatsApp show `og.png`.

## License

Code: MIT, see `LICENSE`. Personal content (CV text, the avatar's design, brand assets and the
résumé) is all rights reserved; see `CONTENT.md`.
