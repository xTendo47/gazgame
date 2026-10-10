// Картинки для next/og (Satori): итог теста — сторис 1080×1920 и превью ссылки 1200×630,
// обложки 1200×630 для превью ссылки на тест и на главную.
// Satori понимает только flexbox и часть CSS: у каждого блока с несколькими детьми — display: flex.
import { OG_BODY, OG_DISPLAY } from "@/lib/og-fonts";
import type { ShareCard, ShareFormat } from "@/lib/share-card";

const BG = "#141217";
const CREAM = "#F3EEE6";
const MUTED = "rgba(243,238,230,0.62)";
const ORANGE = "#FF5A1F";
const LIME = "#D4FF3A";
const DISPLAY = OG_DISPLAY;
const BODY = OG_BODY;

/** Лёгкое зерно поверх фона: шум SVG (Resvg рисует feTurbulence). */
const GRAIN = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
)}`;

/** Размер названия по длине: длинное «Душа компании» не должно вылезать. */
function titleSize(title: string, base: number): number {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  if (longest <= 7) return base;
  if (longest <= 10) return Math.round(base * 0.82);
  return Math.round(base * 0.68);
}

function Logo({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: size, letterSpacing: -1, lineHeight: 1 }}>
      <span style={{ color: CREAM }}>GAZ</span>
      <span style={{ color: ORANGE }}>GAME</span>
    </div>
  );
}

/** Мягкое свечение цвета результата: градиент на весь фон, центр — за героем. */
function Glow({ color, width, height, x, y }: { color: string; width: number; height: number; x: string; y: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundImage: `radial-gradient(circle at ${x} ${y}, ${color}A0 0%, ${color}40 22%, ${color}00 46%)`,
      }}
    />
  );
}

/** Значок ✦ (в шрифтах его нет — рисуем). */
function Sparkle({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z" fill={color} />
    </svg>
  );
}

function Grain({ width, height }: { width: number; height: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- это разметка для Satori, а не страница
  return <img src={GRAIN} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0, opacity: 0.07 }} />;
}

export function ShareCardImage({ card, format }: { card: ShareCard; format: ShareFormat }) {
  return format === "story" ? <Story card={card} /> : <Preview card={card} />;
}

function Story({ card }: { card: ShareCard }) {
  const bars = card.bars ?? [];
  // С полосками места меньше — всё чуть компактнее, чтобы низ не налез на пунктики
  const dense = bars.length > 0;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: 1920,
        // ~250px сверху и снизу — там в сторис висят аватар и поле ответа
        padding: "250px 88px 250px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Glow color={card.color} width={1080} height={1920} x="50%" y={card.bars?.length ? "26%" : "30%"} />
      <Grain width={1080} height={1920} />

      {/* Шапка: логотип и название теста в плашке */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={34} />
        <div
          style={{
            display: "flex",
            padding: "10px 22px",
            borderRadius: 999,
            backgroundColor: "rgba(243,238,230,0.12)",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {card.testTitle}
        </div>
      </div>

      {/* Герой */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: dense ? 24 : 110, textAlign: "center" }}>
        <div style={{ display: "flex", fontSize: dense ? 170 : 260, lineHeight: 1 }}>{card.emoji}</div>
        <div
          style={{
            display: "flex",
            marginTop: dense ? 18 : 26,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: titleSize(card.title, dense ? 96 : 112),
            lineHeight: 1.05,
            letterSpacing: -2,
            justifyContent: "center",
          }}
        >
          {card.title}
        </div>
        {card.blendLine && (
          <div
            style={{
              display: "flex",
              marginTop: 22,
              padding: "10px 26px",
              borderRadius: 999,
              backgroundColor: "rgba(20,18,23,0.55)",
              border: `2px solid ${card.color}`,
              fontWeight: 800,
              fontSize: 34,
            }}
          >
            {card.blendLine}
          </div>
        )}
        {card.subtitle && (
          <div
            style={{
              display: "block",
              marginTop: 20,
              maxWidth: 900,
              fontWeight: 600,
              fontSize: 38,
              color: MUTED,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.subtitle}
          </div>
        )}
      </div>

      {/* Полоски по убыванию или шкалы */}
      {bars.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, gap: 12 }}>
          {bars.map((b) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", width: 48, fontSize: 38 }}>{b.emoji}</div>
              <div
                style={{
                  display: "flex",
                  width: 330,
                  fontWeight: b.main ? 800 : 600,
                  fontSize: 32,
                  color: b.main ? CREAM : MUTED,
                }}
              >
                {b.label}
              </div>
              <div style={{ display: "flex", flex: 1, height: 16, borderRadius: 8, backgroundColor: "rgba(243,238,230,0.12)" }}>
                <div
                  style={{
                    display: "flex",
                    width: `${Math.max(3, Math.round(b.fill * 100))}%`,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: b.main ? card.color : "rgba(243,238,230,0.55)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  width: 110,
                  justifyContent: "flex-end",
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: 32,
                  color: b.main ? CREAM : MUTED,
                }}
              >
                {b.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Три пунктика */}
      {card.points.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: dense ? 34 : 90, gap: dense ? 8 : 14 }}>
          {card.points.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 18, fontWeight: 800, fontSize: dense ? 32 : 36 }}>
              <Sparkle color={card.color} size={30} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      )}

      {/* Низ: зов пройти, ссылка, логотип */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingTop: 36, gap: 14 }}>
        <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: 42, lineHeight: 1.15 }}>
          А ты кто? Пройди за {card.durationMin} мин
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontWeight: 800, fontSize: 30, color: LIME }}>{card.shortLink}</div>
          <Logo size={30} />
        </div>
      </div>
    </div>
  );
}

/** Превью ссылки на итог (1200×630): герой слева, полоски справа, внизу «А ты кто? Пройди за N мин». */
function Preview({ card }: { card: ShareCard }) {
  const bars = (card.bars ?? []).slice(0, 6);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        padding: "44px 56px 40px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Glow color={card.color} width={1200} height={630} x="22%" y="40%" />
      <Grain width={1200} height={630} />
      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        {/* герой */}
        <div style={{ display: "flex", flexDirection: "column", width: bars.length ? 500 : 1088, alignItems: "flex-start", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              padding: "6px 16px",
              borderRadius: 999,
              backgroundColor: "rgba(243,238,230,0.12)",
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {card.testTitle}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 120, lineHeight: 1 }}>{card.emoji}</div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: titleSize(card.title, 66),
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            {card.title}
          </div>
          {card.blendLine && (
            <div style={{ display: "flex", marginTop: 10, fontWeight: 800, fontSize: 26, color: card.color }}>{card.blendLine}</div>
          )}
          {card.subtitle && (
            <div style={{ display: "flex", marginTop: 8, fontWeight: 600, fontSize: 26, color: MUTED }}>{card.subtitle}</div>
          )}
        </div>
        {/* полоски */}
        {bars.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 14 }}>
            {bars.map((b) => (
              <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", fontSize: 26 }}>{b.emoji}</div>
                  <div style={{ display: "flex", flex: 1, fontWeight: b.main ? 800 : 600, fontSize: 24, color: b.main ? CREAM : MUTED }}>
                    {b.label}
                  </div>
                  <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, color: b.main ? CREAM : MUTED }}>
                    {b.value}
                  </div>
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: "rgba(243,238,230,0.12)" }}>
                  <div
                    style={{
                      display: "flex",
                      width: `${Math.max(3, Math.round(b.fill * 100))}%`,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: b.main ? card.color : "rgba(243,238,230,0.55)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* низ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
        <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: 30 }}>
          А ты кто? Пройди за {card.durationMin} мин
        </div>
        <Logo size={26} />
      </div>
    </div>
  );
}

/** Обложка теста для превью ссылки (1200×630): эмодзи, название, «12 ситуаций · 4 мин · бесплатно», крючок. */
export function TestCover({
  emoji,
  title,
  meta,
  hook,
  color,
}: {
  emoji: string;
  title: string;
  /** «12 ситуаций · 4 мин · бесплатно». */
  meta: string;
  /** description теста. */
  hook: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: 1200,
        height: 630,
        padding: "56px 64px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Glow color={color} width={1200} height={630} x="18%" y="50%" />
      <Grain width={1200} height={630} />
      <div style={{ display: "flex", width: 330, alignItems: "center", justifyContent: "center", fontSize: 220, lineHeight: 1 }}>{emoji}</div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 40, justifyContent: "center" }}>
        <Logo size={28} />
        <div style={{ display: "flex", marginTop: 26, fontFamily: DISPLAY, fontWeight: 900, fontSize: titleSize(title, 76), lineHeight: 1.05 }}>
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 18, fontWeight: 800, fontSize: 28, color: LIME }}>{meta}</div>
        <div style={{ display: "flex", marginTop: 18, fontWeight: 600, fontSize: 30, lineHeight: 1.3, color: MUTED }}>{hook}</div>
      </div>
    </div>
  );
}

/** Обложка главной (1200×630): логотип, «Не сиди. Не тупи. Газ!» и эмодзи разделов. */
export function HomeCover({ emojis }: { emojis: string[] }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 1200,
        height: 630,
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Glow color={ORANGE} width={1200} height={630} x="50%" y="38%" />
      <Grain width={1200} height={630} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 132, lineHeight: 0.92, letterSpacing: -4 }}>
        <span style={{ color: CREAM }}>GAZ</span>
        <span style={{ color: ORANGE }}>GAME</span>
      </div>
      <div style={{ display: "flex", marginTop: 34, fontWeight: 800, fontSize: 40 }}>
        Не сиди. Не тупи.&nbsp;<span style={{ color: LIME }}>Газ!</span>
      </div>
      <div style={{ display: "flex", marginTop: 34, gap: 40, fontSize: 84 }}>
        {emojis.map((e) => (
          <span key={e}>{e}</span>
        ))}
      </div>
    </div>
  );
}
