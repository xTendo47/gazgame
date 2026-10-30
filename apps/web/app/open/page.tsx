// «Чем займёмся?»: открытая коробка с разделами. Сюда ведёт кнопка «Играть» со стола (главная).
// Пока здесь прежние карточки разделов и мини-ряд; оформление «лоток с 4 отсеками» — Этап 2.3.
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { backTagClass, Screen } from "@gazgame/ui";
import { CollectionDot } from "@/components/collection/CollectionDot";
import { TrackedLink } from "@/components/home/TrackedLink";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";

export const metadata: Metadata = { title: "Чем займёмся?" };

export default function OpenBoxPage() {
  return (
    <Screen className="gap-3.5">
      <header className="pt-4">
        <Link href="/" className={backTagClass()}>
          ← На стол
        </Link>
      </header>
      <h1 className="font-display text-[26px] leading-tight font-extrabold">Чем займёмся?</h1>

      <h2 className="mt-0.5 -mb-1 font-display text-[15px] font-semibold">С кем ты сейчас?</h2>
      <nav aria-label="Разделы">
        <ul className="flex flex-col gap-3">
          {HOME_SECTIONS.map((s) => (
            <li key={s.id}>
              <TrackedLink
                href={s.href}
                track={{ kind: "section", section: s.id }}
                style={{ "--c": s.color } as CSSProperties}
                className="home-sec gaz-press relative flex min-h-24 w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-left"
              >
                <span
                  className="absolute top-3 right-3 rounded-full px-[9px] py-[3px] text-[11px] font-extrabold tracking-[0.06em] max-[380px]:px-2 max-[380px]:text-[10px]"
                  style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}
                >
                  {s.who}
                </span>
                <span aria-hidden="true" className="w-[50px] flex-none text-center text-[44px] leading-none drop-shadow-[0_6px_14px_rgb(0_0_0/0.4)]">
                  {s.emoji}
                </span>
                <span className="min-w-0 flex-1 pr-2">
                  <b className="block font-display text-[21px] leading-[1.1] font-extrabold max-[380px]:text-[19px]">{s.title}</b>
                  <small className="mt-1 block text-[13.5px] text-[#D9D1DE]">{s.subtitle}</small>
                </span>
                <span aria-hidden="true" className="ml-auto font-display text-xl font-extrabold opacity-80" style={{ color: s.color }}>
                  →
                </span>
              </TrackedLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Ещё">
        <ul className="grid grid-cols-3 gap-1.5">
          {MINI_BUTTONS.map((m) => (
            <li key={m.id}>
              <TrackedLink
                href={m.href}
                external={m.external}
                track={{ kind: "home", target: m.id }}
                className="gaz-press relative flex min-h-16 flex-col items-center gap-1 rounded-2xl border border-line px-0.5 py-2.5 text-[11px] font-bold text-muted transition hover:bg-surface"
              >
                {m.badge && (
                  <em className="absolute -top-[7px] right-1.5 rounded-full border border-lime/40 bg-bg px-1.5 py-px text-[9px] font-extrabold text-lime not-italic">
                    {m.badge}
                  </em>
                )}
                {m.dot && <CollectionDot />}
                <span aria-hidden="true" className="text-xl leading-none">
                  {m.emoji}
                </span>
                {m.title}
              </TrackedLink>
            </li>
          ))}
        </ul>
      </nav>
    </Screen>
  );
}
