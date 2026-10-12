// Картинки для next/og (Satori): итог теста — карточка 4:5 (1080×1350) и превью ссылки 1200×630,
// обложки 1200×630 для превью ссылки на тест и на главную.
// У каждого теста свой «костюм» среднего блока (share.style): банка газировки, батарейки, чек,
// карточка героя, «Об устройстве», карточка игрока, профиль в мессенджере. Фон общий: пятна цвета, зерно, огромный эмодзи и своя текстура.
// Satori понимает только flexbox и часть CSS: у каждого блока с несколькими детьми — display: flex.
import type { ReactNode } from "react";
import { OG_BODY, OG_DISPLAY } from "@/lib/og-fonts";
import type { CardBar, CardStyle, ShareCard, ShareFormat } from "@/lib/share-card";

const BG = "#141217";
const CREAM = "#F3EEE6";
const MUTED = "rgba(243,238,230,0.66)";
const ORANGE = "#FF5A1F";
const LIME = "#D4FF3A";
const PANEL = "rgba(20,18,23,0.8)";
/** Зелёная точка «в сети». */
const ONLINE = "#3DDC84";
const DISPLAY = OG_DISPLAY;
const BODY = OG_BODY;
/** Тень под текстом, который лежит прямо на фоне (заголовок): читается на любом пятне. */
const TEXT_SHADOW = "0 2px 22px rgba(20,18,23,0.75)";

// ---------- Фон ----------

const svgUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Предсказуемый «случайный» генератор: одна и та же текстура при каждой отрисовке. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

/** Лёгкое зерно поверх фона: шум SVG (Resvg рисует feTurbulence). */
function grain(w: number, h: number) {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );
}

/** Текстура костюма поверх пятен — тонкая, чтобы не мешать тексту. */
function texture(style: CardStyle, w: number, h: number, color: string): string | null {
  const r = rng(w * 7 + h);
  const svg = (body: string) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
  switch (style) {
    case "composition": {
      // пузырьки газировки: снизу их больше, поднимаются вверх
      let c = "";
      for (let i = 0; i < 46; i++) {
        const y = h * (0.25 + 0.75 * Math.pow(r(), 0.55));
        const rad = 5 + r() * 26 * (y / h);
        c += `<circle cx="${(r() * w).toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>`;
      }
      return svg(c);
    }
    case "batteries": {
      // мягкие волны заряда
      let c = "";
      for (let k = 0; k < 7; k++) {
        const y0 = h * (0.45 + k * 0.08);
        let d = `M0 ${y0.toFixed(0)}`;
        for (let x = 0; x <= w; x += 30) d += ` L${x} ${(y0 + Math.sin(x / 90 + k) * 16).toFixed(1)}`;
        c += `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${(0.28 - k * 0.03).toFixed(2)}" stroke-width="3"/>`;
      }
      return svg(c);
    }
    case "receipt": {
      // конфетти из сердечек вокруг чека
      let c = "";
      const colors = [color, ORANGE, "#FF4D8D", LIME];
      for (let i = 0; i < 34; i++) {
        const s = 0.6 + r() * 0.9;
        c += `<path transform="translate(${(r() * w).toFixed(0)} ${(r() * h).toFixed(0)}) rotate(${(r() * 70 - 35).toFixed(0)}) scale(${s.toFixed(2)})" d="M0 6 C-6 -2 -16 4 0 16 C16 4 6 -2 0 6 Z" fill="${colors[i % colors.length]}" fill-opacity="0.55"/>`;
      }
      return svg(c);
    }
    case "hero": {
      // комиксные лучи из центра и полутоновые точки в углу
      const cx = w / 2;
      const cy = h * 0.3;
      let c = "";
      for (let i = 0; i < 24; i += 2) {
        const a1 = (i / 24) * Math.PI * 2;
        const a2 = ((i + 1) / 24) * Math.PI * 2;
        const R = Math.max(w, h) * 1.5;
        c += `<polygon points="${cx},${cy} ${(cx + R * Math.cos(a1)).toFixed(0)},${(cy + R * Math.sin(a1)).toFixed(0)} ${(cx + R * Math.cos(a2)).toFixed(0)},${(cy + R * Math.sin(a2)).toFixed(0)}" fill="rgba(255,255,255,0.045)"/>`;
      }
      for (let x = 0; x < w * 0.45; x += 22) {
        for (let y = h * 0.6; y < h; y += 22) {
          const dist = Math.hypot(w * 0.45 - x, y - h * 0.6) / (w * 0.5);
          c += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + dist * 5).toFixed(1)}" fill="${color}" fill-opacity="0.32"/>`;
        }
      }
      return svg(c);
    }
    case "device": {
      // тонкая пиксельная сетка, как экран
      return svg(
        `<defs><pattern id="g" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/>`,
      );
    }
    case "player": {
      // лучи прожекторов стадиона и диагональные полосы
      return svg(
        `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><pattern id="s" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="18" height="46" fill="rgba(255,255,255,0.035)"/></pattern></defs><rect width="100%" height="100%" fill="url(#s)"/><polygon points="${w * 0.04},0 ${w * 0.16},0 ${w * 0.62},${h} ${w * 0.18},${h}" fill="url(#b)"/><polygon points="${w * 0.84},0 ${w * 0.96},0 ${w * 0.82},${h} ${w * 0.38},${h}" fill="url(#b)"/>`,
      );
    }
    case "messenger": {
      // пузырьки сообщений, разбросанные по фону
      let c = "";
      for (let i = 0; i < 18; i++) {
        const bw = 90 + r() * 150;
        const bh = 44 + r() * 26;
        const x = r() * (w - bw);
        const y = r() * (h - bh);
        const left = r() > 0.5;
        c += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" rx="${(bh / 2).toFixed(0)}" fill="${left ? "rgba(255,255,255,0.035)" : color}" fill-opacity="${left ? 1 : 0.07}" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`;
      }
      return svg(c);
    }
    default:
      return null;
  }
}

function Layer({ src, w, h, opacity = 1 }: { src: string; w: number; h: number; opacity?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- это разметка для Satori, а не страница
  return <img src={src} width={w} height={h} alt="" style={{ position: "absolute", top: 0, left: 0, opacity }} />;
}

/** Большое мягкое пятно цвета. */
function Blob({ color, w, h, x, y, size, alpha = "88" }: { color: string; w: number; h: number; x: string; y: string; size: number; alpha?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: w,
        height: h,
        backgroundImage: `radial-gradient(circle ${size}px at ${x} ${y}, ${color}${alpha} 0%, ${color}33 45%, ${color}00 100%)`,
      }}
    />
  );
}

/** Общая основа: #141217, 2–3 пятна (цвет результата + оранжевый или салатовый), огромный эмодзи, текстура, зерно. */
function Backdrop({ card, w, h, emojiSize }: { card: ShareCard; w: number; h: number; emojiSize: number }) {
  // Satori не понимает right/bottom у абсолютных блоков — считаем left/top так, чтобы эмодзи срезался правым нижним углом
  const emojiLeft = Math.round(w - emojiSize * 0.74);
  const emojiTop = Math.round(h - emojiSize * 0.8);
  const accent = card.color.toUpperCase() === ORANGE ? LIME : ORANGE;
  const tex = texture(card.style, w, h, card.color);
  return (
    <>
      <Blob color={card.color} w={w} h={h} x="50%" y="18%" size={Math.round(w * 0.62)} alpha="7A" />
      <Blob color={accent} w={w} h={h} x="92%" y="88%" size={Math.round(w * 0.42)} alpha="55" />
      <Blob color={card.color} w={w} h={h} x="4%" y="62%" size={Math.round(w * 0.3)} alpha="44" />
      {/* огромный полупрозрачный эмодзи, срезанный краем карточки */}
      <div
        style={{
          position: "absolute",
          left: emojiLeft,
          top: emojiTop,
          display: "flex",
          fontSize: emojiSize,
          lineHeight: 1,
          opacity: 0.08,
          transform: "rotate(-12deg)",
        }}
      >
        {card.emoji}
      </div>
      {tex && <Layer src={tex} w={w} h={h} />}
      <Layer src={grain(w, h)} w={w} h={h} opacity={0.07} />
    </>
  );
}

// ---------- Общие кусочки ----------

/** Размер названия по длине: длинное «Душа компании» не должно вылезать. */
function titleSize(title: string, base: number): number {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  if (longest <= 7) return base;
  if (longest <= 10) return Math.round(base * 0.84);
  return Math.round(base * 0.72);
}

function Logo({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: size, letterSpacing: -1, lineHeight: 1 }}>
      <span style={{ color: CREAM }}>GAZ</span>
      <span style={{ color: ORANGE }}>GAME</span>
    </div>
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

/** Галочка ✓ (тоже рисуем). */
function Check({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 12.5 L9.5 19 L21 5.5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Множитель размеров: превью ссылки меньше карточки. */
type Scale = (n: number) => number;

function Panel({ children, s, border, background = PANEL }: { children: ReactNode; s: Scale; border?: string; background?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: s(16),
        padding: `${s(28)}px ${s(32)}px`,
        borderRadius: s(30),
        backgroundColor: background,
        border: border ?? "2px solid rgba(243,238,230,0.1)",
      }}
    >
      {children}
    </div>
  );
}

function Caption({ children, s, color = MUTED }: { children: ReactNode; s: Scale; color?: string }) {
  return (
    <div style={{ display: "flex", fontWeight: 800, fontSize: s(22), letterSpacing: 3, textTransform: "uppercase", color }}>{children}</div>
  );
}

function Text({ children, s, size = 30, weight = 800, color = CREAM }: { children: ReactNode; s: Scale; size?: number; weight?: 600 | 800; color?: string }) {
  return <div style={{ display: "flex", fontWeight: weight, fontSize: s(size), lineHeight: 1.25, color }}>{children}</div>;
}

/** Две строки с полосками и процентами (или три шкалы у самооценки). */
function Bars({ bars, s, color }: { bars: CardBar[]; s: Scale; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: s(14) }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
          <div style={{ display: "flex", alignItems: "center", gap: s(12) }}>
            <div style={{ display: "flex", fontSize: s(30) }}>{b.emoji}</div>
            <div style={{ display: "flex", flex: 1, fontWeight: 800, fontSize: s(30), color: b.main ? CREAM : MUTED }}>{b.label}</div>
            <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(30), color: b.main ? CREAM : MUTED }}>{b.value}</div>
          </div>
          <div style={{ display: "flex", height: s(14), borderRadius: s(7), backgroundColor: "rgba(243,238,230,0.12)" }}>
            <div
              style={{
                display: "flex",
                width: `${Math.max(3, Math.round(b.fill * 100))}%`,
                height: s(14),
                borderRadius: s(7),
                backgroundColor: b.main ? color : "rgba(243,238,230,0.55)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Костюмы среднего блока ----------

function Costume({ card, s }: { card: ShareCard; s: Scale }) {
  const bars = card.bars;
  switch (card.style) {
    case "composition":
      // состав на банке газировки
      return (
        <Panel s={s} border={`3px solid ${card.color}`}>
          <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(36), letterSpacing: 1 }}>СОСТАВ ХАРАКТЕРА</div>
          {bars ? <Bars bars={bars} s={s} color={card.color} /> : card.ingredients && <Text s={s} weight={600} size={30}>{`Состав: ${card.ingredients}`}</Text>}
          {card.line && <Text s={s}>{`⚠️ ${card.line}`}</Text>}
          <Caption s={s}>Изготовлено в GAZ</Caption>
        </Panel>
      );
    case "batteries":
      return (
        <Panel s={s}>
          {card.support && (
            <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(40), lineHeight: 1.15 }}>{card.support}</div>
          )}
          {card.growth && (
            <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(34), lineHeight: 1.15, color: MUTED }}>{card.growth}</div>
          )}
          {card.line && <Text s={s} color={card.color}>{card.line}</Text>}
          {bars && (
            <div style={{ display: "flex", flexDirection: "column", gap: s(14) }}>
              {bars.map((b) => (
                <Battery key={b.label} bar={b} s={s} />
              ))}
            </div>
          )}
        </Panel>
      );
    case "receipt":
      return <Receipt card={card} s={s} />;
    case "hero":
      // коллекционная карточка с рамкой цвета результата
      return (
        <Panel s={s} border={`${s(8)}px solid ${card.color}`}>
          {bars && <Caption s={s} color={card.color}>Расклад сил</Caption>}
          {bars && <Bars bars={bars} s={s} color={card.color} />}
          {card.line && <Text s={s}>{card.line}</Text>}
          {card.hint && <Text s={s} weight={600} color={MUTED}>{card.hint}</Text>}
        </Panel>
      );
    case "device":
      // экран «Об устройстве» в настройках телефона
      return (
        <Panel s={s} background="rgba(28,26,32,0.92)">
          <Caption s={s}>‹ Настройки · Об устройстве</Caption>
          <Row s={s} label="Модель" value={`${card.title} ${card.emoji}`} />
          {bars && <Caption s={s} color={card.color}>Загрузка процессора</Caption>}
          {bars && <Bars bars={bars} s={s} color={card.color} />}
          {card.line && <Text s={s}>{card.line}</Text>}
          {card.hint && <Text s={s} weight={600} color={MUTED}>{card.hint}</Text>}
        </Panel>
      );
    case "player":
      // карточка игрока из футбольного симулятора
      return (
        <Panel s={s} border={`3px solid ${card.color}`}>
          <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(36) }}>{`Позиция: ${card.title} ${card.emoji}`}</div>
          {bars && <Caption s={s}>Состав тебя</Caption>}
          {bars && <Bars bars={bars} s={s} color={card.color} />}
          {card.line && <Text s={s}>{card.line}</Text>}
          {card.duo && <Text s={s} weight={600}>{`Идеальный дуэт: ${card.duo}`}</Text>}
          {card.danger && <Text s={s} weight={600}>{`Опасно тусить с: ${card.danger}`}</Text>}
          {card.duo && (
            <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(34), lineHeight: 1.15, color: LIME }}>
              {`Отметь, кто у вас ${card.duo} 👇`}
            </div>
          )}
        </Panel>
      );
    case "messenger":
      // профиль контакта: закреплённые сообщения пузырями, как в чате
      return (
        <Panel s={s} background="rgba(24,22,28,0.9)">
          <Caption s={s}>📌 Закреплённые</Caption>
          <div style={{ display: "flex", flexDirection: "column", gap: s(12) }}>
            {(card.pinned ?? []).map((text) => (
              <Bubble key={text} text={text} color={card.color} s={s} />
            ))}
          </div>
          {bars && <Bars bars={bars} s={s} color={card.color} />}
        </Panel>
      );
    default:
      return bars ? (
        <Panel s={s}>
          <Bars bars={bars} s={s} color={card.color} />
        </Panel>
      ) : null;
  }
}

/** Пузырь сообщения: входящий, хвостик слева внизу. */
function Bubble({ text, color, s }: { text: string; color: string; s: Scale }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        maxWidth: "92%",
        padding: `${s(14)}px ${s(22)}px`,
        borderRadius: `${s(26)}px ${s(26)}px ${s(26)}px ${s(8)}px`,
        backgroundColor: `${color}2B`,
        border: `2px solid ${color}66`,
        fontWeight: 800,
        fontSize: s(28),
        lineHeight: 1.25,
      }}
    >
      {text}
    </div>
  );
}

/** Круглый аватар контакта: эмодзи результата и свечение его цвета. */
function Avatar({ card, size }: { card: ShareCard; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        backgroundImage: `radial-gradient(circle at 35% 30%, ${card.color}66, rgba(20,18,23,0.92) 75%)`,
        border: `${Math.round(size * 0.03)}px solid ${card.color}`,
        boxShadow: `0 0 ${Math.round(size * 0.35)}px ${card.color}AA`,
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
      }}
    >
      {card.emoji}
    </div>
  );
}

/** Строка статуса с зелёной точкой «в сети»: «Режим: 100 уведомлений». */
function StatusLine({ text, size }: { text: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(size * 0.45),
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * 0.8)}px`,
        borderRadius: 999,
        backgroundColor: "rgba(20,18,23,0.75)",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.2,
      }}
    >
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          width: Math.round(size * 0.5),
          height: Math.round(size * 0.5),
          borderRadius: size,
          backgroundColor: ONLINE,
          boxShadow: `0 0 ${Math.round(size * 0.5)}px ${ONLINE}`,
        }}
      />
      <span>{text}</span>
    </div>
  );
}

function Row({ s, label, value }: { s: Scale; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: s(10), borderBottom: "1px solid rgba(243,238,230,0.14)" }}>
      <div style={{ display: "flex", fontWeight: 600, fontSize: s(28), color: MUTED }}>{label}</div>
      <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(30) }}>{value}</div>
    </div>
  );
}

/** Батарейка: заряд = баллы шкалы из 12. */
function Battery({ bar, s }: { bar: CardBar; s: Scale }) {
  const level = bar.fill < 0.45 ? ORANGE : bar.fill < 0.75 ? "#FFC83D" : LIME;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
      <div style={{ display: "flex", width: s(330), alignItems: "center", gap: s(10), fontWeight: 800, fontSize: s(26) }}>
        <span>{bar.emoji}</span>
        <span>{bar.label}</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <div style={{ display: "flex", flex: 1, height: s(40), padding: s(5), borderRadius: s(10), border: `3px solid ${CREAM}` }}>
          <div style={{ display: "flex", width: `${Math.max(4, Math.round(bar.fill * 100))}%`, height: "100%", borderRadius: s(5), backgroundColor: level }} />
        </div>
        <div style={{ display: "flex", width: s(8), height: s(18), marginLeft: s(3), borderRadius: s(3), backgroundColor: CREAM }} />
      </div>
      <div style={{ display: "flex", width: s(80), justifyContent: "flex-end", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(26) }}>{bar.value}</div>
    </div>
  );
}

/** Кассовый чек: белая бумажная полоска с зубчатым краем. */
function Receipt({ card, s }: { card: ShareCard; s: Scale }) {
  const INK = "#1C1A20";
  const PAPER = "#FBF8F2";
  const r = card.receipt;
  const teeth = (flip: boolean) =>
    svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="14" viewBox="0 0 600 14" preserveAspectRatio="none"><path d="${flip ? "M0 0" : "M0 14"} ${Array.from({ length: 30 }, (_, i) => `L${i * 20 + 10} ${flip ? 14 : 0} L${i * 20 + 20} ${flip ? 0 : 14}`).join(" ")} ${flip ? "L600 0 Z" : "L600 14 Z"}" fill="${PAPER}"/></svg>`,
    );
  const dashes = <div style={{ display: "flex", fontWeight: 600, fontSize: s(22), color: "rgba(28,26,32,0.45)", letterSpacing: 4, overflow: "hidden", whiteSpace: "nowrap" }}>{"- ".repeat(60)}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignSelf: "center", width: s(760) }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- разметка для Satori */}
      <img src={teeth(false)} width={s(760)} height={s(14)} alt="" />
      <div style={{ display: "flex", flexDirection: "column", gap: s(12), padding: `${s(18)}px ${s(36)}px`, backgroundColor: PAPER, color: INK }}>
        {r && <div style={{ display: "flex", justifyContent: "center", fontWeight: 800, fontSize: s(22), letterSpacing: 2 }}>{`ЧЕК № ${r.number} · ${r.date}`}</div>}
        <div style={{ display: "flex", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(34) }}>КАК МЕНЯ ЛЮБИТЬ</div>
        {dashes}
        {card.bars?.map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: s(8), fontWeight: 800, fontSize: s(26) }}>
            <span>{`${b.label} ${b.emoji}`}</span>
            <div style={{ display: "flex", flex: 1, overflow: "hidden", whiteSpace: "nowrap", color: "rgba(28,26,32,0.4)" }}>{".".repeat(80)}</div>
            <span>{b.value}</span>
          </div>
        ))}
        {r?.items.map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: s(14) }}>
            <div style={{ display: "flex", flex: 1, fontWeight: 600, fontSize: s(25), lineHeight: 1.25 }}>{item}</div>
            <Check color={INK} size={s(28)} />
          </div>
        ))}
        {dashes}
        <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: s(32) }}>{`ИТОГО: ${card.title} ${card.emoji}`}</div>
        {card.line && <div style={{ display: "flex", fontWeight: 800, fontSize: s(26) }}>{card.line}</div>}
        <div style={{ display: "flex", justifyContent: "center", fontWeight: 600, fontSize: s(20), color: "rgba(28,26,32,0.6)" }}>
          Чек действителен для одного человека 😉
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- разметка для Satori */}
      <img src={teeth(true)} width={s(760)} height={s(14)} alt="" />
    </div>
  );
}

/** Значок Premium: голубой кружок с 💎 в углу карточки (Satori понимает только left/top). */
function PremiumMark({ left, top, size }: { left: number; top: number; size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: "rgba(20,18,23,0.85)",
        border: "2px solid #62D2FF",
        boxShadow: "0 0 18px rgba(98,210,255,0.7)",
        fontSize: Math.round(size * 0.52),
      }}
    >
      💎
    </div>
  );
}

// ---------- Карточка 4:5 и превью ссылки ----------

export function ShareCardImage({ card, format }: { card: ShareCard; format: ShareFormat }) {
  if (format === "preview") return <Preview card={card} />;
  return card.kind === "swag" ? <SwagStory card={card} /> : <Story card={card} />;
}

/** «Я Холерик» — на карточках Swag и Facts. */
const heroTitle = (card: ShareCard) => (card.kind ? `Я ${card.title}` : card.title);

/** Подвал карточки 4:5: призыв, ссылка и логотип. */
function StoryFooter({ card }: { card: ShareCard }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 24, gap: 10 }}>
      <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: 38, lineHeight: 1.15, textShadow: TEXT_SHADOW }}>
        {card.kind ? "А ты кто? Пройди в GAZ" : `А ты кто? Пройди за ${card.durationMin} мин`}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontWeight: 800, fontSize: 28, color: LIME }}>{card.shortLink}</div>
        <Logo size={28} />
      </div>
    </div>
  );
}

/**
 * Swag 😎 — чтобы выпендриться: огромный эмодзи, «Я {title}», одна строка-крючок, внизу «А ты кто? Пройди в GAZ».
 * Без процентов и костюма; фон и текстура — те же, что у теста.
 */
function SwagStory({ card }: { card: ShareCard }) {
  const W = 1080;
  const H = 1350;
  const title = heroTitle(card);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: W,
        height: H,
        padding: "60px 72px 56px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Backdrop card={card} w={W} h={H} emojiSize={760} />
      {card.premium && <PremiumMark left={W - 66} top={H - 66} size={50} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={32} />
        <div
          style={{
            display: "flex",
            padding: "9px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(20,18,23,0.6)",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {card.testTitle}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {card.style === "messenger" ? (
          <Avatar card={card} size={300} />
        ) : (
          <div style={{ display: "flex", fontSize: 330, lineHeight: 1 }}>{card.emoji}</div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 36,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: titleSize(title, 104),
            lineHeight: 1.05,
            letterSpacing: -2,
            textShadow: TEXT_SHADOW,
          }}
        >
          {title}
        </div>
        {card.swag && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              maxWidth: 880,
              marginTop: 34,
              padding: "22px 36px",
              borderRadius: 32,
              backgroundColor: "rgba(20,18,23,0.72)",
              border: `3px solid ${card.color}`,
              fontWeight: 800,
              fontSize: card.swag.length > 40 ? 40 : 46,
              lineHeight: 1.25,
            }}
          >
            {card.swag}
          </div>
        )}
      </div>
      <StoryFooter card={card} />
    </div>
  );
}

/** На карточке 4:5 средний блок крупнее базовых размеров; с «Показателями» строк больше — чуть компактнее. */
const roomy: Scale = (n) => Math.round(n * 1.16);
const dense: Scale = (n) => Math.round(n * 1.0);

function Story({ card }: { card: ShareCard }) {
  const W = 1080;
  const H = 1350;
  const tight = card.bars !== null;
  const s = tight ? dense : roomy;
  const messenger = card.style === "messenger";
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: W,
        height: H,
        padding: "60px 72px 56px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Backdrop card={card} w={W} h={H} emojiSize={760} />
      {/* правый нижний угол, правее логотипа в подвале */}
      {card.premium && <PremiumMark left={W - 66} top={H - 66} size={50} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={32} />
        <div
          style={{
            display: "flex",
            padding: "9px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(20,18,23,0.6)",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {card.testTitle}
        </div>
      </div>

      {/* Середина — по центру между шапкой и низом */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
      {/* Герой: у мессенджера — аватар контакта, имя и статус «в сети» */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {messenger ? (
          <Avatar card={card} size={tight ? 170 : 210} />
        ) : (
          <div style={{ display: "flex", fontSize: tight ? 118 : 150, lineHeight: 1 }}>{card.emoji}</div>
        )}
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: titleSize(heroTitle(card), messenger ? (tight ? 76 : 88) : tight ? 90 : 100),
            lineHeight: 1.05,
            letterSpacing: -2,
            textShadow: TEXT_SHADOW,
          }}
        >
          {heroTitle(card)}
        </div>
        {messenger && card.line && (
          <div style={{ display: "flex", marginTop: 16 }}>
            <StatusLine text={card.line} size={tight ? 30 : 34} />
          </div>
        )}
        {card.blendLine && (
          <div
            style={{
              display: "flex",
              marginTop: 14,
              padding: "8px 22px",
              borderRadius: 999,
              backgroundColor: "rgba(20,18,23,0.7)",
              border: `2px solid ${card.color}`,
              fontWeight: 800,
              fontSize: 30,
            }}
          >
            {card.blendLine}
          </div>
        )}
      </div>

      {/* Средний блок — костюм теста */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: messenger ? 28 : 34 }}>
        <Costume card={card} s={s} />
      </div>

      {card.points.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: tight ? 22 : 30, gap: tight ? 8 : 12 }}>
          {card.points.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 16, fontWeight: 800, fontSize: tight ? 30 : 34, textShadow: TEXT_SHADOW }}>
              <Sparkle color={card.color} size={tight ? 26 : 30} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      )}
      </div>

      <StoryFooter card={card} />
    </div>
  );
}

/** Превью ссылки на итог (1200×630): герой слева, костюм справа, внизу «А ты кто? Пройди за N мин». */
function Preview({ card }: { card: ShareCard }) {
  const W = 1200;
  const H = 630;
  const small: Scale = (n) => Math.round(n * 0.6);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: W,
        height: H,
        padding: "38px 52px 34px",
        backgroundColor: BG,
        color: CREAM,
        fontFamily: BODY,
      }}
    >
      <Backdrop card={card} w={W} h={H} emojiSize={460} />
      {/* правый верхний угол: внизу справа логотип */}
      {card.premium && <PremiumMark left={W - 58} top={14} size={44} />}
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 440, alignItems: "flex-start", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              padding: "6px 16px",
              borderRadius: 999,
              backgroundColor: "rgba(20,18,23,0.6)",
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {card.testTitle}
          </div>
          {card.style === "messenger" ? (
            <div style={{ display: "flex", marginTop: 20 }}>
              <Avatar card={card} size={120} />
            </div>
          ) : (
            <div style={{ display: "flex", marginTop: 16, fontSize: 104, lineHeight: 1 }}>{card.emoji}</div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: titleSize(card.title, 62),
              lineHeight: 1.05,
              textShadow: TEXT_SHADOW,
            }}
          >
            {card.title}
          </div>
          {card.style === "messenger" && card.line && (
            <div style={{ display: "flex", marginTop: 12 }}>
              <StatusLine text={card.line} size={20} />
            </div>
          )}
          {card.blendLine && <div style={{ display: "flex", marginTop: 10, fontWeight: 800, fontSize: 24, color: card.color, textShadow: TEXT_SHADOW }}>{card.blendLine}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <Costume card={card} s={small} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 900, fontSize: 28, textShadow: TEXT_SHADOW }}>
          {`А ты кто? Пройди за ${card.durationMin} мин`}
        </div>
        <Logo size={24} />
      </div>
    </div>
  );
}

// ---------- Обложки для превью ссылок на тест и главную ----------

/** Мягкое свечение для обложек. */
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

/** Обложка теста для превью ссылки (1200×630): эмодзи, название, «Тест · бесплатно», крючок. */
export function TestCover({
  emoji,
  title,
  meta,
  hook,
  color,
}: {
  emoji: string;
  title: string;
  /** «Тест · бесплатно» — без числа вопросов и минут. */
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
      <Layer src={grain(1200, 630)} w={1200} h={630} opacity={0.07} />
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
      <Layer src={grain(1200, 630)} w={1200} h={630} opacity={0.07} />
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
