"use client";

// Экран-вспышка «Новая карта в Коллекции 🃏»: карта и кнопка «Смотреть» (ведёт в Коллекцию). Показывается после нового итога теста,
// нового задания или награды; вспышки идут по очереди и переживают перезагрузку. Стоит на экранах, где такая карта может появиться.
import { useEffect, useRef, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dismissFlash } from "@gazgame/engine";
import { updateCollection, useCollectionData } from "@/lib/collection";
import { GIcon } from "@/components/casino/GIcon";
import { BigCardFace } from "./CardFace";

const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const dist = 90 + (i % 3) * 30;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: ["#FF5A1F", "#D4FF3A", "#FFC83A"][i % 3] as string,
  };
});

export function CollectionFlash() {
  const { flash } = useCollectionData();
  const card = flash[0];
  const router = useRouter();
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (card) button.current?.focus();
  }, [card]);

  if (!card) return null;

  function watch() {
    updateCollection(dismissFlash);
    if (pathname !== "/collection") router.push("/collection");
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Новая карта в Коллекции" className="ts-reset fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-6">
      <div className="today-pop relative flex w-full max-w-[340px] flex-col items-center gap-3">
        {SPARKS.map((s, i) => (
          <i
            key={i}
            aria-hidden="true"
            className="gaz-spark"
            style={{ "--dx": s.dx, "--dy": s.dy, background: s.color, boxShadow: `0 0 8px ${s.color}`, top: "35%" } as CSSProperties}
          />
        ))}
        <b className="font-display text-xl font-extrabold">
          Новая карта в Коллекции <GIcon name="cards" />
        </b>
        <BigCardFace card={card} />
        <button
          ref={button}
          type="button"
          onClick={watch}
          className="gaz-press mt-1 min-h-12 w-full rounded-2xl bg-lime px-4 py-3 font-display text-base font-extrabold text-bg"
        >
          Смотреть
        </button>
      </div>
    </div>
  );
}
