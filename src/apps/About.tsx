import { education, profile } from '../data/cv';
import { Avatar } from '../character/Avatar';
import { useOS } from '../os/store';

export function About() {
  const { open } = useOS();
  return (
    <div className="app pad about">
      <div className="about-head">
        <span className="about-photo">
          <Avatar />
        </span>
        <span>
          <h2 className="app-h">{profile.name}</h2>
          <span className="muted">
            {profile.role} · {profile.location}
          </span>
        </span>
      </div>
      <p>{profile.summary}</p>
      <p>
        I care about apps that open fast and never crash in front of a user. Most of my work sits
        where architecture meets release engineering: Clean Architecture and BLoC so big apps stay
        easy to change, and Fastlane and GitHub Actions pipelines so shipping is boring.
      </p>
      <dl className="facts">
        <div>
          <dt>Education</dt>
          <dd>
            {education[0].degree.replace(' (MCA)', '')}, {education[0].note}
          </dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>{profile.languages.join(', ')}</dd>
        </div>
        <div>
          <dt>Shipping since</dt>
          <dd>{profile.since}</dd>
        </div>
      </dl>
      <div className="row-actions">
        <button type="button" className="btn primary" onClick={() => open('projects')}>
          See my projects
        </button>
        <button type="button" className="btn" onClick={() => open('mail')}>
          Get in touch
        </button>
      </div>
    </div>
  );
}
