"use client";

import { useRouter } from "next/navigation";
import { Button } from "@gazgame/ui";
import { trackDeeperClick, type DeeperClickEvent } from "@/lib/analytics";

/** «Глубже 💎»: оплаты пока нет — отправляем событие и показываем экран «Скоро» (или экран upsell теста через href). */
export function DeeperButton({
  label = "Глубже 💎",
  href = "/deeper",
  keepQuery = false,
  ...event
}: DeeperClickEvent & {
  label?: string;
  href?: string;
  /** Передать дальше параметры текущего адреса (например, баллы шкал — для подстановки {weakestScale}). */
  keepQuery?: boolean;
}) {
  const router = useRouter();

  return (
    <Button
      variant="accent"
      className="diamond-glow-ring"
      onClick={() => {
        trackDeeperClick(event);
        router.push(keepQuery ? href + window.location.search : href);
      }}
    >
      {label}
    </Button>
  );
}
