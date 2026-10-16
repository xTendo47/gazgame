// Раздел GAZ 🚀: /gaz. Задания «встать и сделать»: «Мне скучно», Газ-рулетка, челлендж недели, наборы.
// Ссылка вызова /gaz?dare=<id задания> открывает экран «Вызов 🫵»; превью ссылки: «Тебе бросили вызов в GAZ 🫵» + текст задания.
// Битый или чужой id — обычный раздел GAZ. Контент — packages/content/data/gaz.json.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findGazTask } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { GazDare } from "@/components/gaz/GazDare";
import { GazScreen } from "@/components/gaz/GazScreen";
import { getCatalog } from "@/lib/catalog";
import { SHARE_SIZE } from "@/lib/share-card";

type Props = PageProps<"/gaz">;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Время сервера: экран берёт его при первой отрисовке, чтобы разметка на сервере и в браузере совпала. */
const serverNowMs = () => Date.now();

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const gaz = getCatalog().gaz;
  const id = first((await searchParams).dare);
  const task = gaz && id ? findGazTask(gaz, id) : undefined;

  if (task) {
    const title = "Тебе бросили вызов в GAZ 🫵";
    const image = { url: `/share/gaz?dare=${task.id}`, ...SHARE_SIZE.preview, alt: title };
    return {
      title: { absolute: title },
      description: task.text,
      openGraph: { type: "website", siteName: "GAZ Game", locale: "ru_RU", title, description: task.text, images: [image] },
      twitter: { card: "summary_large_image", title, description: task.text, images: [image.url] },
    };
  }

  const description = "Хватит листать. Вот что сделать прямо сейчас.";
  const home = { url: "/share/home", ...SHARE_SIZE.preview, alt: "GAZ Game" };
  return {
    title: "GAZ 🚀",
    description,
    openGraph: { type: "website", siteName: "GAZ Game", locale: "ru_RU", title: "GAZ 🚀", description, images: [home] },
    twitter: { card: "summary_large_image", images: [home.url] },
  };
}

export default async function GazPage({ searchParams }: Props) {
  const { gaz, today } = getCatalog();
  if (!gaz || !today) notFound();
  const id = first((await searchParams).dare);
  const dare = id ? findGazTask(gaz, id) : undefined;

  return <Screen>{dare ? <GazDare task={dare} /> : <GazScreen gaz={gaz} today={today} serverMs={serverNowMs()} />}</Screen>;
}
