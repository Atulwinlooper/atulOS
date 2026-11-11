import { useMemo, useState } from 'react';
import { projects, type Project } from '../data/cv';
import { Icon } from '../os/icons';
import { useOS } from '../os/store';

const CATS = ['All', 'Enterprise', 'Commerce', 'Government', 'Social', 'Side projects'] as const;

export function Projects() {
  const { open } = useOS();
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [q, setQ] = useState('');
  const list = useMemo(
    () =>
      projects.filter(
        (p) =>
          (cat === 'All' || p.category === cat) &&
          (q === '' ||
            `${p.name} ${p.domain} ${p.summary} ${p.stack.join(' ')}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [cat, q],
  );
  const [sel, setSel] = useState<string>(projects[0].id);
  const p: Project = list.find((x) => x.id === sel) ?? list[0] ?? projects[0];

  return (
    <div className="app projects">
      <nav className="side" aria-label="Project categories">
        <span className="label side-h">Library</span>
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            className={`side-item${cat === c ? ' on' : ''}`}
            onClick={() => setCat(c)}
          >
            {c === 'All' ? 'All apps' : c}
            <span className="faint">
              {c === 'All' ? projects.length : projects.filter((x) => x.category === c).length}
            </span>
          </button>
        ))}
        <span className="label side-h">Built with</span>
        <span className="side-item static">
          <i className="dot" style={{ background: 'var(--cool)' }} />
          Flutter
        </span>
        <span className="side-item static">
          <i className="dot" style={{ background: 'var(--ember)' }} />
          React Native
        </span>
        <span className="side-item static">
          <i className="dot" style={{ background: '#8FD9A8' }} />
          Android (Java)
        </span>
        <span className="side-item static">
          <i className="dot" style={{ background: '#E8C76A' }} />
          Web
        </span>
      </nav>

      <div className="plist">
        <label className="search">
          <Icon.search size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps or tech"
            aria-label="Search projects"
          />
        </label>
        <ul>
          {list.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                className={`prow${x.id === p.id ? ' on' : ''}`}
                onClick={() => setSel(x.id)}
              >
                <span className="ptile" style={{ background: x.color, color: x.ink }}>
                  {x.short}
                </span>
                <span className="prow-text">
                  <b>{x.name}</b>
                  <small>
                    {x.domain} · {x.tech}
                  </small>
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="muted empty">No apps match “{q}”.</li>}
        </ul>
      </div>

      <article className="pdetail" key={p.id}>
        <header className="pd-head">
          <span
            className="ptile big"
            style={{
              background: `linear-gradient(160deg, ${p.color}, ${p.color}cc)`,
              color: p.ink,
            }}
          >
            {p.short}
          </span>
          <span>
            <h2>{p.name}</h2>
            <span className="muted">
              {p.domain} · {p.tech}
            </span>
          </span>
        </header>
        <p className="pd-summary">{p.summary}</p>
        <dl className="pd-facts">
          <div>
            <dt>Role</dt>
            <dd>{p.role}</dd>
          </div>
          <div>
            <dt>Scale</dt>
            <dd>{p.scale}</dd>
          </div>
          <div>
            <dt>Platforms</dt>
            <dd>{p.platforms}</dd>
          </div>
        </dl>
        <section>
          <span className="label">How it was built</span>
          <ol className="pd-challenges">
            {p.challenges.map((c, i) => (
              <li key={c.title}>
                <span className="pd-n mono" aria-hidden="true">
                  0{i + 1}
                </span>
                <span>
                  <b>{c.title}</b>
                  <span className="muted">{c.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <p className="pd-outcome">
          <span className="label">Outcome</span>
          {p.outcome}
        </p>
        <div className="chips">
          {p.stack.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        <div className="pd-actions">
          {p.links?.map((l) => (
            <a
              key={l.url}
              className="btn"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${l.label === 'Google Play' ? 'Get it on Google Play' : l.label} (opens in a new tab)`}
            >
              {l.label === 'Google Play' ? 'Get it on Google Play' : l.label}{' '}
              <Icon.external size={13} />
            </a>
          ))}
          <button
            type="button"
            className="btn primary"
            onClick={() => open('mail', { subject: `About ${p.name}` })}
          >
            Ask me about this project
          </button>
        </div>
        {!p.links && (
          <p className="faint pd-nda">
            Client and product names are left out: the work is under NDA.
          </p>
        )}
      </article>
    </div>
  );
}
