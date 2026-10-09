import Link from "next/link";
import { buttonVariants, ComingSoon, Screen } from "@gazgame/ui";

export default function NotFound() {
  return (
    <Screen>
      <ComingSoon emoji="🛸" title="Тут пусто" text="Такой страницы нет. Может, её ещё не придумали?">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          В меню
        </Link>
      </ComingSoon>
    </Screen>
  );
}
