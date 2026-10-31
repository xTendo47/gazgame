// «Чем займёмся?»: открытая коробка с разделами. Сюда ведёт кнопка «Играть» со стола (главная).
// Лоток с плитками Тусовка / Романтика / Дневник / $HOW и нижний ряд — components/table/OpenBox.tsx.
import type { Metadata } from "next";
import { OpenBox } from "@/components/table/OpenBox";

export const metadata: Metadata = { title: "Чем займёмся?" };

export default function OpenBoxPage() {
  return <OpenBox />;
}
