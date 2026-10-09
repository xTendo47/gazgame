// «Глубже» для теста: /test/<slug>/deeper
// Главный вариант — premium, supreme — мелкой строкой. Оплаты пока нет: обе ссылки ведут на «Скоро».
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findTest } from "@gazgame/engine";
import { Badge, buttonVariants, Screen } from "@gazgame/ui";
import { BackButton } from "@/components/BackButton";
import { getCatalog, visibility } from "@/lib/catalog";

type Props = PageProps<"/test/[slug]/deeper">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog()
    .tests.filter((t) => t.upsell)
    .map((t) => ({ slug: t.slug }));
}

async function load(params: Props["params"]) {
  const test = findTest(getCatalog(), (await params).slug, visibility);
  return test?.upsell ? { test, upsell: test.upsell } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  return data ? { title: `${data.upsell.button} — ${data.test.title}` } : {};
}

export default async function TestDeeperPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { test, upsell } = data;

  return (
    <Screen className="justify-center">
      <section
        className="flex flex-col gap-4 rounded-card border-2 border-lime bg-surface p-6"
        style={{ backgroundImage: "radial-gradient(circle at 100% 0%, rgba(212,255,58,0.18), transparent 60%)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="premium">💎 Premium</Badge>
          <span className="text-sm font-bold text-muted">
            {test.emoji} {test.title}
          </span>
        </div>
        <h1 className="font-display text-3xl font-black leading-tight">{upsell.premium.headline ?? upsell.button}</h1>
        <p className="text-lg leading-relaxed">{upsell.premium.text}</p>
        <Link href="/deeper" className={buttonVariants({ variant: "accent" })}>
          Хочу Premium 💎
        </Link>
      </section>

      {upsell.supreme && (
        <p className="px-1 text-center text-sm text-muted">
          {upsell.supreme.text}{" "}
          <Link href="/deeper" className="font-bold whitespace-nowrap text-cream underline underline-offset-4">
            Supreme →
          </Link>
        </p>
      )}

      <BackButton>← К результату</BackButton>
    </Screen>
  );
}
