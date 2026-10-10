// Главное меню GAZ Game: ровный список одинаковых кнопок. Порядок и названия — в lib/menu.ts.
import Link from "next/link";
import { buttonVariants, Logo, Screen } from "@gazgame/ui";
import { MENU } from "@/lib/menu";

export default function Home() {
  return (
    <Screen>
      <header className="pt-6 pb-2">
        <Logo className="text-6xl" />
        <p className="mt-4 text-xl font-bold text-muted">
          Не сиди. Не тупи. <span className="text-lime">Газ!</span>
        </p>
      </header>

      <nav aria-label="Главное меню">
        <ul className="flex flex-col gap-3">
          {MENU.map((item) => (
            <li key={item.href} className="relative">
              {item.glow && <span aria-hidden="true" className="diamond-glow" />}
              <Link
                href={item.href}
                className={buttonVariants({ variant: "ghost", className: "relative justify-start gap-3 text-left" })}
              >
                <span aria-hidden="true" className="w-8 shrink-0 text-center text-2xl leading-none">
                  {item.emoji}
                </span>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Screen>
  );
}
