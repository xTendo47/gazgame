// Значки тестов в списках кармашков «Дневника»: настоящее эмодзи из данных, как в эталонах.
import { Glyph } from "@/components/casino/GIcon";

export function DiaryIcon({ emoji, label }: { emoji: string; label?: string; kind: "wanted" | "clinic" }) {
  return <Glyph emoji={emoji} label={label} size="1.5em" />;
}
