"use client";

// «Сравниться с партнёром 💎» под итогом теста: ведёт в «Для пар» на вкладку «Совместимость».
// Нажатие считаем, как «Глубже 💎» (с Premium событие не шлём — см. trackDeeperClick).
import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";

export const COMPAT_HREF = "/pairs?tab=compat";

export function CompatLink({ testId, label }: { testId: string; label: string }) {
  return (
    <Link
      href={COMPAT_HREF}
      onClick={() => trackDeeperClick({ id: testId, kind: "test", source: "compat" })}
      className={buttonVariants({ variant: "accent", className: "diamond-glow-ring" })}
    >
      <Lock aria-hidden="true" size={18} className="shrink-0" />
      {label}
    </Link>
  );
}
