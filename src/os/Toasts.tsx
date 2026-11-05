import { Icon } from './icons';
import { useOS } from './store';

export function Toasts() {
  const { toasts, dismissToast, open } = useOS();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast glass${t.kind === 'secret' ? ' secret' : ''}`}>
          {t.kind === 'secret' && (
            <span className="toast-icon">
              <Icon.star size={20} />
            </span>
          )}
          <button
            type="button"
            className="toast-text"
            onClick={() => {
              dismissToast(t.id);
              if (t.kind === 'secret') open('secrets');
            }}
          >
            <b>{t.title}</b>
            <span className="muted">{t.text}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
