// Картинка батла дня для «Спросить друзей 👆»: /share/today?b=<id батла>&v=a|b — 1080×1350.
// Тот же движок (next/og), что у карточек тестов и раздела GAZ.
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { TodayBattleCard } from "@/components/share/ShareCardImage";
import { getCatalog } from "@/lib/catalog";
import { ogFonts } from "@/lib/og-fonts";
import { SHARE_SIZE, siteUrl } from "@/lib/share-card";

/** Адрес, с которого пришли (в dev nextUrl.origin бывает 0.0.0.0 — берём из заголовков). */
function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const battle = getCatalog().today?.battles.find((b) => b.id === q.get("b"));
  const v = q.get("v");
  if (!battle || (v !== "a" && v !== "b")) return new Response("Нет такого батла", { status: 404 });

  const shortLink = `${siteUrl(requestOrigin(request)).replace(/^https?:\/\//, "")}/today`;
  return new ImageResponse(<TodayBattleCard question={battle.question} pick={battle[v]} lime={v === "b"} shortLink={shortLink} />, {
    ...SHARE_SIZE.story,
    fonts: await ogFonts(),
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
