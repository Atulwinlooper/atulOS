import { useEffect, useState } from 'react';
import { jobs, profile, projects } from '../data/cv';
import { Icon } from '../os/icons';
import { delhiTime, useNow } from '../os/useNow';
import { loadGitHub, type GH } from './github';
import './widgets.css';

/** Loads public GitHub numbers and the last 20 weeks of contributions. Fails quietly. */
function useGitHub(user: string) {
  const [gh, setGh] = useState<GH | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    loadGitHub(user, ctl.signal).then(
      (v) => !ctl.signal.aborted && setGh(v),
      () => undefined,
    );
    return () => ctl.abort();
  }, [user]);
  return gh;
}

const LEVEL = [0.08, 0.3, 0.5, 0.72, 0.95];

export function GitHubCard() {
  const gh = useGitHub(profile.githubUser);
  return (
    <section className="widget glass gh" aria-label="GitHub">
      <div className="w-head">
        <span className="w-icon light-icon">
          <Icon.branch size={18} />
        </span>
        <span className="w-id">
          <b>GitHub</b>
          <span className="mono muted">@{profile.githubUser}</span>
        </span>
        <a className="w-open" href={profile.github} target="_blank" rel="noopener noreferrer">
          Open <Icon.external size={13} />
        </a>
      </div>
      {gh?.days ? (
        <>
          <p className="sr-only">{`${gh.total} contributions in the last 20 weeks`}</p>
          <div className="gh-grid" aria-hidden="true">
            {gh.days.map((d) => (
              <i
                key={d.date}
                title={`${d.count} on ${d.date}`}
                style={{ opacity: LEVEL[d.level] }}
              />
            ))}
          </div>
          <div className="gh-stats">
            <span>
              <b>{gh.total}</b> contributions, last 20 weeks
            </span>
            {/* Most of Atul's work is in private client repos, so link this site's source instead
                of a public-repo count that undersells it. */}
            <a href={profile.source} target="_blank" rel="noopener noreferrer">
              This site's source <Icon.external size={12} />
            </a>
          </div>
        </>
      ) : (
        <p className="muted gh-empty">
          {gh === null
            ? 'Loading activity…'
            : 'Activity is unavailable right now. Open the profile to see it.'}
        </p>
      )}
    </section>
  );
}

export function LinkedInCard() {
  return (
    <section className="widget glass li" aria-label="LinkedIn">
      <div className="w-head">
        <span className="w-icon" style={{ background: 'var(--cool)', color: '#0B0A0C' }}>
          <Icon.person size={18} />
        </span>
        <span className="w-id">
          <b>LinkedIn</b>
          <span className="muted">{profile.linkedinLabel}</span>
        </span>
      </div>
      <div className="li-who">
        <b>{profile.name}</b>
        <span>Senior Mobile Engineer · Flutter · React Native · Clean Architecture</span>
        <span className="faint">{profile.location}</span>
      </div>
      <a
        className="btn light"
        href={profile.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        style={{ alignSelf: 'flex-start', borderRadius: 999 }}
      >
        Connect
      </a>
    </section>
  );
}

export function NowCard() {
  const now = jobs[0];
  return (
    <section className="widget glass now" aria-label="Now">
      <span className="now-tag">
        <i /> NOW
      </span>
      <b>
        {now.role} at {now.company.replace(' Pvt. Ltd.', '')}
      </b>
      <span className="muted">
        Shipping enterprise React Native apps since {now.start}. Release cycles 60% faster with
        Fastlane.
      </span>
      <div className="now-stats">
        <span>
          <b>5+</b>
          <small>years</small>
        </span>
        <span>
          <b>10k+</b>
          <small>users, one app</small>
        </span>
        <span>
          <b>{projects.length}</b>
          <small>apps shipped</small>
        </span>
      </div>
    </section>
  );
}

export function ClockCard() {
  const now = useNow(1000);
  const day = now.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  const date = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  });
  return (
    <section className="widget glass clock" aria-label="Delhi clock">
      <span>
        <span className="label">Delhi · IST</span>
        <span className="clock-time">{delhiTime(now)}</span>
      </span>
      <span className="muted clock-date">
        {day}
        <br />
        {date}
      </span>
    </section>
  );
}
