// Только для разработки: /dev/design — витрина дизайн-системы v6.4 (шрифты, материалы, физические кнопки).
// В продакшене страницы нет (404).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdmitTicket, BackTag, ContinueTicket, Jeton, Tag } from "@gazgame/ui";

export const metadata: Metadata = { title: "Дизайн (dev)", robots: { index: false } };

const FONTS: [string, string][] = [
  ["Playfair Display", "var(--font-playfair)"],
  ["Marck Script", "var(--font-marck)"],
  ["Kelly Slab", "var(--font-kelly)"],
  ["Rubik Glitch", "var(--font-glitch)"],
  ["Rubik Mono One", "var(--font-rubik-mono)"],
  ["Bungee Inline", "var(--font-bungee-inline)"],
  ["Bungee", "var(--font-bungee)"],
  ["Unbounded", "var(--font-display)"],
  ["Manrope", "var(--font-body)"],
  ["IBM Plex Mono", "var(--font-plex)"],
  ["Comfortaa", "var(--font-comfortaa)"],
  ["Bad Script", "var(--font-script)"],
  ["Rye", "var(--font-rye)"],
  ["Roboto Slab", "var(--font-slab)"],
];

export default async function DevDesignPage() {
  await connection();
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className="gz-wood mx-auto flex min-h-dvh max-w-[460px] flex-col gap-6 overflow-x-clip px-4 py-5">
      <div>
        <BackTag>← На стол</BackTag>
      </div>

      <section className="flex flex-col gap-2">
        <ContinueTicket stub="GAZ" number="№ 07">
          ↩ Продолжить: <b>Кто из нас?</b>
        </ContinueTicket>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <AdmitTicket admit="ONE" label="Соло" serial="№ 001" pressed />
        <AdmitTicket admit="TWO" label="Вдвоём" serial="№ 002" />
        <AdmitTicket admit="ALL" label="Компания" serial="№ 003" />
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <Jeton>Газ!</Jeton>
        <Jeton ice>Стать VIP</Jeton>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Tag>Тусовка</Tag>
        <Tag card>Всегда бесплатно</Tag>
        <span className="gz-nail" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="gz-paper relative rounded-sm p-4 shadow-[var(--gz-shadow-lift)]">
          <span className="gz-tape -top-2 left-3" />
          Бумага + скотч
        </div>
        <div className="gz-gold rounded-sm p-4 font-extrabold">Золото</div>
        <div className="gz-cloth col-span-2 rounded-sm p-4 text-cream">Сукно казино-стола</div>
      </section>

      <section className="flex flex-col gap-1.5 rounded-sm bg-black/40 p-3">
        {FONTS.map(([name, family]) => (
          <p key={name} className="text-[20px] leading-tight text-cream" style={{ fontFamily: family }}>
            {name} — Газ! GAZ 123
          </p>
        ))}
      </section>
    </main>
  );
}
