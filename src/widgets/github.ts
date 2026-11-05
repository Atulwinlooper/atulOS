/**
 * Parsers for the two public GitHub endpoints the desktop widget reads.
 * Responses are untrusted: every field is checked before it reaches the UI.
 */
export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type GH = { repos?: number; followers?: number; days?: Day[]; total?: number };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e7 ? v : undefined;
const isLevel = (v: unknown): v is Day['level'] =>
  v === 0 || v === 1 || v === 2 || v === 3 || v === 4;

export function parseUser(v: unknown): Pick<GH, 'repos' | 'followers'> {
  if (!isRecord(v)) return {};
  return { repos: count(v.public_repos), followers: count(v.followers) };
}

/** The last `weeks` weeks of contribution days, or an empty object if the shape is wrong. */
export function parseContributions(v: unknown, weeks = 20): Pick<GH, 'days' | 'total'> {
  if (!isRecord(v) || !Array.isArray(v.contributions)) return {};
  const days: Day[] = [];
  for (const d of v.contributions.slice(-weeks * 7)) {
    if (!isRecord(d) || typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) continue;
    const c = count(d.count);
    if (c === undefined || !isLevel(d.level)) continue;
    days.push({ date: d.date, count: c, level: d.level });
  }
  if (!days.length) return {};
  return { days, total: days.reduce((s, d) => s + d.count, 0) };
}

/** Only plain GitHub usernames are ever put into a request URL. */
export const isGitHubUser = (u: string) => /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(u);

async function getJSON(url: string, signal: AbortSignal): Promise<unknown> {
  const r = await fetch(url, {
    signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json() as Promise<unknown>;
}

export async function loadGitHub(user: string, signal: AbortSignal): Promise<GH> {
  if (!isGitHubUser(user)) return {};
  const [u, c] = await Promise.allSettled([
    getJSON(`https://api.github.com/users/${user}`, signal),
    getJSON(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`, signal),
  ]);
  return {
    ...(u.status === 'fulfilled' ? parseUser(u.value) : {}),
    ...(c.status === 'fulfilled' ? parseContributions(c.value) : {}),
  };
}
