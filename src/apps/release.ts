/** Helpers for the Experience app's release-history view. Pure, so they are tested. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Aug 2025" → months since year 0; "Present" → `now`. */
export function monthIndex(label: string, now: Date) {
  if (/present/i.test(label)) return now.getFullYear() * 12 + now.getMonth();
  const [m, y] = label.split(' ');
  const mi = MONTHS.indexOf(m.slice(0, 3));
  return Number(y) * 12 + Math.max(0, mi);
}

/** Whole months between two labels, counting both ends. */
export const monthsBetween = (start: string, end: string, now: Date) =>
  Math.max(1, monthIndex(end, now) - monthIndex(start, now) + 1);

/** 27 → "2 yrs 3 mos". */
export function duration(months: number) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
  return parts.join(' ') || '1 mo';
}

export type NoteKind = 'new' | 'improved' | 'fixed';

/** Sorts a CV line into a patch-note section by what it describes. */
export function classify(line: string): NoteKind {
  if (/secur|vulnerab|stabil|crash|bug|quality|review/i.test(line)) return 'fixed';
  if (/cut|faster|improv|reduc|optimi|\d+%/i.test(line)) return 'improved';
  return 'new';
}

/** Splits text so numbers like "30%", "20" or "10,000+" can be highlighted. */
export type Part = { text: string; metric: boolean; at: number };
export function metricParts(text: string): Part[] {
  const parts: Part[] = [];
  const re =
    /\d[\d,]*(?:\.\d+)?\s?%|\b\d[\d,]*\+?(?=\s(?:production|features|enterprise|users|agencies|customers))/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: text.slice(last, i), metric: false, at: last });
    parts.push({ text: m[0], metric: true, at: i });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), metric: false, at: last });
  return parts;
}

/** What changed in the toolbox from one version to the next. */
export function diffTools(before: string[], after: string[]) {
  return {
    added: after.filter((t) => !before.includes(t)),
    removed: before.filter((t) => !after.includes(t)),
    kept: after.filter((t) => before.includes(t)),
  };
}

/**
 * Lanes for a timeline, so overlapping roles sit on separate rows. Spans are in month indices,
 * in time order; a role that starts in the month another ends does not count as overlapping.
 */
export function lanes(spans: { start: number; end: number }[]) {
  const ends: number[] = [];
  return spans.map((s) => {
    let lane = ends.findIndex((e) => e <= s.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = s.end;
    return lane;
  });
}
