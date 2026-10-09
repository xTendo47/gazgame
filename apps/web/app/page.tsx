// Главное меню GAZ Game
import Link from "next/link";
import { Badge, Logo, Screen, Tile } from "@gazgame/ui";
import { SECTIONS } from "@/lib/sections";

const MORE = [
  { href: "/ultimate", emoji: "🔱", title: "Ultimate" },
  { href: "/soon/subscription", emoji: "💎", title: "Подписка" },
  { href: "/soon/suggest", emoji: "💡", title: "Предложи своё" },
  { href: "/soon/community", emoji: "👥", title: "Сообщество" },
  { href: "/soon/profile", emoji: "👤", title: "Профиль" },
  { href: "/soon/feedback", emoji: "📝", title: "Обратная связь" },
  { href: "/soon/story", emoji: "📖", title: "История создания" },
];

export default function Home() {
  return (
    <Screen>
      <header className="pt-6 pb-2">
        <Logo className="text-6xl" />
        <p className="mt-4 text-xl font-bold text-muted">
          Не сиди. Не тупи. <span className="text-lime">Газ!</span>
        </p>
      </header>

      <h2 className="font-display text-2xl font-bold">Йо! Кто сегодня собрался? 🔥</h2>

      <nav aria-label="Разделы" className="flex flex-col gap-3.5">
        {SECTIONS.map((s) => (
          <Link key={s.id} href={`/${s.id}`} className="group block rounded-card">
            <Tile emoji={s.emoji} title={s.title} subtitle={s.subtitle} accent={s.accent} />
          </Link>
        ))}
      </nav>

      <nav aria-label="Ещё" className="mt-2 grid grid-cols-2 gap-3">
        {MORE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-20 flex-col justify-between gap-2 rounded-card bg-surface p-4 transition hover:bg-surface-2 active:scale-[0.98]"
          >
            <span className="flex items-start justify-between gap-2">
              <span aria-hidden="true" className="text-2xl">
                {item.emoji}
              </span>
              <Badge tone="soon">скоро</Badge>
            </span>
            <span className="text-[15px] font-bold leading-tight">{item.title}</span>
          </Link>
        ))}
      </nav>
    </Screen>
  );
}
