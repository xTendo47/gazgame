// Картинка итога теста: /share/test/<slug>?r=<результат>&b=<второй тип>&s=<баллы>&f=story|preview&stats=1|0
// PNG рисует сервер (next/og). Один и тот же PNG — и превью в меню «Куда кидаем?», и картинка в сторис.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { findTest } from "@gazgame/engine";
import { ShareCardImage } from "@/components/share/ShareCardImage";
import { getCatalog, visibility } from "@/lib/catalog";
import { buildShareCard, decodeScores, SHARE_SIZE, siteUrl, type ShareFormat } from "@/lib/share-card";

// next/og не читает woff2 — берём woff из @fontsource (лицензия OFL, см. assets/fonts).
// Латиница и кириллица — отдельные файлы под разными именами: Satori держит один файл на имя и вес,
// поэтому в разметке шрифт задаётся парой «кириллица, латиница» (см. ShareCardImage).
const fontDir = join(process.cwd(), "assets", "fonts");
const fontFiles = [
  { name: "Unbounded Cyr", weight: 900, file: "unbounded-cyrillic-900-normal.woff" },
  { name: "Unbounded Lat", weight: 900, file: "unbounded-latin-900-normal.woff" },
  { name: "Manrope Cyr", weight: 600, file: "manrope-cyrillic-600-normal.woff" },
  { name: "Manrope Lat", weight: 600, file: "manrope-latin-600-normal.woff" },
  { name: "Manrope Cyr", weight: 800, file: "manrope-cyrillic-800-normal.woff" },
  { name: "Manrope Lat", weight: 800, file: "manrope-latin-800-normal.woff" },
] as const;
const fontsPromise = Promise.all(
  fontFiles.map(async (f) => ({
    name: f.name,
    weight: f.weight,
    style: "normal" as const,
    data: await readFile(join(fontDir, f.file)).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer),
  })),
);

/** Адрес, с которого пришли (в dev nextUrl.origin бывает 0.0.0.0 — берём из заголовков). */
function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/share/test/[slug]">) {
  const { slug } = await ctx.params;
  const q = request.nextUrl.searchParams;
  const test = findTest(getCatalog(), slug, visibility);
  const format: ShareFormat = q.get("f") === "preview" ? "preview" : "story";
  const card =
    test &&
    buildShareCard(
      test,
      { slug, resultId: q.get("r") ?? "", blendId: q.get("b") ?? undefined, scores: decodeScores(q.get("s")), stats: q.get("stats") !== "0" },
      siteUrl(requestOrigin(request)),
    );
  if (!card) return new Response("Нет такого теста или результата", { status: 404 });

  return new ImageResponse(<ShareCardImage card={card} format={format} />, {
    ...SHARE_SIZE[format],
    emoji: "twemoji",
    fonts: await fontsPromise,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
