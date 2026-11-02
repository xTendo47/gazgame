// «Сегодня 🔥»: /today. Батл дня, вопрос дня и задание дня (из раздела GAZ): одни и те же у всех, меняются в 00:00 МСК.
// День засчитан, если сделано хоть одно из трёх: серия, заморозка, награды 3/7/30/100. Контент — packages/content/data/today.json.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestSkin } from "@/components/diary/TestSkin";
import { TodayScreen } from "@/components/today/TodayScreen";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Сегодня", description: "Батл, вопрос и задание дня. Меньше минуты в день." };

/** Время сервера: экран берёт его при первой отрисовке, чтобы разметка на сервере и в браузере совпала. */
const serverNowMs = () => Date.now();

export default function TodayPage() {
  const { today, gaz } = getCatalog();
  if (!today || !gaz) notFound();
  return (
    <TestSkin theme="album">
      <TodayScreen today={today} gaz={gaz} serverMs={serverNowMs()} />
    </TestSkin>
  );
}
