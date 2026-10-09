// Экран «Скоро» для пунктов меню, которых ещё нет: /soon/<id>
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants, ComingSoon, Screen } from "@gazgame/ui";
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
    <Screen>
      <BackLink href="/">Меню</BackLink>
      <ComingSoon emoji={feature.emoji} title={`${feature.title} — скоро`} text={feature.text}>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Пока поиграем 🔥
        </Link>
      </ComingSoon>
    </Screen>
  );
}
