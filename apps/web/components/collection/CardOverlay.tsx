"use client";

// Открытая карта на весь экран: выезжает с переворотом (рубашка → лицо, 0,4 с, лёгкая вибрация).
// Под ней «В сторис» (картинка тем же движком next/og, что шеринг тестов) и у карты теста «Пройти ещё раз».
// Закрыть: тап мимо карты, Esc или свайп вниз.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CollectionCard } from "@gazgame/engine";
import { buttonVariants, cn } from "@gazgame/ui";
import { trackCollectionCardShare } from "@/lib/analytics";
import { haptic } from "@/lib/haptics";
import { shareImage } from "@/lib/share";
import { siteUrl } from "@/lib/share-card";
import { BigCardFace } from "./CardFace";

export function CardOverlay({ card, onClose }: { card: CollectionCard; onClose: () => void }) {
  const [image, setImage] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    haptic("tick");
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);

  // Картинку для сторис грузим заранее: делиться файлом нужно сразу по нажатию
  useEffect(() => {
    let alive = true;
    fetch(`/share/card?${card.share}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => alive && setImage(blob))
      .catch(() => alive && setStatus("Картинка не загрузилась. Проверь интернет и открой карту ещё раз."));
    return () => {
      alive = false;
    };
  }, [card.share]);

  async function story() {
    if (!image) return;
    trackCollectionCardShare({ key: card.key });
    const link = `${siteUrl(window.location.origin)}/collection`;
    const outcome = await shareImage(image, `gaz-card-${card.key.replace(/[^a-z0-9]+/gi, "-")}.png`, `Моя карта в GAZ 🃏 ${link}`);
    if (outcome === "downloaded") setStatus("Картинка сохранена. Выложи её в сторис 🔥");
  }

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[rgb(10_8_12/0.82)] px-4 py-6 outline-none [perspective:900px]"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("[data-keep]")) onClose();
      }}
      onPointerDown={(e) => {
        startY.current = e.clientY;
      }}
      onPointerUp={(e) => {
        // свайп вниз закрывает
        if (startY.current !== null && e.clientY - startY.current > 80) onClose();
        startY.current = null;
      }}
    >
      <div data-keep className="coll-flip">
        <BigCardFace card={card} />
      </div>
      <div data-keep className="flex w-[min(100%,320px)] gap-2">
        <button
          type="button"
          onClick={() => void story()}
          disabled={!image}
          className="gaz-press min-h-12 flex-1 rounded-[14px] bg-orange px-2 py-3 text-center text-sm font-extrabold text-bg disabled:opacity-60"
        >
          {image ? "В сторис" : "Рисуем картинку…"}
        </button>
        {card.retakeSlug && (
          <Link
            href={`/test/${card.retakeSlug}`}
            className={cn(buttonVariants({ variant: "ghost", size: "md" }), "min-h-12 flex-1 rounded-[14px] px-2 py-3 text-sm font-extrabold")}
          >
            Пройти ещё раз
          </Link>
        )}
      </div>
      <p role="status" data-keep className="min-h-4 text-center text-xs text-muted">
        {status || "Тап мимо карты, чтобы закрыть"}
      </p>
    </div>
  );
}
