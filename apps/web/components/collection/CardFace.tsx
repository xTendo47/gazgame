// Лицо карты Коллекции: как игральная (2:3, скругление), крупный эмодзи по центру, название (Unbounded), мелкая подпись.
// Редкость видна по рамке: обычная (серая), редкая (оранжевая со свечением), золотая (золотая, по рамке пробегает блик).
import type { CardSnap } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";

const RARITY: Record<CardSnap["rarity"], string> = {
  common: "border-line",
  rare: "border-orange shadow-[0_0_14px_rgb(255_90_31/0.25)]",
  gold: "coll-shine border-[#FFC83A] shadow-[0_0_16px_rgb(255_200_58/0.3)]",
};
const RARITY_BIG: Record<CardSnap["rarity"], string> = {
  common: "border-line",
  rare: "border-orange shadow-[0_0_30px_rgb(255_90_31/0.35)]",
  gold: "coll-shine border-[#FFC83A] shadow-[0_0_34px_rgb(255_200_58/0.4)]",
};

/** Эмодзи карты: у ничьей в тесте два рядом. */
function Emoji({ card, big }: { card: Pick<CardSnap, "emoji" | "emoji2">; big?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("flex items-center justify-center leading-none", card.emoji2 ? (big ? "gap-1 text-[44px]" : "gap-0.5 text-[22px]") : big ? "text-[76px]" : "text-4xl")}>
      <Glyph emoji={card.emoji} size="1em" />
      {card.emoji2 && <Glyph emoji={card.emoji2} size="1em" />}
    </span>
  );
}

/** Карта в сетке полки. Сама не кнопка: оборачивается в <button>/<Link> снаружи. */
export function CardFace({ card, count, isNew }: { card: CardSnap; count?: number; isNew?: boolean }) {
  return (
    <span
      className={cn(
        "relative flex aspect-[2/3] w-full max-w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-[1.5px] bg-[linear-gradient(165deg,#2C2632,#1D1A21)] px-2 py-2.5 text-center",
        RARITY[card.rarity],
      )}
    >
      {count && count > 1 && <span className="absolute top-[7px] right-2 text-[10px] font-extrabold text-lime">×{count}</span>}
      {isNew && <span className="absolute top-[7px] left-2 size-2 rounded-full bg-orange shadow-[0_0_8px_#FF5A1F]" aria-label="Новая карта" />}
      <Emoji card={card} />
      <b className="line-clamp-2 font-display text-[11.5px] leading-[1.2] font-semibold break-words">{card.title}</b>
      <small className="absolute right-1.5 bottom-2 left-1.5 text-[10px] leading-[1.2] text-muted">{card.caption}</small>
    </span>
  );
}

/** Карта крупно: в открытом виде на весь экран и во вспышке новой карты. */
export function BigCardFace({ card, className }: { card: CardSnap; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] w-[min(62vw,250px)] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[22px] border-2 bg-[linear-gradient(165deg,#30293A,#1D1A21)] p-[18px] text-center",
        RARITY_BIG[card.rarity],
        className,
      )}
    >
      <Emoji card={card} big />
      <b className="font-display text-lg leading-[1.2] font-extrabold break-words">{card.title}</b>
      <small className="text-xs text-muted">{card.caption}</small>
    </div>
  );
}
