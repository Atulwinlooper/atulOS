import { skills, techniques } from '../data/cv';

export function Skills() {
  return (
    <div className="app pad skills">
      <h2 className="app-h">Signature techniques</h2>
      <p className="muted lead">Each meter is a real result from my work, not a self-rating.</p>
      <div className="techs">
        {techniques.map((t) => (
          <div key={t.name} className="tech">
            <div className="tech-top">
              <b>{t.name}</b>
              <span className="tech-val">{t.value}</span>
            </div>
            <span className="mono tech-tools">{t.tools}</span>
            <div className="meter" aria-hidden="true">
              <i style={{ width: `${t.pct}%` }} />
            </div>
            <small className="muted">{t.effect}</small>
          </div>
        ))}
      </div>
      <h3 className="app-h3">Full stack</h3>
      <div className="skill-groups">
        {skills.map((g) => (
          <div key={g.group} className="sg">
            <span className="label">{g.group}</span>
            <div className="chips">
              {g.items.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
