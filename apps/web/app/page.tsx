// Главная GAZ Game (спека 16.10): логотип, 🎲 и 👤, слоган, полоса «Сегодня», «Продолжить» (если есть незаконченный тест),
// «С кем ты сейчас?» с тремя разделами, полоса GAZ, полоса Premium, мини-ряд. Что и в каком порядке — в lib/menu.ts.
import type { CSSProperties } from "react";
import { isVisible, itemPath, randomPool } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { CollectionDot } from "@/components/collection/CollectionDot";
import { ContinueCard, type ContinueTestSummary } from "@/components/home/ContinueCard";
import { TrackedLink } from "@/components/home/TrackedLink";
import { RandomDice } from "@/components/RandomDice";
import { TodayStrip } from "@/components/today/TodayStrip";
import { getCatalog, visibility } from "@/lib/catalog";
import { HOME_SECTIONS, MINI_BUTTONS } from "@/lib/menu";

export default function Home() {
  const catalog = getCatalog();
  const randomPaths = randomPool(catalog, visibility).map(itemPath);
  // Для «Продолжить» нужны только название, эмодзи и число вариантов у вопросов
  const tests: ContinueTestSummary[] = catalog.tests
    .filter((t) => isVisible(t, visibility))
    .map((t) => ({ id: t.id, slug: t.slug, title: t.title, emoji: t.emoji, options: t.questions.map((q) => q.options.length) }));

  return (
    <Screen className="gap-3.5">
      <header className="flex items-center justify-between gap-3 pt-4">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-0.02em] whitespace-nowrap max-[380px]:text-[28px]">
          GAZ <span className="text-orange">GAME</span>
        </h1>
        <div className="flex gap-2">
          <RandomDice paths={randomPaths} />
          <TrackedLink
            href="/profile"
            track={{ kind: "home", target: "profile" }}
            aria-label="Профиль"
            className="grid size-[46px] place-items-center rounded-[14px] border border-line bg-surface text-2xl transition hover:bg-surface-2 max-[380px]:size-[42px] max-[380px]:text-[21px]"
          >
            <span aria-hidden="true">👤</span>
          </TrackedLink>
        </div>
      </header>
      <p className="-mt-1.5 font-bold text-muted">Не сиди. Не тупи. Играй!</p>

      <TodayStrip />
      <ContinueCard tests={tests} />

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

      {/* Полоса GAZ: оранжевая, мягко «дышит» (пульсирующая тень), дышит только она */}
      <TrackedLink
        href="/gaz"
        track={{ kind: "home", target: "gaz" }}
        className="home-gaz gaz-press flex w-full items-center justify-between gap-2.5 rounded-[20px] px-4 py-3.5 text-left text-bg"
      >
        <span>
          <b className="font-display text-[17px] font-extrabold">🚀 GAZ</b>
          <small className="block text-[12.5px] font-bold opacity-80">Задания в реальной жизни</small>
        </span>
        <span className="rounded-xl bg-bg px-3 py-3 font-display text-[13px] font-extrabold whitespace-nowrap text-cream">Мне скучно 😩</span>
      </TrackedLink>

      {/* Полоса Premium: голубая рамка и ровное свечение (без пульса) */}
      <TrackedLink
        href="/premium"
        track={{ kind: "home", target: "premium" }}
        className="home-prem gaz-press flex w-full items-center gap-3 rounded-[20px] px-4 py-3.5 text-left"
      >
        <span aria-hidden="true" className="text-[28px] leading-none">
          💎
        </span>
        <span>
          <b className="block font-display text-base font-extrabold text-[#62D2FF]">Premium</b>
          <small className="block text-[12.5px] text-muted">Всё открыто, без ограничений</small>
        </span>
        <span aria-hidden="true" className="ml-auto font-display text-lg font-extrabold text-[#62D2FF]">
          →
        </span>
      </TrackedLink>

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
