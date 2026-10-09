// Ultimate («Становление») — в будущем отдельное приложение. Здесь только тизер.
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";

export const metadata: Metadata = { title: "Ultimate" };

export default function UltimatePage() {
  return (
    <Screen className="bg-[radial-gradient(circle_at_50%_30%,rgba(255,90,31,0.25),transparent_60%)]">
      <BackLink href="/">Меню</BackLink>
      <section className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
        <div aria-hidden="true" className="text-8xl">
          🔱
        </div>
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-lime">GAZ Ultimate</p>
        <h1 className="font-display text-4xl font-black leading-tight">
          Готовим кое-что большое.
          <br />
          <span className="text-orange">Скоро.</span>
        </h1>
        <p className="max-w-sm text-lg text-muted">Становление: мыслители, практики, дневник и цели.</p>
        <Link href="/" className={buttonVariants({ variant: "primary", className: "mt-4" })}>
          Пока — газ в играх 🔥
        </Link>
      </section>
    </Screen>
  );
}
