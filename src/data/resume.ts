/**
 * The résumé, assembled from cv.ts. One structure feeds three outputs: the Résumé app, the
 * PDF and the Word file (scripts/resume.ts), so they can never disagree.
 *
 * ATS rules followed: one column, standard section names, plain text bullets, dates as
 * "Mon YYYY – Mon YYYY", no tables, images or text boxes, and keywords spelled out in full.
 */
import { education, jobs, profile, projects, skills } from './cv';

export const RESUME_FILE = 'Atul_Bhadoriya_Resume';
export const RESUME_PDF = `/${RESUME_FILE}.pdf`;
export const RESUME_DOCX = `/${RESUME_FILE}.docx`;

export const resume = {
  name: profile.name,
  headline: `${profile.role} | Flutter · React Native · Clean Architecture · CI/CD`,
  contact: [
    profile.location,
    profile.phone,
    profile.email,
    profile.linkedinLabel,
    `github.com/${profile.githubUser}`,
  ].filter(Boolean),
  // Résumés read better without "I": same summary, third-person neutral.
  summary: profile.summary
    .replace('I work in', 'Works in')
    .replace('automate CI/CD', 'automates CI/CD')
    .replace(', and own ', ', and owns '),
  skills: skills
    .filter((g) => g.group !== 'Practices')
    .map((g) => ({ label: g.group, items: g.items.join(', ') })),
  experience: jobs.map((j) => ({
    role: j.role,
    company: j.company,
    dates: `${j.start} – ${j.end}`,
    bullets: j.points,
  })),
  projects: projects.map((p) => ({
    name: `${p.name[0].toUpperCase()}${p.name.slice(1)}`,
    meta: `${p.domain} · ${p.tech}`,
    line: p.brief,
  })),
  education: education.map((e) => ({
    degree: e.degree,
    detail: [e.school, e.years, e.note].filter(Boolean).join(' · '),
  })),
  extra: [
    `Languages: ${profile.languages.join(', ')}`,
    `Practices: ${skills.find((g) => g.group === 'Practices')?.items.join(', ') ?? ''}`,
  ],
};

export type Resume = typeof resume;

/** The résumé as plain text, for pasting into job-application forms. */
export function resumeText(r: Resume = resume) {
  const lines = [r.name, r.headline, r.contact.join(' | '), '', 'SUMMARY', r.summary, '', 'SKILLS'];
  for (const s of r.skills) lines.push(`${s.label}: ${s.items}`);
  lines.push('', 'EXPERIENCE');
  for (const j of r.experience) {
    lines.push(`${j.role}, ${j.company} | ${j.dates}`);
    for (const b of j.bullets) lines.push(`- ${b}`);
    lines.push('');
  }
  lines.push('SELECTED PROJECTS');
  for (const p of r.projects) lines.push(`${p.name} (${p.meta}). ${p.line}`);
  lines.push('', 'EDUCATION');
  for (const e of r.education) lines.push(`${e.degree} | ${e.detail}`);
  lines.push('', 'ADDITIONAL', ...r.extra);
  return lines.join('\n');
}
