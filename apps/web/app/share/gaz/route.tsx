// Картинки раздела GAZ 🚀: /share/gaz?id=<задание>&g=1 — сторис «Сделано в GAZ 🔥» (1080×1350, g=1 — золотая);
// /share/gaz?dare=<задание> — превью ссылки вызова 🫵 (1200×630). Тот же движок (next/og), что у карточек тестов.
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { findGazTask } from "@gazgame/engine";
import { GazDoneCard, TestCover } from "@/components/share/ShareCardImage";
import { getCatalog } from "@/lib/catalog";
import { ogFonts } from "@/lib/og-fonts";
import { SHARE_SIZE, siteUrl } from "@/lib/share-card";

/** Адрес, с которого пришли (в dev nextUrl.origin бывает 0.0.0.0 — берём из заголовков). */
function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

const CACHE = { "Cache-Control": "public, max-age=3600, s-maxage=86400" };

export async function GET(request: NextRequest) {
  const gaz = getCatalog().gaz;
  const q = request.nextUrl.searchParams;
  const dareId = q.get("dare");
  const task = gaz ? findGazTask(gaz, dareId ?? q.get("id") ?? "") : undefined;
  if (!task) return new Response("Нет такого задания", { status: 404 });

  if (dareId) {
    return new ImageResponse(
      <TestCover emoji={task.emoji} title="Тебе бросили вызов в GAZ 🫵" meta="Слабо?" hook={task.text} color="#FF5A1F" />,
      { ...SHARE_SIZE.preview, fonts: await ogFonts(), headers: CACHE },
    );
  }

  const shortLink = `${siteUrl(requestOrigin(request)).replace(/^https?:\/\//, "")}/gaz`;
  return new ImageResponse(<GazDoneCard emoji={task.emoji} text={task.text} gold={q.get("g") === "1"} shortLink={shortLink} />, {
    ...SHARE_SIZE.story,
    fonts: await ogFonts(),
    headers: CACHE,
  });
}
