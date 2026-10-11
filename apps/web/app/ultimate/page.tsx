// Ultimate 🔱 — в будущем отдельное приложение. Здесь только витрина и «Хочу первым».
// Тексты — packages/content/data/ultimate.json. Вид как у экрана «Premium», только огонь вместо льда.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Screen } from "@gazgame/ui";
import { HeaderBack } from "@/components/HeaderBack";
import { Embers } from "@/components/ultimate/Embers";
import { Trident } from "@/components/ultimate/Trident";
import { UltimateWaitlist } from "@/components/ultimate/UltimateWaitlist";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Ultimate", description: "Стань тем, кем хочешь" };

const AMBER = "#FFB23F";

export default function UltimatePage() {
  const texts = getCatalog().ultimate;
  if (!texts) notFound();

  return (
    <Screen>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-[13px] text-muted">
          <HeaderBack />
          <span>{texts.header}</span>
        </div>

        <section aria-labelledby="ultimate-title" className="fire-hero relative flex flex-col items-center gap-2.5 overflow-hidden rounded-[24px] px-[18px] pt-7 pb-[22px] text-center">
          <Embers count={20} seed={21} rise={[80, 240]} />
          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <Trident size={92} />
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: AMBER }}>
              {texts.badge}
            </div>
            <h1 id="ultimate-title" className="font-display text-[30px] leading-[1.05] font-black text-balance">
              {texts.title}
            </h1>
            <p className="max-w-[30ch] text-[15px] leading-[1.45] text-balance text-cream/90">{texts.lead}</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          {texts.tiles.map((t) => (
            <div key={t.title} className="flex min-w-0 flex-col gap-1.5 rounded-[18px] border border-line bg-surface p-3">
              <span aria-hidden="true" className="text-[22px] leading-none">
                {t.emoji}
              </span>
              <b className="font-display text-xs leading-tight font-bold">{t.title}</b>
              <span className="text-xs leading-snug text-muted">{t.text}</span>
            </div>
          ))}
        </div>

        <UltimateWaitlist texts={texts} />
        <p className="text-center text-xs text-muted">{texts.fine}</p>
      </div>
    </Screen>
  );
}
