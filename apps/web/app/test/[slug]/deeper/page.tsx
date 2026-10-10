// «Глубже» для теста: /test/<slug>/deeper
// Предложение подписки premium (она одна). Оплаты пока нет: кнопка ведёт на «Скоро».
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fillPlaceholders, findTest } from "@gazgame/engine";
import { Badge, buttonVariants, Screen } from "@gazgame/ui";
import { BackButton } from "@/components/BackButton";
import { UpsellText } from "@/components/result/UpsellText";
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
  const textClass = "text-lg leading-relaxed";

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
        {/* {weakestScale} и другие подстановки берутся из адреса уже в браузере */}
        <Suspense fallback={<p className={textClass}>{fillPlaceholders(upsell.premium.text, {})}</p>}>
          <UpsellText test={test} text={upsell.premium.text} className={textClass} />
        </Suspense>
        <Link href="/deeper" className={buttonVariants({ variant: "accent", className: "diamond-glow-ring" })}>
          Хочу Premium 💎
        </Link>
      </section>

      <BackButton>← К результату</BackButton>
    </Screen>
  );
}
