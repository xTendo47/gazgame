"use client";

// Оранжевая точка на плитке «Коллекция» в главном меню: горит, пока новую карту не открыли.
import { useHasNewCard } from "@/lib/collection";

export function CollectionDot() {
  const hasNew = useHasNewCard();
  if (!hasNew) return null;
  return (
    <i
      role="img"
      aria-label="Есть новая карта"
      className="absolute top-[9px] right-[9px] z-10 size-[9px] rounded-full bg-orange shadow-[0_0_8px_#FF5A1F]"
    />
  );
}
