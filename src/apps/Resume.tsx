import { useState } from 'react';
import { RESUME_DOCX, RESUME_FILE, RESUME_PDF, resume, resumeText } from '../data/resume';

/**
 * The résumé: a live preview of exactly what the PDF and Word downloads contain, plus a plain
 * text copy for application forms. All three are built from src/data/cv.ts.
 */
export function Resume() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resumeText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="app resume">
      <div className="resume-bar">
        <span className="resume-file">
          <b className="mono">{RESUME_FILE}</b>
          <span
            className="resume-ats"
            title="One column, standard headings, real selectable text, no tables or images"
          >
            ATS-friendly
          </span>
        </span>
        <span className="row-actions">
          <a className="btn primary" href={RESUME_PDF} download>
            Download PDF
          </a>
          <a className="btn" href={RESUME_DOCX} download>
            Word (.docx)
          </a>
          <button type="button" className="btn" onClick={copy}>
            {copied ? 'Copied' : 'Copy as text'}
          </button>
        </span>
      </div>

      {/* Focusable so the preview can be scrolled from the keyboard. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <section className="resume-scroll" aria-label="Résumé preview" tabIndex={0}>
        <article className="paper">
          <header>
            <h1>{resume.name}</h1>
            <p className="paper-role">{resume.headline}</p>
            <p className="paper-contact">{resume.contact.join('  |  ')}</p>
          </header>
          <h2>Summary</h2>
          <p>{resume.summary}</p>
          <h2>Skills</h2>
          {resume.skills.map((s) => (
            <p key={s.label}>
              <b>{s.label}:</b> {s.items}
            </p>
          ))}
          <h2>Experience</h2>
          {resume.experience.map((j) => (
            <section key={j.company}>
              <h3>
                {j.role}, {j.company}
                <span>{j.dates}</span>
              </h3>
              <ul>
                {j.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
          <h2>Selected projects</h2>
          {resume.projects.map((p) => (
            <p key={p.name}>
              <b>{p.name}</b> ({p.meta}). {p.line}
            </p>
          ))}
          <h2>Education</h2>
          {resume.education.map((e) => (
            <p key={e.degree}>
              <b>{e.degree}</b> · {e.detail}
            </p>
          ))}
          <h2>Additional</h2>
          {resume.extra.map((x) => (
            <p key={x}>{x}</p>
          ))}
        </article>
      </section>
    </div>
  );
}
