// Экран теста: /test/<slug>
// Ссылка на итог из шеринга: /test/<slug>?from=share&r=<результат>[&b=<второй тип>]&s=<баллы через точку>.
// Сервер читает эти параметры: отдаёт мета-теги итога для превью в Telegram и VK, а другу показывает
// «Тебе скинули: …» и начало теста. Битые или подделанные параметры — обычное превью теста.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Test } from "@gazgame/content";
import { findResult, findTest, parseSharedResult, sharedResultMeta } from "@gazgame/engine";
import { Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { FriendBanner } from "@/components/share/FriendBanner";
import { TestRunner } from "@/components/TestRunner";
import { getCatalog, visibility } from "@/lib/catalog";
import { getSection } from "@/lib/sections";
import { shareImagePath, SHARE_SIZE } from "@/lib/share-card";

type Props = PageProps<"/test/[slug]">;
type Search = Awaited<Props["searchParams"]>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Итог из ссылки, если он настоящий. */
function sharedFrom(test: Test, sp: Search) {
  return parseSharedResult(test, { r: first(sp.r), b: first(sp.b), s: first(sp.s) });
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().tests.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const test = findTest(getCatalog(), (await params).slug, visibility);
  if (!test) return {};
  const shared = sharedFrom(test, await searchParams);

  if (shared) {
    // Превью ссылки на итог: «Холерик 🔥 × Сангвиник ☀️ · GAZ», картинка 1200×630 с полосками
    const { title, description } = sharedResultMeta(test, shared);
    const image = { url: shareImagePath({ slug: test.slug, ...shared, stats: true }, "preview"), ...SHARE_SIZE.preview, alt: title };
    return {
      title: { absolute: title },
      description,
      openGraph: { type: "website", siteName: "GAZ Game", locale: "ru_RU", title, description, images: [image] },
      twitter: { card: "summary_large_image", title, description, images: [image.url] },
    };
  }

  // Превью ссылки на тест: своя обложка теста
  const title = `${test.title} ${test.emoji}`;
  const image = { url: `/share/test/${test.slug}`, ...SHARE_SIZE.preview, alt: test.title };
  return {
    title: test.title,
    description: test.description,
    openGraph: { type: "website", siteName: "GAZ Game", locale: "ru_RU", title, description: test.description, images: [image] },
    twitter: { card: "summary_large_image", title, description: test.description, images: [image.url] },
  };
}

export default async function TestPage({ params, searchParams }: Props) {
  const test = findTest(getCatalog(), (await params).slug, visibility);
  if (!test) notFound();
  const sp = await searchParams;
  const fromShare = first(sp.from) === "share";
  const shared = fromShare ? sharedFrom(test, sp) : null;
  const friendResult = shared ? findResult(test, shared.resultId) : undefined;
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
            <Badge>Тест</Badge>
            {test.status === "draft" && <Badge tone="draft">черновик</Badge>}
          </span>
        }
      />
      {fromShare && (
        <FriendBanner
          testId={test.id}
          friend={
            shared && friendResult
              ? { resultId: shared.resultId, blendId: shared.blendId, emoji: friendResult.emoji, title: friendResult.title }
              : null
          }
        />
      )}
      <TestRunner test={test} />
    </Screen>
  );
}
