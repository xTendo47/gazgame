"use client";

import { useRouter } from "next/navigation";
import { Button } from "@gazgame/ui";

/** Кнопка «Назад» по истории браузера (если истории нет — в меню). */
export function BackButton({ children = "Назад" }: { children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      {children}
    </Button>
  );
}
