import Link from "next/link";
import { buttonVariants, ComingSoon, Screen } from "@gazgame/ui";
import { GIcon } from "@/components/casino/GIcon";

export default function NotFound() {
  return (
    <Screen>
      <ComingSoon emoji={<GIcon name="ufo" size="1em" />} title="Тут пусто" text="Такой страницы нет. Может, её ещё не придумали?">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          В меню
        </Link>
      </ComingSoon>
    </Screen>
  );
}
