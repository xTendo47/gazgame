// Картинка карты Коллекции для «В сторис»: /share/card?k=<вид>&… — 1080×1350. Тот же движок (next/og), что у карточек тестов.
// Параметры по видам: k=test&id=<тест>&r=<итог>[&r2=<второй итог при ничьей>] | k=gaz&id=<задание>&g=0|1 |
// k=streak&id=<карта за серию> | k=week&id=<челлендж>&n=<отметок 5–7>. Текст берётся из контента, а не из адреса.
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { collectionContent, gazTaskCard, streakCard, testCard, weekCard, type CollectionCard } from "@gazgame/engine";
import { CollectionShareCard } from "@/components/share/ShareCardImage";
import { getCatalog, visibility } from "@/lib/catalog";
import { ogFonts } from "@/lib/og-fonts";
import { SHARE_SIZE, siteUrl } from "@/lib/share-card";

/** Адрес, с которого пришли (в dev nextUrl.origin бывает 0.0.0.0 — берём из заголовков). */
function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

function cardFromQuery(q: URLSearchParams): CollectionCard | null {
  const content = collectionContent(getCatalog(), visibility);
  const id = q.get("id") ?? "";
  switch (q.get("k")) {
    case "test": {
      const test = content.tests.find((t) => t.id === id);
      return test ? testCard(test, q.get("r") ?? "", q.get("r2") ?? undefined) : null;
    }
    case "gaz": {
      const task = content.tasks.find((t) => t.id === id);
      return task ? gazTaskCard(task, { count: 1, gold: q.get("g") === "1", date: "" }) : null;
    }
    case "streak": {
      const step = content.ladder.find((s) => s.card?.id === id);
      return step ? streakCard(step) : null;
    }
    case "week": {
      const challenge = content.challenges.find((c) => c.id === id);
      const marks = Number(q.get("n"));
      return challenge && Number.isInteger(marks) ? weekCard(challenge, 0, marks) : null;
    }
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  const card = cardFromQuery(request.nextUrl.searchParams);
  if (!card) return new Response("Нет такой карты", { status: 404 });
  const shortLink = `${siteUrl(requestOrigin(request)).replace(/^https?:\/\//, "")}/collection`;
  return new ImageResponse(<CollectionShareCard card={card} shortLink={shortLink} />, {
    ...SHARE_SIZE.story,
    emoji: "twemoji",
    fonts: await ogFonts(),
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
