// Список с голубыми светящимися точками (#62D2FF): «Что ты получишь» после теста, «Что узнаешь» в превью.
// Точка стоит по центру первой строки пункта, как пункт в тетрадке: она в коробке высотой ровно в одну строку.
import { cn } from "@gazgame/ui";

export function DotList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-[1.5]">
          <span aria-hidden="true" className="flex h-[1.5em] shrink-0 items-center">
            <span className="size-2 rounded-full bg-[#62D2FF] shadow-[0_0_8px_2px_rgb(98_210_255/0.55)]" />
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
