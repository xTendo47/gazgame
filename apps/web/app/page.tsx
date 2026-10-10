// Главное меню GAZ Game: три большие карточки разделов + маленькие кнопки по две в ряд.
// Что и в каком порядке — в lib/menu.ts, названия разделов — в packages/content/src/sections.ts.
import Link from "next/link";
import { cn, Logo, Screen } from "@gazgame/ui";
import { MAIN_CARDS, SMALL_BUTTONS } from "@/lib/menu";
import { getSection } from "@/lib/sections";

export default function Home() {
  return (
    <Screen>
      <header className="pt-4">
        <Logo className="text-5xl" />
        <p className="mt-3 text-lg font-bold text-muted">
          Не сиди. Не тупи. <span className="text-lime">Газ!</span>
        </p>
      </header>

      <nav aria-label="Разделы">
        <ul className="flex flex-col gap-3">
          {MAIN_CARDS.map(({ section: id, bg }) => {
            const section = getSection(id);
            if (!section) return null;
            return (
              <li key={id}>
                <Link
                  href={`/${id}`}
                  className={cn(
                    "flex min-h-28 items-center gap-4 rounded-card px-5 py-5 text-bg transition",
                    "hover:brightness-105 active:scale-[0.98]",
                    bg,
                  )}
                >
                  <span aria-hidden="true" className="w-14 shrink-0 text-center text-5xl leading-none">
                    {section.emoji}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-2xl font-black leading-tight">{section.title}</span>
                    <span className="text-[15px] font-semibold leading-snug opacity-80">{section.subtitle}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Ещё">
        <ul className="grid grid-cols-2 gap-3">
          {SMALL_BUTTONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-24 flex-col items-center justify-center gap-1.5 rounded-card bg-surface px-3 text-center transition",
                  "hover:bg-surface-2 active:scale-[0.97]",
                  item.neon && "neon-ultimate",
                )}
              >
                <span aria-hidden="true" className="text-3xl leading-none">
                  {item.emoji}
                </span>
                <span className="text-[15px] font-bold leading-tight">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Screen>
  );
}
