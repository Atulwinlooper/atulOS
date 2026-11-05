/** Small square portrait used on the ID card, lock screen and About app. */
export function Avatar() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 76 76" aria-hidden="true">
      <rect width="76" height="76" fill="#2B2026" />
      <circle cx="38" cy="46" r="22" fill="#DDA07C" />
      <path
        d="M16 42Q14 18 38 16Q62 16 60 40Q56 30 46 28Q40 34 28 32Q22 34 16 42Z"
        fill="#1C1614"
      />
      <circle cx="31" cy="47" r="3" fill="#1C1614" />
      <circle cx="45" cy="47" r="3" fill="#1C1614" />
      <path
        d="M32 57Q38 61 44 57"
        stroke="#7A3B2A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M8 76Q12 66 38 66Q64 66 68 76Z" fill="#34323A" />
    </svg>
  );
}
