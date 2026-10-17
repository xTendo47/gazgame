"use client";

// Ссылка главной со счётчиком нажатия: обычный Link (или внешняя ссылка), плюс событие аналитики.
// Главная — серверная страница, а onClick бывает только в клиентском компоненте, поэтому ссылки вынесены сюда.
import type { ComponentProps } from "react";
import Link from "next/link";
import { trackHomeClick, trackHomeSection, type HomeTarget } from "@/lib/analytics";

type Track = { kind: "home"; target: HomeTarget } | { kind: "section"; section: "party" | "love" | "solo" };

export function TrackedLink({ track, external, ...props }: ComponentProps<typeof Link> & { track: Track; external?: boolean }) {
  return (
    <Link
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => (track.kind === "home" ? trackHomeClick({ target: track.target }) : trackHomeSection({ section: track.section }))}
    />
  );
}
