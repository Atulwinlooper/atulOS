import { useMemo, useState } from 'react';
import { education, jobs } from '../data/cv';
import {
  classify,
  diffTools,
  duration,
  lanes,
  metricParts,
  monthIndex,
  monthsBetween,
  type NoteKind,
} from './release';

const SECTIONS: { kind: NoteKind; title: string; mark: string }[] = [
  { kind: 'new', title: 'New', mark: '+' },
  { kind: 'improved', title: 'Improved', mark: '▲' },
  { kind: 'fixed', title: 'Hardened', mark: '✓' },
];

/** Jobs oldest first, as versions v1.0 → vN.0. */
const VERSIONS = jobs.toReversed().map((j, i) => Object.assign({ v: `v${i + 1}.0` }, j));

/**
 * Experience as the release history of an app called Atul: one major version per job,
 * a progress track across the years, patch notes, and a git diff of the toolbox.
 */
export function Experience() {
  const [now] = useState(() => new Date());
  const [sel, setSel] = useState(VERSIONS.length - 1);
  const job = VERSIONS[sel];
  const prev = VERSIONS[sel - 1];

  const track = useMemo(() => {
    const start = monthIndex(VERSIONS[0].start, now);
    const total = monthIndex('Present', now) - start + 1;
    const lane = lanes(
      VERSIONS.map((j) => ({ start: monthIndex(j.start, now), end: monthIndex(j.end, now) })),
    );
    return VERSIONS.map((j, i) => ({
      left: ((monthIndex(j.start, now) - start) / total) * 100,
      width: (monthsBetween(j.start, j.end, now) / total) * 100,
      lane: lane[i],
    }));
  }, [now]);
  const laneCount = Math.max(...track.map((t) => t.lane)) + 1;

  const totalMonths = monthsBetween(VERSIONS[0].start, 'Present', now);
  const notes = SECTIONS.map((s) => ({
    kind: s.kind,
    title: s.title,
    mark: s.mark,
    lines: job.points.filter((p) => classify(p) === s.kind),
  })).filter((s) => s.lines.length);
  const diff = diffTools(prev?.tools ?? [], job.tools);
  const firstYear = Number(VERSIONS[0].start.split(' ')[1]);

  return (
    <div className="app pad experience">
      <header className="rh-head">
        <span className="rh-icon" aria-hidden="true">
          अ
        </span>
        <span>
          <h2 className="app-h">Atul.app · Release history</h2>
          <span className="muted">
            {duration(totalMonths)} in production · {VERSIONS.length} major versions · still
            shipping
          </span>
        </span>
      </header>

      {/* A visual shortcut; the version list below is the accessible way to switch. */}
      <div className="rh-track" aria-hidden="true" style={{ height: laneCount > 1 ? 48 : 34 }}>
        {VERSIONS.map((j, i) => (
          <button
            key={j.v}
            type="button"
            tabIndex={-1}
            className={`rh-seg${i === sel ? ' on' : ''}${j.current ? ' live' : ''}${track[i].width < 8 ? ' narrow' : ''}`}
            aria-label={`${j.v} ${j.codename}`}
            style={{
              left: `${track[i].left}%`,
              width: `${track[i].width}%`,
              top: `calc(3px + ${track[i].lane} * (100% - 6px) / ${laneCount})`,
              height: `calc((100% - 6px) / ${laneCount} - ${laneCount > 1 ? 2 : 0}px)`,
            }}
            onClick={() => setSel(i)}
          >
            <span className="mono">{j.v}</span>
          </button>
        ))}
        <span className="rh-now" aria-hidden="true">
          now
        </span>
      </div>
      <div className="rh-years mono" aria-hidden="true">
        {Array.from({ length: now.getFullYear() - firstYear + 1 }, (_, k) => (
          <span key={firstYear + k}>{firstYear + k}</span>
        ))}
      </div>

      <div className="rh-body">
        <ol className="rh-list" aria-label="Versions">
          {VERSIONS.map((j, i) => (
            <li key={j.v}>
              <button
                type="button"
                className={`rh-item${i === sel ? ' on' : ''}`}
                aria-current={i === sel ? 'true' : undefined}
                onClick={() => setSel(i)}
              >
                <span className="rh-v mono">{j.v}</span>
                <span className="rh-item-t">
                  <b>{j.codename}</b>
                  <small>
                    {j.role} · {j.company.replace(/ (Pvt\. Ltd\.|LLP)$/, '')}
                  </small>
                </span>
                {j.current && <span className="tag">Live</span>}
              </button>
            </li>
          )).toReversed()}
        </ol>

        <article id="rh-notes" className="rh-notes" key={job.v} aria-live="polite">
          <div className="rh-notes-head">
            <span className="rh-big mono">{job.v}</span>
            <span>
              <b>“{job.codename}”</b>
              <span className="muted">
                {job.role} at {job.company}
              </span>
              <span className="rh-when mono">
                {job.start} – {job.end} · {duration(monthsBetween(job.start, job.end, now))}
                {job.current ? ' · live in production' : ''}
              </span>
            </span>
          </div>

          {notes.map((s) => (
            <section key={s.kind} className={`rh-sec k-${s.kind}`}>
              <h3>
                <span aria-hidden="true">{s.mark}</span> {s.title}
              </h3>
              <ul>
                {s.lines.map((line) => (
                  <li key={line}>
                    {metricParts(line).map((part) =>
                      part.metric ? (
                        <mark key={part.at}>{part.text}</mark>
                      ) : (
                        <span key={part.at}>{part.text}</span>
                      ),
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rh-diff">
            <h3 className="mono">
              $ git diff {prev ? `${prev.v}..${job.v}` : `init..${job.v}`} -- toolbox
            </h3>
            <pre className="mono">
              {diff.added.map((t) => (
                <span key={`+${t}`} className="add">
                  + {t}
                  {'\n'}
                </span>
              ))}
              {diff.removed.map((t) => (
                <span key={`-${t}`} className="del">
                  - {t}
                  {'\n'}
                </span>
              ))}
              {diff.kept.map((t) => (
                <span key={`=${t}`} className="keep">
                  {'  '}
                  {t}
                  {'\n'}
                </span>
              ))}
            </pre>
          </section>

          <div className="rh-nav">
            <button
              type="button"
              className="btn"
              disabled={sel === 0}
              onClick={() => setSel(sel - 1)}
            >
              ← Older
            </button>
            <button
              type="button"
              className="btn"
              disabled={sel === VERSIONS.length - 1}
              onClick={() => setSel(sel + 1)}
            >
              Newer →
            </button>
          </div>
        </article>
      </div>

      <section className="rh-boot">
        <span className="label">Bootloader</span>
        <div className="edu">
          {education.map((e) => (
            <div key={e.degree} className="edu-item">
              <b>{e.degree}</b>
              <span className="muted">
                {e.school} · {e.years}
                {e.note && ` · ${e.note}`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
