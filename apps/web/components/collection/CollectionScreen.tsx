"use client";

// Экран «Коллекция 🃏»: /collection. Профиль стал альбомом карт. Сверху вниз: шапка «Собрано N карт» и шестерёнка
// (в ней всё, что раньше было в профиле), «Пазл личности 💎», полки «Я», «Задания GAZ 🚀», «Награды 🔥» с рекордом серии.
// Карты собираются из того, что уже хранится на устройстве (engine/collection.ts). Вид — по макету collection.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildCollection,
  openCardKey,
  pluralDays,
  syncCollection,
  type CollectionCard,
  type CollectionContent,
  type CollectionSlot,
} from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { trackCollectionCardOpen, trackCollectionOpen, trackCollectionPuzzleClick, trackDeeperClick } from "@/lib/analytics";
import { updateCollection, useCollectionData, useProgressData } from "@/lib/collection";
import { useNow } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { BackLink } from "../BackLink";
import { CardFace } from "./CardFace";
import { CardOverlay } from "./CardOverlay";
import { CollectionFlash } from "./CollectionFlash";

/** «карта», «карты», «карт». */
function pluralCards(n: number): string {
  const m = n % 10;
  const h = n % 100;
  if (m === 1 && h !== 11) return "карта";
  return m >= 2 && m <= 4 && (h < 12 || h > 14) ? "карты" : "карт";
}

const EMPTY_PROGRESS = { tests: {} };
const SLOT = "relative flex aspect-[2/3] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-[1.5px] px-2 py-2.5 text-center";

function Shelf({ id, title, hint, children }: { id: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="font-display text-base leading-tight font-semibold">
          {title}
        </h2>
        <span className="text-xs font-bold text-muted tabular-nums">{hint}</span>
      </div>
      {children}
    </section>
  );
}

/** Пустой слот: рубашка карты, «???», снизу название. Тап ведёт туда, где карту получить. */
function Back({ label, mark, lock }: { label: string; mark: string; lock?: boolean }) {
  return (
    <span className={cn(SLOT, lock ? "coll-lock border-[#62D2FF]/45" : "coll-back border-dashed border-line")}>
      <span aria-hidden="true" className={cn("font-display font-extrabold text-muted", lock ? "text-2xl" : "text-xl")}>
        {mark}
      </span>
      <small className="absolute right-1.5 bottom-2 left-1.5 text-[10px] leading-[1.2] text-muted">{label}</small>
    </span>
  );
}

export function CollectionScreen({ content, serverMs }: { content: CollectionContent; serverMs: number }) {
  const progress = useProgressData();
  const { newKeys } = useCollectionData();
  const now = useNow(serverMs);
  const view = useMemo(() => buildCollection(content, progress ?? EMPTY_PROGRESS, now), [content, progress, now]);
  const [open, setOpen] = useState<CollectionCard | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    trackCollectionOpen();
  }, []);

  // Сверка: при первом открытии всё собранное раньше считаем известным, дальше новые карты (например, челлендж
  // закончившейся недели) получают точку и вспышку
  const cardKeys = view.cards.map((c) => c.key).join("|");
  useEffect(() => {
    if (!progress) return;
    const current = progress.collection ?? { newKeys: [], flash: [] };
    const next = syncCollection(current, view.cards);
    if (next !== current) updateCollection(() => next);
    // view.cards меняется вместе с cardKeys; цикла нет: sync возвращает тот же объект, когда менять нечего
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress === null, cardKeys]);

  function openCard(card: CollectionCard) {
    haptic("tick");
    trackCollectionCardOpen({ key: card.key });
    updateCollection((d) => openCardKey(d, card.key));
    setOpen(card);
  }

  function puzzle() {
    trackCollectionPuzzleClick();
    trackDeeperClick({ id: "personality-puzzle", kind: "collection", source: "collection-puzzle" });
    setToast("Скоро в Premium 🔥");
  }

  function renderSlot(slot: CollectionSlot, i: number) {
    if (slot.kind === "card") {
      return (
        <li key={slot.card.key}>
          <button type="button" onClick={() => openCard(slot.card)} aria-label={`${slot.card.title}. ${slot.card.caption}`} className="gaz-press block w-full text-left">
            <CardFace card={slot.card} count={slot.card.count} isNew={newKeys.includes(slot.card.key)} />
          </button>
        </li>
      );
    }
    if (slot.kind === "locked") {
      return (
        <li key={`locked-${slot.slug}`}>
          <Link href={`/locked/${slot.slug}`} aria-label={`${slot.label}: платный тест`} className="gaz-press block">
            <Back label={slot.label} mark="💎" lock />
          </Link>
        </li>
      );
    }
    const inner = <Back label={slot.label} mark="???" />;
    return (
      <li key={`empty-${i}`}>
        {slot.test ? (
          <Link href={`/test/${slot.test}`} aria-label={`Пустой слот. Пройти тест «${slot.label}»`} className="gaz-press block">
            {inner}
          </Link>
        ) : slot.gaz ? (
          <Link href="/gaz" aria-label="Пустой слот. Открыть раздел GAZ" className="gaz-press block">
            {inner}
          </Link>
        ) : (
          <button type="button" onClick={() => setToast(`Эта карта за ${slot.label}`)} aria-label={`Пустой слот. Карта за ${slot.label}`} className="gaz-press block w-full">
            {inner}
          </button>
        )}
      </li>
    );
  }

  const taskSlots: CollectionSlot[] = [
    ...view.tasks.map((card): CollectionSlot => ({ kind: "card", card })),
    ...(view.tasks.length > 0 ? [{ kind: "empty", label: "Следующее задание", gaz: true } as const] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/">Меню</BackLink>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] leading-[1.1] font-extrabold">
            Коллекция <span aria-hidden="true">🃏</span>
          </h1>
          <p className="mt-1 text-sm text-muted tabular-nums">
            Собрано{" "}
            <b className="text-cream">
              {view.total} {pluralCards(view.total)}
            </b>
          </p>
        </div>
        {/* Шестерёнка: сюда переехало всё, что было в профиле */}
        <Link
          href="/profile"
          aria-label="Настройки"
          className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-line bg-surface text-xl transition hover:bg-surface-2"
        >
          <span aria-hidden="true">⚙️</span>
        </Link>
      </header>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={puzzle}
          className="gaz-press flex w-full items-center gap-3.5 rounded-[22px] border border-[#62D2FF]/50 bg-surface px-4 py-3.5 text-left shadow-[0_0_20px_rgb(98_210_255/0.16)]"
        >
          <span aria-hidden="true" className="text-[34px] leading-none">
            🧩
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-display text-[15px] font-semibold">Пазл личности 💎</b>
            <small className="block text-xs text-muted">Собери карты всех тестов, и GAZ сложит из них твой портрет</small>
            <span aria-hidden="true" className="mt-2 block h-[5px] overflow-hidden rounded-full bg-[#2A2531]">
              <i className="block h-full rounded-full bg-[#62D2FF]" style={{ width: `${Math.round((view.meOwned / Math.max(1, view.meTotal)) * 100)}%` }} />
            </span>
            <span className="mt-1 block text-xs font-extrabold text-[#62D2FF] tabular-nums">
              {view.meOwned} из {view.meTotal} тестов
            </span>
          </span>
        </button>
        {toast && (
          <p role="status" className="rounded-[14px] border border-line bg-[#2A2531] px-3 py-2.5 text-[13px]">
            {toast}
          </p>
        )}
      </div>

      <Shelf id="coll-me" title="Я" hint={`${view.meOwned} из ${view.meTotal}`}>
        <ul className="grid grid-cols-3 gap-2.5">{view.me.map(renderSlot)}</ul>
      </Shelf>

      <Shelf id="coll-tasks" title="Задания GAZ 🚀" hint={String(view.tasks.length)}>
        {view.tasks.length === 0 ? (
          <Link
            href="/gaz"
            className="flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-line px-4 py-4 text-center text-[15px] font-bold text-muted transition hover:bg-surface"
          >
            Сделай первое задание в разделе GAZ 🚀
          </Link>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5">{taskSlots.map(renderSlot)}</ul>
        )}
      </Shelf>

      <Shelf id="coll-awards" title="Награды 🔥" hint={`${view.awardsOwned} из ${view.awardsTotal}`}>
        {view.awardsOwned === 0 && (
          <Link
            href="/today"
            className="flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-line px-4 py-4 text-center text-[15px] font-bold text-muted transition hover:bg-surface"
          >
            3 дня подряд в «Сегодня», и здесь появится первая карта 🔥
          </Link>
        )}
        <ul className="grid grid-cols-3 gap-2.5">{view.awards.map(renderSlot)}</ul>
        <p className="text-[13px] font-bold text-muted">
          Рекорд серии:{" "}
          <b className="text-orange">
            {view.best} {pluralDays(view.best)}
          </b>
        </p>
      </Shelf>

      {open && <CardOverlay card={open} onClose={() => setOpen(null)} />}
      <CollectionFlash />
    </div>
  );
}
