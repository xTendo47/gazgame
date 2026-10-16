// «Коллекция 🃏» (бывший профиль): /collection. Альбом карт: итоги тестов, сделанные задания GAZ, награды за серию и челленджи.
// Карты собираются на устройстве из того, что уже хранится; с сервера приходит только лёгкий список тестов, заданий и наград.
import type { Metadata } from "next";
import { collectionContent } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { CollectionScreen } from "@/components/collection/CollectionScreen";
import { getCatalog, visibility } from "@/lib/catalog";

export const metadata: Metadata = { title: "Коллекция 🃏", description: "Всё, что ты сделал в GAZ, превращается в карту." };

/** Время сервера: экран берёт его при первой отрисовке, чтобы разметка на сервере и в браузере совпала. */
const serverNowMs = () => Date.now();

export default function CollectionPage() {
  return (
    <Screen>
      <CollectionScreen content={collectionContent(getCatalog(), visibility)} serverMs={serverNowMs()} />
    </Screen>
  );
}
