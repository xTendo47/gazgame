// Обложка главной для превью ссылки: /share/home (1200×630).
import { ImageResponse } from "next/og";
import { SECTION_LABELS } from "@gazgame/content";
import { HomeCover } from "@/components/share/ShareCardImage";
import { ogFonts } from "@/lib/og-fonts";
import { SHARE_SIZE } from "@/lib/share-card";

export async function GET() {
  return new ImageResponse(<HomeCover emojis={[SECTION_LABELS.pairs.emoji, SECTION_LABELS.company.emoji, SECTION_LABELS.solo.emoji]} />, {
    ...SHARE_SIZE.preview,
    emoji: "twemoji",
    fonts: await ogFonts(),
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
