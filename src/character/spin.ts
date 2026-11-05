/**
 * Detects the pointer circling a point quickly (the "dizzy" easter egg).
 * Feed it pointer positions; it returns true once the pointer has swept
 * more than `turns` full circles around the centre within `windowMs`.
 */
export function createSpinDetector({ turns = 1.5, windowMs = 1600, minR = 40, maxR = 460 } = {}) {
  let last: number | null = null;
  let samples: { t: number; d: number }[] = [];

  return function feed(x: number, y: number, cx: number, cy: number, t: number): boolean {
    const r = Math.hypot(x - cx, y - cy);
    const a = Math.atan2(y - cy, x - cx);
    if (r > maxR) {
      last = null;
      return false;
    }
    if (last !== null && r > minR) {
      let d = a - last;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      samples.push({ t, d });
      samples = samples.filter((s) => t - s.t < windowMs);
      const total = samples.reduce((sum, s) => sum + s.d, 0);
      if (Math.abs(total) > turns * Math.PI * 2) {
        samples = [];
        last = a;
        return true;
      }
    }
    last = a;
    return false;
  };
}
