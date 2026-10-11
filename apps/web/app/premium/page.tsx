// Экран «Premium» 💎: /premium. Тексты — packages/content/data/premium.json, хэши кодов — premium-codes.json.
// Что в шторках разделов уже есть (💎), а что «скоро», решаем здесь по контенту.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { premiumRefExists } from "@gazgame/engine";
import { Screen } from "@gazgame/ui";
import { PremiumScreen } from "@/components/premium/PremiumScreen";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Premium", description: "Без ограничений 💎" };

export default function PremiumPage() {
  const catalog = getCatalog();
  const texts = catalog.premium;
  if (!texts) notFound();
  const found = Object.fromEntries(texts.sections.map((s) => [s.id, s.items.map((i) => premiumRefExists(catalog, i.ref))]));

  return (
    <Screen>
      <PremiumScreen texts={texts} found={found} hashes={catalog.premiumCodes ?? []} />
    </Screen>
  );
}
