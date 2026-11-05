/**
 * Builds the downloadable résumé from src/data/cv.ts:
 *   public/Atul_Bhadoriya_Resume.pdf   text-based PDF, rendered by Chromium
 *   public/Atul_Bhadoriya_Resume.docx  Word file, for portals that prefer .docx
 *
 * Run: npm run resume   (re-run whenever cv.ts changes)
 */
import { existsSync, writeFileSync } from 'node:fs';

// Contact details live in .env (see .env.example). Load it before the CV module reads them.
if (existsSync('.env')) process.loadEnvFile('.env');
import { chromium } from '@playwright/test';
import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import type { Resume } from '../src/data/resume';

// Imported after .env is loaded (static imports would run first).
const { RESUME_FILE, resume } = await import('../src/data/resume');

const ACCENT = '#B5481C';
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ------------------------------------------------------------------- PDF (HTML → Chromium)

function html(r: Resume) {
  const section = (title: string, body: string) =>
    `<section><h2>${esc(title)}</h2>${body}</section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(r.name)} – Résumé</title>
<style>
  @page { size: A4; margin: 15mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.2pt/1.42 Arial, Helvetica, sans-serif; color: #1d1a17; }
  h1 { margin: 0; font-size: 22pt; letter-spacing: -0.01em; color: ${ACCENT}; }
  .headline { margin: 2px 0 4px; font-size: 11pt; font-weight: 700; }
  .contact { margin: 0 0 10px; font-size: 9.4pt; color: #3d3833; }
  h2 { margin: 12px 0 5px; padding-bottom: 2px; font-size: 10.5pt; letter-spacing: 0.08em;
       text-transform: uppercase; color: ${ACCENT}; border-bottom: 1.2px solid #d9cfc6;
       break-after: avoid; }
  h2 + * { break-before: avoid; }
  p { margin: 0 0 4px; }
  .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; }
  .row b { font-size: 10.4pt; }
  .row span { white-space: nowrap; color: #3d3833; }
  ul { margin: 2px 0 0; padding-left: 15px; }
  li { margin: 1px 0; }
  .skill b, .proj b { color: #1d1a17; }
  section { break-inside: auto; }
  .job, .proj { break-inside: avoid; }
</style></head><body>
<h1>${esc(r.name)}</h1>
<p class="headline">${esc(r.headline)}</p>
<p class="contact">${r.contact.map(esc).join(' &nbsp;|&nbsp; ')}</p>
${section('Summary', `<p>${esc(r.summary)}</p>`)}
${section('Skills', r.skills.map((s) => `<p class="skill"><b>${esc(s.label)}:</b> ${esc(s.items)}</p>`).join(''))}
${section(
  'Experience',
  r.experience
    .map(
      (
        j,
      ) => `<div class="job"><div class="row"><b>${esc(j.role)}, ${esc(j.company)}</b><span>${esc(j.dates)}</span></div>
<ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`,
    )
    .join(''),
)}
${section(
  'Selected projects',
  r.projects
    .map((p) => `<p class="proj"><b>${esc(p.name)}</b> (${esc(p.meta)}). ${esc(p.line)}</p>`)
    .join(''),
)}
${section('Education', r.education.map((e) => `<p><b>${esc(e.degree)}</b> · ${esc(e.detail)}</p>`).join(''))}
${section('Additional', r.extra.map((x) => `<p>${esc(x)}</p>`).join(''))}
</body></html>`;
}

async function pdf(r: Resume, out: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html(r), { waitUntil: 'load' });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
  });
  await browser.close();
}

// ------------------------------------------------------------------- DOCX

const para = (runs: TextRun[], after = 60) => new Paragraph({ spacing: { after }, children: runs });

function docx(r: Resume) {
  const FONT = 'Arial';
  const accent = ACCENT.slice(1);
  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: 220, after: 80 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D9CFC6', space: 2 } },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          color: accent,
          size: 21,
          font: FONT,
          characterSpacing: 16,
        }),
      ],
    });
  const t = (text: string, o: { bold?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font: FONT, size: o.size ?? 20, bold: o.bold, color: o.color });
  // Right-aligned dates on the same line as the role (A4 text width ≈ 9638 twips at 16mm margins).
  const RIGHT = 9638;
  const children = [
    new Paragraph({
      spacing: { after: 20 },
      children: [t(r.name, { bold: true, size: 44, color: accent })],
    }),
    para([t(r.headline, { bold: true, size: 22 })], 40),
    para([t(r.contact.join('  |  '), { size: 19, color: '3D3833' })], 120),
    heading('Summary'),
    para([t(r.summary)]),
    heading('Skills'),
    ...r.skills.map((s) => para([t(`${s.label}: `, { bold: true }), t(s.items)], 40)),
    heading('Experience'),
    ...r.experience.flatMap((j) => [
      new Paragraph({
        spacing: { before: 100, after: 30 },
        keepNext: true,
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }],
        children: [
          t(`${j.role}, ${j.company}`, { bold: true, size: 21 }),
          t(`\t${j.dates}`, { color: '3D3833' }),
        ],
      }),
      ...j.bullets.map(
        (b) =>
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 20 },
            children: [t(b)],
          }),
      ),
    ]),
    heading('Selected projects'),
    ...r.projects.map((p) => para([t(p.name, { bold: true }), t(` (${p.meta}). `), t(p.line)], 60)),
    heading('Education'),
    ...r.education.map((e) => para([t(e.degree, { bold: true }), t(` · ${e.detail}`)], 40)),
    heading('Additional'),
    ...r.extra.map((x) => para([t(x)], 40)),
  ];
  return new Document({
    creator: r.name,
    title: `${r.name} – Résumé`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 300, hanging: 200 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 850, bottom: 850, left: 907, right: 907 },
          },
        },
        children,
      },
    ],
  });
}

const base = `public/${RESUME_FILE}`;
await pdf(resume, `${base}.pdf`);
writeFileSync(`${base}.docx`, await Packer.toBuffer(docx(resume)));
process.stdout.write(`Wrote ${base}.pdf and ${base}.docx\n`);
