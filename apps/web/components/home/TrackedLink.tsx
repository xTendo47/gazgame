"use client";

// Ссылка главной со счётчиком нажатия: обычный Link (или внешняя ссылка), плюс событие аналитики.
// Главная — серверная страница, а onClick бывает только в клиентском компоненте, поэтому ссылки вынесены сюда.
import type { ComponentProps } from "react";
import Link from "next/link";
import { trackHomeClick, trackHomeSection, type HomeTarget } from "@/lib/analytics";

type Track = { kind: "home"; target: HomeTarget } | { kind: "section"; section: "party" | "love" | "solo" };

export function TrackedLink({ track, external, onClick, ...props }: ComponentProps<typeof Link> & { track: Track; external?: boolean }) {
  return (
    <Link
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        // свой обработчик (например, анимация перед переходом) идёт первым
        onClick?.(e);
        if (track.kind === "home") trackHomeClick({ target: track.target });
        else trackHomeSection({ section: track.section });
      }}
    />
  );
}
