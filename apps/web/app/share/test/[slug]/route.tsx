// Картинка итога теста: /share/test/<slug>?r=<результат>&b=<второй тип>&s=<баллы>&f=story|preview&stats=1|0&p=1
// p=1 — у автора Premium: маленький 💎 в углу.
// PNG рисует сервер (next/og). Один и тот же PNG — и превью в меню «Куда кидаем?», и картинка в сторис.
// Без r — обложка теста 1200×630 для превью ссылки на тест.
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { findTest } from "@gazgame/engine";
import { ShareCardImage, TestCover } from "@/components/share/ShareCardImage";
import { getCatalog, visibility } from "@/lib/catalog";
import { ogFonts } from "@/lib/og-fonts";
import { buildShareCard, decodeScores, glowColor, SHARE_SIZE, siteUrl, type ShareFormat } from "@/lib/share-card";

/** Адрес, с которого пришли (в dev nextUrl.origin бывает 0.0.0.0 — берём из заголовков). */
function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

const CACHE = { "Cache-Control": "public, max-age=3600, s-maxage=86400" };

export async function GET(request: NextRequest, ctx: RouteContext<"/share/test/[slug]">) {
  const { slug } = await ctx.params;
  const q = request.nextUrl.searchParams;
  const test = findTest(getCatalog(), slug, visibility);
  if (!test) return new Response("Нет такого теста", { status: 404 });

  // Обложка теста — превью ссылки на тест без итога
  if (!q.get("r")) {
    const first = test.results[0];
    return new ImageResponse(
      <TestCover
        emoji={test.emoji}
        title={test.title}
        meta="Тест · бесплатно"
        hook={test.description}
        color={first ? glowColor(test.id, first.id) : "#FF5A1F"}
      />,
      { ...SHARE_SIZE.preview, emoji: "twemoji", fonts: await ogFonts(), headers: CACHE },
    );
  }

  const format: ShareFormat = q.get("f") === "preview" ? "preview" : "story";
  const card = buildShareCard(
    test,
    { slug, resultId: q.get("r") ?? "", blendId: q.get("b") ?? undefined, scores: decodeScores(q.get("s")), stats: q.get("stats") !== "0", premium: q.get("p") === "1" },
    siteUrl(requestOrigin(request)),
  );
  if (!card) return new Response("Нет такого результата", { status: 404 });

  return new ImageResponse(<ShareCardImage card={card} format={format} />, {
    ...SHARE_SIZE[format],
    emoji: "twemoji",
    fonts: await ogFonts(),
    headers: CACHE,
  });
}
