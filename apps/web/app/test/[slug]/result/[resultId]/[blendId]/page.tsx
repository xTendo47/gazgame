// Смешанный результат: /test/<slug>/result/<основной тип>/<второй тип>
// Например, «Холерик с нотками меланхолика». Страницы создаются заранее для всех пар из blendNotes.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blendPairs, findResult, findTest } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { resultDescription, resultTitle, TestResultView } from "@/components/result/TestResultView";
import { getCatalog, visibility } from "@/lib/catalog";

type Props = PageProps<"/test/[slug]/result/[resultId]/[blendId]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().tests.flatMap((t) => blendPairs(t).map((pair) => ({ slug: t.slug, ...pair })));
}

async function load(params: Props["params"]) {
  const { slug, resultId, blendId } = await params;
  const test = findTest(getCatalog(), slug, visibility);
  const result = test && resultId !== blendId ? findResult(test, resultId) : undefined;
  const second = test && findResult(test, blendId);
  const note = test?.blendNotes?.[blendId];
  return test && result && second && note ? { test, result, blend: { resultId: blendId, result: second, note } } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  return data
    ? { title: `${resultTitle(data.result, data.blend)} — ${data.test.title}`, description: resultDescription(data.result) }
    : {};
}

export default async function BlendResultPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  return (
    <Screen>
      <TestResultView test={data.test} result={data.result} blend={data.blend} />
    </Screen>
  );
}
