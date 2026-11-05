import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Avatar } from '../character/Avatar';
import { profile } from '../data/cv';
import { prefersReducedMotion, rafLoop } from '../lib/dom';
import { useLatest } from '../lib/hooks';
import { useOS } from '../os/store';
import {
  angularSpeed,
  cardAngle,
  createCard,
  dragCard,
  grabCard,
  releaseCard,
  SPIN_SPEED,
  stepCard,
  strapPath,
} from './lanyard';
import './idcard.css';

const W = 270;
const H = 380;
/** Where the strap meets the card: the punched hole, near the top centre. */
const HOLE = 14;
const QR = new Set([
  0, 1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 18, 19, 22, 23, 25, 26, 27, 29, 30, 32, 34, 35,
]);

type Props = { anchorX: number; anchorY: number; length?: number };

/**
 * The staff ID card hangs from an elastic lanyard clipped to the menu bar.
 * Drag it, fling it, let go: the strap pulls it back and it swings to rest.
 * Click (or press Enter / Space) to flip it.
 */
export function IdCard({ anchorX, anchorY, length = 80 }: Props) {
  const { findSecret } = useOS();
  const layer = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLButtonElement>(null);
  const strap = useRef<SVGPathElement>(null);
  const [flipped, setFlipped] = useState(false);
  const sim = useRef<ReturnType<typeof createCard> | null>(null);
  sim.current ??= createCard(anchorX, anchorY, length, H - HOLE);
  const drag = useRef({ x: 0, y: 0, moved: 0, dragged: false, releasedAt: -1 });
  const anchor = useLatest({ x: anchorX, y: anchorY, length, findSecret });

  useEffect(() => {
    const c = sim.current;
    if (!c) return undefined;
    if (prefersReducedMotion()) {
      const { x, y, length: len } = anchor.current;
      c.a = { x, y: y + len };
      c.b = { x, y: y + len + c.rod };
      c.pa = { ...c.a };
      c.pb = { ...c.b };
    }
    return rafLoop((dt, now) => {
      const { x: ax, y: ay, length: len } = anchor.current;
      stepCard(c, ax, ay, len, dt, window.innerHeight - H - 20 + HOLE);
      // A hard throw that sets the card spinning finds the "swing" secret.
      const d = drag.current;
      if (d.releasedAt > 0 && now - d.releasedAt < 1200 && Math.abs(angularSpeed(c)) > SPIN_SPEED) {
        d.releasedAt = -1;
        anchor.current.findSecret('swing');
      }
      if (card.current) {
        card.current.style.transform = `translate(${(c.a.x - W / 2).toFixed(1)}px, ${(c.a.y - HOLE).toFixed(1)}px) rotate(${cardAngle(c).toFixed(2)}deg)`;
      }
      if (strap.current) strap.current.setAttribute('d', strapPath(c, ax, ay, len));
    });
  }, [anchor]);

  /** Pointer position in the card layer's coordinates (the same space as the clip). */
  const local = (e: PointerEvent) => {
    const r = layer.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    const c = sim.current;
    if (!c || e.button !== 0) return;
    const p = local(e);
    grabCard(c, p.x, p.y);
    drag.current = { x: p.x, y: p.y, moved: 0, dragged: false, releasedAt: -1 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const c = sim.current;
    if (!c?.grab) return;
    const p = local(e);
    const d = drag.current;
    d.moved += Math.hypot(p.x - d.x, p.y - d.y);
    d.x = p.x;
    d.y = p.y;
    const { x: ax, y: ay, length: len } = anchor.current;
    dragCard(c, p.x, p.y, ax, ay, len);
  };
  const onUp = () => {
    const c = sim.current;
    if (!c?.grab) return;
    const d = drag.current;
    d.dragged = d.moved > 6;
    const { x: ax, y: ay, length: len } = anchor.current;
    releaseCard(c, ax, ay, len);
    d.releasedAt = performance.now();
  };
  const onClick = () => {
    if (drag.current.dragged) {
      drag.current.dragged = false;
      return;
    }
    if (!flipped) findSecret('flip');
    setFlipped(!flipped);
  };

  return (
    <div ref={layer} className="idc-layer">
      <svg className="idc-strap" width="100%" height="100%" aria-hidden="true">
        <path
          ref={strap}
          d={`M${anchorX} ${anchorY}L${anchorX} ${anchorY + length}`}
          fill="none"
          stroke="#E0632A"
          strokeWidth="13"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="idc-clip"
        style={{ left: anchorX - 16, top: anchorY - 12 }}
        aria-hidden="true"
      />
      <button
        ref={card}
        type="button"
        className="idc"
        style={{ width: W, height: H }}
        aria-label={`${profile.name}'s staff ID card. Drag to swing it. Press to flip it.`}
        aria-pressed={flipped}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onClick={onClick}
      >
        <div className={`idc-inner${flipped ? ' flipped' : ''}`}>
          <div className="idc-face idc-front" aria-hidden={flipped}>
            <div className="idc-top">
              <span className="idc-hole" />
              <span>ATULOS · STAFF ID</span>
              <span className="mono">ATL-{profile.since}</span>
            </div>
            <div className="idc-body">
              <div className="idc-who">
                <span className="idc-photo">
                  <Avatar />
                </span>
                <span>
                  <b>{profile.name}</b>
                  <small>{profile.role}</small>
                </span>
              </div>
              <dl className="idc-fields">
                <div>
                  <dt>Base</dt>
                  <dd>{profile.location}</dd>
                </div>
                <div>
                  <dt>Shipping since</dt>
                  <dd>{profile.since}</dd>
                </div>
                <div>
                  <dt>Stack</dt>
                  <dd>Flutter · React Native</dd>
                </div>
                <div>
                  <dt>Clearance</dt>
                  <dd>Play · App Store</dd>
                </div>
              </dl>
              <span className="idc-barcode" />
              <small className="idc-hint">Drag me. Click to flip.</small>
            </div>
          </div>
          <div className="idc-face idc-back" aria-hidden={!flipped}>
            <span className="idc-hole" />
            <small className="idc-eyebrow">If found</small>
            <b className="idc-msg">Please return to a team that ships mobile apps.</b>
            <span className="idc-qr" aria-hidden="true">
              {Array.from({ length: 36 }, (_, i) => (
                <i key={i} style={{ background: QR.has(i) ? '#17120F' : 'transparent' }} />
              ))}
            </span>
            {profile.email && <span className="mono idc-mail">{profile.email}</span>}
            <span className="mono faint">{profile.linkedinLabel}</span>
          </div>
        </div>
      </button>
    </div>
  );
}
