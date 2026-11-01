// Рисунки экрана «Тусовка» (SVG, без картинок): стол казино внизу — коктейли, фишки, деньги, кубики, карты;
// знаки мастей и бильярдный шар. Образец — _design/etalon/04_tusovka.png.
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

/** Нижняя часть стола: тёмное дерево с латунным кантом, на нём всё, что лежит (рулетку добавляет сам экран). */
export function CasinoTable() {
  return (
    <svg className="cs-table" viewBox="0 0 390 270" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="cs-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3a2414" />
          <stop offset="1" stopColor="#1a0e07" />
        </linearGradient>
        <linearGradient id="cs-brass" x1="0" x2="1">
          <stop offset="0" stopColor="#8a6420" />
          <stop offset=".35" stopColor="#f6e3a1" />
          <stop offset=".6" stopColor="#b8913f" />
          <stop offset="1" stopColor="#9c7426" />
        </linearGradient>
        <linearGradient id="cs-bill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a8d0a2" />
          <stop offset="1" stopColor="#6f9c69" />
        </linearGradient>
        <linearGradient id="cs-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#fff" stopOpacity=".35" />
        </linearGradient>
      </defs>
      {/* борт стола */}
      <path d="M0 62Q195 30 390 62V270H0z" fill="url(#cs-wood)" />
      <path d="M0 62Q195 30 390 62" fill="none" stroke="url(#cs-brass)" strokeWidth="5" />
      <path d="M0 70Q195 38 390 70" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="2" />

      {/* деньги */}
      <g transform="translate(96 78) rotate(-6)">
        <rect width="58" height="30" rx="2" fill="url(#cs-bill)" stroke="#2f5a2a" strokeWidth=".8" />
        <rect x="4" y="4" width="50" height="22" fill="none" stroke="#2f5a2a" strokeWidth=".6" />
        <circle cx="29" cy="15" r="7" fill="#b2d6ab" stroke="#2f5a2a" strokeWidth=".6" />
        <text x="29" y="18.5" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="9" fill="#24441f">
          100
        </text>
        <rect x="24" y="-2" width="10" height="34" fill="#efe2c4" opacity=".92" />
      </g>
      <g transform="translate(146 92) rotate(8)">
        <rect width="50" height="26" rx="2" fill="#86b37f" stroke="#2f5a2a" strokeWidth=".8" />
        <rect x="4" y="4" width="42" height="18" fill="none" stroke="#2f5a2a" strokeWidth=".6" />
        <text x="25" y="17" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="9" fill="#24441f">
          100
        </text>
      </g>

      {/* стопки фишек */}
      {[
        { x: 226, y: 150, c: "#a51f1a", n: 6 },
        { x: 178, y: 168, c: "#1f4f8a", n: 3 },
        { x: 270, y: 158, c: "#17120f", n: 4 },
        { x: 244, y: 120, c: "#c9a14e", n: 3 },
      ].map((st, k) => (
        <g key={k} transform={`translate(${st.x} ${st.y})`}>
          {Array.from({ length: st.n }, (_, i) => (
            <g key={i} transform={`translate(0 ${-i * 6})`}>
              <ellipse cx="0" cy="3" rx="17" ry="6.5" fill="#000" opacity=".35" />
              <ellipse cx="0" cy="0" rx="17" ry="6.5" fill={st.c} stroke="#000" strokeOpacity=".4" />
              <path d="M-17 0a17 6.5 0 0 0 34 0" fill="none" stroke="#f4ead6" strokeWidth="2.2" strokeDasharray="5 5" />
            </g>
          ))}
          <ellipse cx="0" cy={-(st.n - 1) * 6} rx="11" ry="4.2" fill="none" stroke="#f4ead6" strokeOpacity=".7" />
          <text x="0" y={-(st.n - 1) * 6 + 2} textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="5.5" fill="#f4ead6" opacity=".85">
            GAZ
          </text>
        </g>
      ))}

      {/* кубики */}
      <g transform="translate(112 176) rotate(14)">
        <rect width="22" height="22" rx="4" fill="#f6efdd" stroke="#bfb08a" />
        <circle cx="6" cy="6" r="2.2" fill="#222" />
        <circle cx="16" cy="6" r="2.2" fill="#222" />
        <circle cx="11" cy="11" r="2.2" fill="#222" />
        <circle cx="6" cy="16" r="2.2" fill="#222" />
        <circle cx="16" cy="16" r="2.2" fill="#222" />
      </g>
      <g transform="translate(144 188) rotate(-12)">
        <rect width="16" height="16" rx="3" fill="#b8271c" stroke="#5a0f0a" />
        <circle cx="5" cy="5" r="1.7" fill="#fff" />
        <circle cx="11" cy="11" r="1.7" fill="#fff" />
        <circle cx="11" cy="5" r="1.7" fill="#fff" />
        <circle cx="5" cy="11" r="1.7" fill="#fff" />
      </g>

      {/* коктейли */}
      {[
        { x: 22, y: 100, c1: "#e8453a", c2: "#c42a2a", fruit: "#f6a23a" },
        { x: 70, y: 126, c1: "#f6b03a", c2: "#e68a1a", fruit: "#f2dc4a" },
      ].map((g, k) => (
        <g key={k} transform={`translate(${g.x} ${g.y}) scale(1.28)`}>
          <ellipse cx="14" cy="102" rx="14" ry="3.5" fill="#000" opacity=".4" />
          <path d="M14 56v44M14 100h-9M14 100h9" stroke="#e8e0cc" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M-8 20h44l-18 34a4.2 4.2 0 0 1-8 0z" fill="url(#cs-glass)" stroke="#e8e0cc" strokeOpacity=".7" />
          <path d="M-5 24h38l-14 27.5a3 3 0 0 1-10 0z" fill={g.c1} />
          <path d="M-5 24h38l-4 8H-1z" fill={g.c2} />
          <circle cx="14" cy="22" r="10" fill={g.fruit} stroke="#a85a10" strokeWidth=".8" />
          <circle cx="14" cy="22" r="6" fill="none" stroke="#fff6d8" strokeOpacity=".7" />
          <path d="M26 6l-6 24" stroke="#b02020" strokeWidth="1.2" />
          <circle cx="26" cy="5" r="3.4" fill="#c31626" />
        </g>
      ))}

      {/* карты на углу стола */}
      <g transform="translate(2 224) rotate(-16)">
        <rect width="38" height="52" rx="3" fill="#f7f1e2" stroke="#bfb08a" />
        <text x="5" y="14" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="12" fill="#c8321c">
          Q
        </text>
        <path d="M19 28l7 9-7 9-7-9z" fill="#c8321c" />
      </g>
      <g transform="translate(46 238) rotate(8)">
        <rect width="36" height="50" rx="3" fill="#a51f1a" stroke="#f4ead6" strokeWidth="2.2" />
        <rect x="5" y="5" width="26" height="40" rx="2" fill="none" stroke="#f4ead6" strokeOpacity=".5" />
        <text x="18" y="30" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="9" fill="#f4ead6">
          GAZ
        </text>
      </g>
      <g transform="translate(88 236) rotate(-4)">
        <rect width="38" height="52" rx="3" fill="#f7f1e2" stroke="#bfb08a" />
        <text x="5" y="14" fontFamily="Playfair Display, serif" fontWeight="900" fontSize="11" fill="#17120f">
          5
        </text>
        <path d="M19 26c-3 3-6 4-6 7a3 3 0 0 0 5 2c0 2-1 3-2 5h6c-1-2-2-3-2-5a3 3 0 0 0 5-2c0-3-3-4-6-7z" fill="#17120f" />
      </g>

      <text x="200" y="262" textAnchor="middle" fontFamily="Playfair Display, serif" fontStyle="italic" fontWeight="900" fontSize="13" fill="#b8913f" opacity=".85">
        GAZ <tspan fontFamily="Marck Script, cursive" fontSize="9">game</tspan> CASINO
      </text>
    </svg>
  );
}

/** Бильярдный шар с номером. */
export function BilliardBall({ n, color, className }: { n: string; color: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`cs-b${n}`} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".25" stopColor={color} />
          <stop offset="1" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="22" r="17" fill="#000" opacity=".35" />
      <circle cx="20" cy="20" r="17" fill={color} />
      <circle cx="20" cy="20" r="17" fill={`url(#cs-b${n})`} />
      <circle cx="20" cy="20" r="7" fill="#fff" opacity=".95" />
      <text x="20" y="24" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="10" fill="#111">
        {n}
      </text>
    </svg>
  );
}
