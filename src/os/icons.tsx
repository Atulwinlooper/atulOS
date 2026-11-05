import type { ReactNode, SVGProps } from 'react';
import type { AppId } from './store';

type P = SVGProps<SVGSVGElement> & { size?: number | string };
const S = ({ size = 24, children, ...p }: P & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);

export const Icon = {
  folder: (p: P) => (
    <S {...p}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </S>
  ),
  briefcase: (p: P) => (
    <S {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" />
    </S>
  ),
  bolt: (p: P) => (
    <S {...p} fill="currentColor" stroke="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </S>
  ),
  doc: (p: P) => (
    <S {...p}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 11h7M9 15h7M9 7h3" />
    </S>
  ),
  note: (p: P) => (
    <S {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </S>
  ),
  mail: (p: P) => (
    <S {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </S>
  ),
  gamepad: (p: P) => (
    <S {...p}>
      <rect x="2" y="7" width="20" height="11" rx="5" />
      <path d="M7 11v3M5.5 12.5h3" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" />
      <circle cx="18" cy="13.5" r="1" fill="currentColor" />
    </S>
  ),
  gear: (p: P) => (
    <S {...p}>
      {/* An eight-tooth gear with a hub, so it reads as Settings, not a sun or a bulb. */}
      <path
        d="M19.96 10.02L22.38 10.44L22.38 13.56L19.96 13.98L19.03 16.23L20.45 18.24L18.24 20.45L16.23 19.03L13.98 19.96L13.56 22.38L10.44 22.38L10.02 19.96L7.77 19.03L5.76 20.45L3.55 18.24L4.97 16.23L4.04 13.98L1.62 13.56L1.62 10.44L4.04 10.02L4.97 7.77L3.55 5.76L5.76 3.55L7.77 4.97L10.02 4.04L10.44 1.62L13.56 1.62L13.98 4.04L16.23 4.97L18.24 3.55L20.45 5.76L19.03 7.77Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.4" />
    </S>
  ),
  bin: (p: P) => (
    <S {...p}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </S>
  ),
  key: (p: P) => (
    <S {...p}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 7l3 3" />
    </S>
  ),
  branch: (p: P) => (
    <S {...p}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M6 8.5v7M18 10.5c0 4-6 3-11 5.5" />
    </S>
  ),
  person: (p: P) => (
    <S {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </S>
  ),
  wifi: (p: P) => (
    <S {...p}>
      <path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </S>
  ),
  search: (p: P) => (
    <S {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </S>
  ),
  arrow: (p: P) => (
    <S {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </S>
  ),
  back: (p: P) => (
    <S {...p}>
      <path d="M15 5l-7 7 7 7" />
    </S>
  ),
  copy: (p: P) => (
    <S {...p}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
    </S>
  ),
  star: (p: P) => (
    <S {...p} fill="currentColor" stroke="none">
      <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />
    </S>
  ),
  external: (p: P) => (
    <S {...p}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </S>
  ),
};

type TileStyle = { bg: string; fg: string; glyph: ReactNode; border?: string };

export const TILES: Record<AppId | 'desk' | 'bin', TileStyle> = {
  desk: {
    bg: 'linear-gradient(160deg,#F1E4D3,#CDB9A2)',
    fg: '#C9572A',
    glyph: (
      <span className="deva" style={{ fontSize: '0.52em', lineHeight: 1 }}>
        अ
      </span>
    ),
  },
  projects: {
    bg: 'linear-gradient(160deg,#FF9A63,#E0551F)',
    fg: '#FFF4EC',
    glyph: <Icon.folder size="52%" />,
  },
  experience: {
    bg: 'linear-gradient(160deg,#4A505C,#2B2F37)',
    fg: '#E8D5BF',
    glyph: <Icon.briefcase size="50%" />,
  },
  skills: {
    bg: 'linear-gradient(160deg,#A7D3E0,#6FA6B8)',
    fg: '#0F1A1E',
    glyph: <Icon.bolt size="48%" />,
  },
  terminal: {
    bg: 'linear-gradient(160deg,#24222A,#0B0A0D)',
    fg: '#FF7A3D',
    border: '1px solid rgba(255,255,255,.12)',
    glyph: (
      <span className="mono" style={{ fontSize: '0.32em', fontWeight: 600 }}>
        &gt;_
      </span>
    ),
  },
  resume: {
    bg: 'linear-gradient(160deg,#FFFFFF,#E4DED7)',
    fg: '#2B2F37',
    glyph: <Icon.doc size="48%" />,
  },
  about: {
    bg: 'linear-gradient(160deg,#F6D38C,#E3A93E)',
    fg: '#3A2508',
    glyph: <Icon.note size="48%" />,
  },
  mail: {
    bg: 'linear-gradient(160deg,#8FC1D1,#4F8DA3)',
    fg: '#FFFFFF',
    glyph: <Icon.mail size="48%" />,
  },
  arcade: {
    bg: 'linear-gradient(160deg,#3B2A5E,#1B1430)',
    fg: '#F6D38C',
    glyph: <Icon.gamepad size="56%" />,
  },
  settings: {
    bg: 'linear-gradient(160deg,#6A6E78,#3B3E46)',
    fg: '#E9E6E2',
    glyph: <Icon.gear size="48%" />,
  },
  secrets: {
    bg: 'linear-gradient(160deg,#F6D38C,#C9572A)',
    fg: '#2E1E06',
    glyph: <Icon.key size="48%" />,
  },
  vault: {
    bg: 'linear-gradient(160deg,#4A4350,#1F1B22)',
    fg: '#FF7A3D',
    glyph: <Icon.key size="48%" />,
  },
  bin: {
    bg: 'var(--tint-3)',
    fg: 'var(--fg)',
    border: '1px solid var(--line-2)',
    glyph: <Icon.bin size="48%" />,
  },
};

export function AppTile({
  id,
  size = 54,
  radius,
}: {
  id: AppId | 'desk' | 'bin';
  size?: number;
  radius?: number;
}) {
  const t = TILES[id];
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.26),
        background: t.bg,
        color: t.fg,
        border: t.border,
        fontSize: size,
        boxShadow: '0 6px 14px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25)',
        flex: 'none',
      }}
    >
      {t.glyph}
    </span>
  );
}
