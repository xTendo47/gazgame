// «Глубже 💎» — оплаты пока нет. Сюда ведёт кнопка после результатов; нажатие уже учтено в аналитике.
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, ComingSoon, Screen } from "@gazgame/ui";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = { title: "Глубже 💎" };

export default function DeeperPage() {
  return (
    <Screen>
      <ComingSoon
        emoji="💎"
        title="Глубина — скоро"
        text="Ты в числе первых, кто хочет копнуть глубже. Готовим полные разборы и режимы «Глубоко» — одна подписка откроет их во всех разделах."
      >
        <BackButton>← Вернуться</BackButton>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "md" })}>
          В меню
        </Link>
      </ComingSoon>
    </Screen>
  );
}
