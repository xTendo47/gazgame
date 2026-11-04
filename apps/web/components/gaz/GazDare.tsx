"use client";

// Экран «Вызов 👆»: друг открыл ссылку /gaz?dare=<id>. Карта с меткой «Вызов 👆», «Принимаю 🔥» (задание становится
// «в процессе» в разделе GAZ) и «В другой раз» (просто в раздел GAZ). Без сервера отправитель не узнает, принят ли вызов.
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GazTask } from "@gazgame/content";
import { cn } from "@gazgame/ui";
import { trackGazDareAccept, trackGazTake } from "@/lib/analytics";
import { updateGaz } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { takeCard } from "@gazgame/engine";
import { BTN, BTN_GHOST, TaskCard } from "./TaskCard";
import { Em } from "@/components/Em";

export function GazDare({ task }: { task: GazTask }) {
  const router = useRouter();

  function accept() {
    haptic("take");
    trackGazDareAccept({ id: task.id });
    trackGazTake({ id: task.id, source: "dare" });
    updateGaz((d) => takeCard(d, { id: task.id, source: "dare" }, new Date()));
    router.push("/gaz");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] leading-[1.1] font-extrabold text-balance"><Em text="Тебе бросили вызов в GAZ 👆" /></h1>
      <TaskCard
        task={task}
        source="dare"
        actions={
          <>
            <button
              type="button"
              onClick={accept}
              className={cn(BTN, "col-span-full bg-orange py-3.5 font-display text-base text-bg")}
            >
              <Em text="Принимаю 🔥" />
            </button>
            <Link href="/gaz" className={cn(BTN_GHOST, "col-span-full flex items-center justify-center")}>
              В другой раз
            </Link>
          </>
        }
      />
      <p className="text-center text-xs text-muted"><Em text="Это GAZ: игры, тесты и задания, чтобы не сидеть 🚀" /></p>
    </div>
  );
}
