// Главное меню GAZ Game: три большие тёмные карточки разделов + маленькие кнопки по две в ряд.
// Что и в каком порядке — в lib/menu.ts, названия разделов — в packages/content/src/sections.ts.
import Link from "next/link";
import { itemPath, randomPool } from "@gazgame/engine";
import { cn, Logo, Screen, Tile } from "@gazgame/ui";
import { RandomDice } from "@/components/RandomDice";
import { getCatalog, visibility } from "@/lib/catalog";
import { MAIN_CARDS, SMALL_BUTTONS } from "@/lib/menu";
import { getSection } from "@/lib/sections";

export default function Home() {
  const randomPaths = randomPool(getCatalog(), visibility).map(itemPath);

  return (
    <Screen>
      <header className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <Logo className="text-5xl" />
          <RandomDice paths={randomPaths} className="-mt-1 -mr-1" />
        </div>
        <p className="mt-3 text-lg font-bold text-muted">
          Не сиди. Не тупи. <span className="text-lime">Газ!</span>
        </p>
      </header>

      <nav aria-label="Разделы">
        <ul className="flex flex-col gap-3">
          {MAIN_CARDS.map((id) => {
            const section = getSection(id);
            if (!section) return null;
            return (
              <li key={id}>
                <Link href={`/${id}`} className="group block rounded-card">
                  <Tile
                    emoji={section.emoji}
                    title={section.title}
                    subtitle={section.subtitle}
                    accent={section.accent}
                    className="min-h-28"
                  />
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
                  item.diamond && "diamond-glow",
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
