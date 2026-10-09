// Результат теста: /test/<slug>/result/<id результата>
// Страницы создаются заранее для каждого результата каждого теста — ими можно делиться ссылкой.
// Смешанные результаты («с нотками…») — во вложенной папке [blendId].
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findResult, findTest } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { resultDescription, TestResultView } from "@/components/result/TestResultView";
import { getCatalog, visibility } from "@/lib/catalog";

type Props = PageProps<"/test/[slug]/result/[resultId]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().tests.flatMap((t) => t.results.map((r) => ({ slug: t.slug, resultId: r.id })));
}

async function load(params: Props["params"]) {
  const { slug, resultId } = await params;
  const test = findTest(getCatalog(), slug, visibility);
  const result = test && findResult(test, resultId);
  return test && result ? { test, result } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  return data ? { title: `${data.result.title} — ${data.test.title}`, description: resultDescription(data.result) } : {};
}

export default async function ResultPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  return (
    <Screen>
      <TestResultView test={data.test} result={data.result} />
    </Screen>
  );
}
