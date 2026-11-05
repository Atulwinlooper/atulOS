import { useOS, type Wallpaper } from '../os/store';

const WALLS: { id: Wallpaper; name: string; css: string }[] = [
  {
    id: 'ember',
    name: 'Ember',
    css: 'radial-gradient(60% 55% at 50% 40%, #2C201C, #161215 52%, #0B0A0C)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    css: 'radial-gradient(60% 55% at 50% 40%, #1A2333, #10141D 55%, #08090D)',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    css: 'radial-gradient(70% 60% at 50% 35%, #5A3326, #2A1A1D 55%, #120D10)',
  },
];

export function Settings() {
  const { wall, setWall, retro, setRetro, setPhase, resetSecrets, found, toast, theme, setTheme } =
    useOS();
  return (
    <div className="app pad settings">
      <section>
        <span className="label">Appearance</span>
        <fieldset className="walls">
          <legend className="sr-only">Appearance</legend>
          {(['dark', 'light'] as const).map((t) => (
            <label key={t} className={`wall-opt${theme === t ? ' on' : ''}`}>
              <input
                type="radio"
                name="theme"
                className="sr-only"
                checked={theme === t}
                onChange={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTheme(t, { x: r.left + r.width / 2, y: r.top });
                }}
              />
              <span className={`theme-swatch ${t}`} />
              {t === 'dark' ? 'Lights off' : 'Lights on'}
            </label>
          ))}
        </fieldset>
        <small className="muted">Or pull the cord on the bulb hanging over the desktop.</small>
      </section>
      <section>
        <span className="label">Wallpaper</span>
        <fieldset className="walls">
          <legend className="sr-only">Wallpaper</legend>
          {WALLS.map((w) => (
            <label key={w.id} className={`wall-opt${wall === w.id ? ' on' : ''}`}>
              <input
                type="radio"
                name="wallpaper"
                className="sr-only"
                value={w.id}
                checked={wall === w.id}
                onChange={() => setWall(w.id)}
              />
              <span style={{ background: w.css }} />
              {w.name}
            </label>
          ))}
        </fieldset>
      </section>
      <section className="set-row">
        <span>
          <b>Retro mode</b>
          <small className="muted">There is also a secret way to turn this on.</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={retro}
          className={`switch${retro ? ' on' : ''}`}
          onClick={() => setRetro(!retro)}
        >
          <i />
          <span className="sr-only">Retro mode</span>
        </button>
      </section>
      <section className="set-row">
        <span>
          <b>Secrets found</b>
          <small className="muted">{found.length} of 9. Resetting hides them again.</small>
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => {
            resetSecrets();
            toast('Secrets reset', 'Go find them again.');
          }}
        >
          Reset
        </button>
      </section>
      <section className="set-row">
        <span>
          <b>Restart AtulOS</b>
          <small className="muted">Plays the boot sequence again.</small>
        </span>
        <button type="button" className="btn" onClick={() => setPhase('boot')}>
          Restart
        </button>
      </section>
      <p className="faint about-os">
        AtulOS 5.0 · Built with React, TypeScript and Vite+ by Atul Bhadoriya.
      </p>
    </div>
  );
}
