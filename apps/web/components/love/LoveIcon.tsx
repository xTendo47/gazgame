// Значок на карточках колод «Романтики»: настоящее эмодзи из данных, как в эталонах 06 и 07.
import { Glyph } from "@/components/casino/GIcon";

export function LoveIcon({ emoji, label }: { emoji: string; label?: string }) {
  return <Glyph emoji={emoji} label={label} />;
}
