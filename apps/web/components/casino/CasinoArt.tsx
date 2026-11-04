// Масти карт для экранов «Тусовки» (SVG, без картинок). Стол казино внизу — casino-table-art.ts.
// Масти рисуем сами: текстовые ♠♥ на iPhone превращаются в цветные эмодзи.

/** Масти: пики, червы, трефы, бубны. */
export function Suit({ kind, size = 12, color = "currentColor" }: { kind: "spade" | "heart" | "club" | "diamond"; size?: number; color?: string }) {
  const paths = {
    spade: "M6 .6C4 3.4 1 5 1 7.6 1 9.2 2.4 10 3.6 10c.9 0 1.6-.4 1.9-1-.1 1-.4 1.8-1.1 2.4h3.2C7.9 10.8 7.6 10 7.5 9c.3.6 1 1 1.9 1C10.6 10 12 9.2 12 7.6 12 5 9 3.4 6 .6z",
    heart: "M6 11.2C2.6 8.6 1 6.6 1 4.6 1 3 2.2 2 3.5 2 4.6 2 5.5 2.6 6 3.6 6.5 2.6 7.4 2 8.5 2 9.8 2 11 3 11 4.6c0 2-1.6 4-5 6.6z",
    club: "M6 .8a2.6 2.6 0 0 0-1.6 4.7 2.7 2.7 0 1 0 .8 4.8c0 .8-.3 1.5-.9 2.2h3.4c-.6-.7-.9-1.4-.9-2.2a2.7 2.7 0 1 0 .8-4.800A2.600 2.600 0 0 0 6 .8z",
    diamond: "M6 .6 10.8 6.2 6 11.8 1.2 6.2z",
  } as const;
  return (
    <svg viewBox="0 0 12 12.4" width={size} height={size} aria-hidden="true" style={{ display: "inline-block", flex: "none" }}>
      <path d={paths[kind]} fill={color} />
    </svg>
  );
}
