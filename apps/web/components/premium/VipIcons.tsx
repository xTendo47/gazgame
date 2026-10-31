// Значки экрана VIP — SVG (в макете там эмодзи). Золотое кольцо вокруг рисует CSS (.vip-perk-ico).

/** Острый перец: «Без тормозов». */
export function ChiliIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M17.2 6.4c2 1.700 2.400 4.800 1 8.200-1.700 4-5.600 6.600-9.700 7-1.400.2-2.100-.9-1.300-1.900 3-.7 5.500-2.700 6.800-5.600.8-2 .8-4 .2-5.700z" fill="#d6281c" />
      <path d="M13.400 9.500c.4 1.400.2 3-.5 4.400" stroke="#ff7a6a" strokeWidth="1.200" strokeLinecap="round" fill="none" />
      <path d="M15.800 5.400c.5-1.800 2-2.800 3.800-2.600-.2 1.800-1.500 3.200-3.300 3.500z" fill="#43a02f" />
    </svg>
  );
}

/** Магнит: «Совместимость пары». */
export function MagnetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4.500 3v9.200a7.500 7.500 0 0 0 15 0V3H15v9.200a3 3 0 0 1-6 0V3z" fill="#d6281c" />
      <path d="M4.500 3H9v4.500H4.500zM15 3h4.500v4.500H15z" fill="#dfe3e8" />
      <path d="M4.500 7.500H9M15 7.500h4.500" stroke="#8a919a" strokeWidth="0.8" />
    </svg>
  );
}

/** Пазл: «Пазл личности». */
export function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M9 3.500a2.200 2.200 0 0 1 4.400 0V5.500H17.500v4h2a2.200 2.200 0 0 1 0 4.400h-2V18H13.400v-2a2.200 2.200 0 0 0-4.400 0v2H4.800v-4.100h-2a2.200 2.200 0 0 1 0-4.400h2V5.500H9z" fill="#4cb534" stroke="#2f7f1f" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M6.500 7.500h2.500" stroke="#9be07e" strokeWidth="1.100" strokeLinecap="round" />
    </svg>
  );
}

/** Хлопушка: «Новые наборы раньше всех». */
export function ClapperIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="9.500" width="18" height="11.500" rx="1.500" fill="#2a2a2e" />
      <path d="M3 9.500 4.500 4.600l17 2.900-1.300 2z" fill="#ececef" />
      <path d="M6.200 4.800l2.500 4.400M10.900 5.600l2.500 4.300M15.600 6.400l2.500 4.200" stroke="#2a2a2e" strokeWidth="2.200" />
      <path d="M6.500 13.500h11" stroke="#8a8a92" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Золотая галочка справа в строке перечня. */
export function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden="true">
      <path d="M1.500 6.200 5.600 10.200 14.500 1.600" fill="none" stroke="#c9a14e" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Замочек для закрытых пунктов в шторке. */
export function LockGlyph() {
  return (
    <svg viewBox="0 0 14 16" width="12" height="14" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px" }}>
      <path d="M3.500 7V5a3.500 3.500 0 0 1 7 0v2" fill="none" stroke="currentColor" strokeWidth="1.600" />
      <rect x="1.500" y="7" width="11" height="8" rx="1.600" fill="currentColor" />
    </svg>
  );
}
