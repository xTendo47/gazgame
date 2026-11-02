// «Глубже 💎» — оплаты пока нет. Сюда ведёт кнопка после результатов; нажатие уже учтено в аналитике.
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, ComingSoon } from "@gazgame/ui";
import { GIcon } from "@/components/casino/GIcon";
import { Em } from "@/components/Em";
import { TestSkin } from "@/components/diary/TestSkin";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = { title: "Глубже" };

export default function DeeperPage() {
  return (
    <TestSkin theme="cosmos">
      <ComingSoon
        emoji={<GIcon name="diamond" size="1em" />}
        title="Глубина — скоро"
        text="Ты в числе первых, кто хочет копнуть глубже. Готовим полные разборы и режимы «Глубоко» — одна подписка откроет их во всех разделах."
      >
        <Link href="/premium" className={buttonVariants({ variant: "accent", className: "diamond-glow-ring" })}>
          <Em text="Хочу Premium 💎" />
        </Link>
        <BackButton>← Вернуться</BackButton>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "md" })}>
          В меню
        </Link>
      </ComingSoon>
    </TestSkin>
  );
}
