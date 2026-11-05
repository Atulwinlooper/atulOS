type Box = { left: number; top: number; width: number; height: number };

/**
 * Keyframes for the genie effect: the window narrows into a funnel aimed at its
 * dock icon while it shrinks into it. Reverse the array to restore.
 */
export function genieFrames(win: Box, icon: Box): Keyframe[] {
  const dx = icon.left + icon.width / 2 - (win.left + win.width / 2);
  const dy = icon.top + icon.height / 2 - (win.top + win.height / 2);
  // Where the icon sits across the window, in %; clamped so the funnel never inverts.
  const tip = Math.min(
    133,
    Math.max(-33, ((icon.left + icon.width / 2 - win.left) / win.width) * 100),
  );
  const l = tip - 7;
  const r = tip + 7;
  const full = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
  const funnel = `polygon(0% 0%, 100% 0%, ${r}% 100%, ${l}% 100%)`;
  return [
    { transform: 'none', clipPath: full, opacity: 1 },
    {
      offset: 0.35,
      transform: `translate(${dx * 0.08}px, ${dy * 0.2}px) scale(1, 0.92)`,
      clipPath: funnel,
      opacity: 1,
    },
    {
      transform: `translate(${dx}px, ${dy}px) scale(${icon.width / win.width}, ${icon.height / win.height})`,
      clipPath: funnel,
      opacity: 0.2,
    },
  ];
}

/** Keyframes that zoom a window open out of its dock icon. */
export function zoomFromIcon(win: Box, icon: Box): Keyframe[] {
  const dx = icon.left + icon.width / 2 - (win.left + win.width / 2);
  const dy = icon.top + icon.height / 2 - (win.top + win.height / 2);
  return [
    {
      opacity: 0.3,
      transform: `translate(${dx}px, ${dy}px) scale(${icon.width / win.width}, ${icon.height / win.height})`,
    },
    { opacity: 1, transform: 'none' },
  ];
}

/** Keeps a dragged window reachable: at least 120px of its title bar stays on screen. */
export function clampWindow(x: number, y: number, w: number, vw: number, vh: number) {
  return {
    x: Math.min(vw - 120, Math.max(-w + 120, x)),
    y: Math.min(vh - 120, Math.max(30, y)),
  };
}
