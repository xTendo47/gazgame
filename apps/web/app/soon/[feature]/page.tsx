// Экран «Скоро» для пунктов меню, которых ещё нет: /soon/<id>
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants, ComingSoon } from "@gazgame/ui";
import { Glyph } from "@/components/casino/GIcon";
import { TestSkin } from "@/components/diary/TestSkin";
import { Em } from "@/components/Em";
import { BackLink } from "@/components/BackLink";
import { getSoonFeature, SOON_FEATURES } from "@/lib/features";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOON_FEATURES.map((f) => ({ feature: f.id }));
}

export async function generateMetadata({ params }: PageProps<"/soon/[feature]">): Promise<Metadata> {
  return { title: getSoonFeature((await params).feature)?.title };
}

export default async function SoonPage({ params }: PageProps<"/soon/[feature]">) {
  const feature = getSoonFeature((await params).feature);
  if (!feature) notFound();

  return (
    <TestSkin theme="diary">
      <BackLink href="/">Меню</BackLink>
      <ComingSoon emoji={<Glyph emoji={feature.emoji} label={feature.title} size="1em" />} title={`${feature.title} — скоро`} text={feature.text}>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          <Em text="Пока поиграем 🔥" />
        </Link>
      </ComingSoon>
    </TestSkin>
  );
}
