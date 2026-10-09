"use client";

import { useRouter } from "next/navigation";
import { Button } from "@gazgame/ui";
import { trackDeeperClick, type DeeperClickEvent } from "@/lib/analytics";

/** «Глубже 💎»: оплаты пока нет — отправляем событие и показываем экран «Скоро» (или экран upsell теста через href). */
export function DeeperButton({
  label = "Глубже 💎",
  href = "/deeper",
  ...event
}: DeeperClickEvent & { label?: string; href?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="accent"
      onClick={() => {
        trackDeeperClick(event);
        router.push(href);
      }}
    >
      {label}
    </Button>
  );
}
