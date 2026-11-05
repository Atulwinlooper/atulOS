import { useState } from 'react';
import { profile } from '../data/cv';
import { Icon } from '../os/icons';
import { useOS } from '../os/store';

export function Mail({ subject: initial = '' }: { subject?: string }) {
  const { toast } = useOS();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(initial || 'Hello Atul');
  const [body, setBody] = useState('');

  const href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `${body}\n\n${name ? `— ${name}` : ''}`,
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast('Copied', `${profile.email} is on your clipboard.`);
    } catch {
      toast('Copy failed', `Select the address instead: ${profile.email}`);
    }
  };

  return (
    <form
      className="app pad mail"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href;
      }}
    >
      <div className="mail-to">
        <span className="faint">To</span>
        {profile.email ? (
          <>
            <span className="chip">{profile.email}</span>
            <button type="button" className="btn" onClick={copy} aria-label="Copy email address">
              <Icon.copy size={14} /> Copy
            </button>
          </>
        ) : (
          // A fork without VITE_CONTACT_EMAIL in .env: point people to LinkedIn instead.
          <span className="chip">{profile.linkedinLabel}</span>
        )}
      </div>
      <label className="field">
        <span className="label">Your name</span>
        <input
          id="mail-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
          placeholder="Jane from Acme"
        />
      </label>
      <label className="field">
        <span className="label">Subject</span>
        <input
          id="mail-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={140}
          required
        />
      </label>
      <label className="field grow">
        <span className="label">Message</span>
        <textarea
          id="mail-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1500}
          placeholder="We're building a mobile app and need someone to own it from first commit to the store…"
          required
        />
      </label>
      <div className="row-actions">
        {profile.email && (
          <button type="submit" className="btn primary">
            Open in my email app <Icon.arrow size={14} />
          </button>
        )}
        <a className="btn" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
          Message on LinkedIn
        </a>
      </div>
      <small className="faint">Sending opens your own email app with this message filled in.</small>
    </form>
  );
}
