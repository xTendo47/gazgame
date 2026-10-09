// Экран теста: /test/<slug>
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findTest } from "@gazgame/engine";
import { Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { TestRunner } from "@/components/TestRunner";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().tests.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/test/[slug]">): Promise<Metadata> {
  const test = findTest(getCatalog(), (await params).slug, visibility);
  return { title: test?.title, description: test?.description };
}

export default async function TestPage({ params }: PageProps<"/test/[slug]">) {
  const test = findTest(getCatalog(), (await params).slug, visibility);
  if (!test) notFound();
  const section = getSection(test.sections[0] ?? "solo");

  return (
    <Screen>
      <PageHeader
        back={<BackLink href={`/${section?.id ?? ""}`}>{section?.title ?? "Меню"}</BackLink>}
        title={test.title}
        emoji={test.emoji}
        subtitle={test.description}
        badge={
          <span className="flex flex-wrap gap-2">
            <Badge>
              {test.questions.length} вопросов · {test.durationMin} мин
            </Badge>
            {test.status === "draft" && <Badge tone="draft">черновик</Badge>}
          </span>
        }
      />
      <TestRunner test={test} />
    </Screen>
  );
}
