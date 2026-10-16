// «Мои ответы 📖»: дневник вопросов дня. Лежит только на телефоне, никуда не уходит и не шерится.
import type { Metadata } from "next";
import { Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { AnswersList } from "@/components/today/AnswersList";

export const metadata: Metadata = { title: "Мои ответы 📖" };

export default function AnswersPage() {
  return (
    <Screen>
      <div className="flex flex-col gap-4">
        <BackLink href="/today">Сегодня</BackLink>
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-[28px] leading-tight font-extrabold">Мои ответы 📖</h1>
          <p className="text-muted">Только на этом телефоне: никуда не уходит.</p>
        </header>
        <AnswersList />
      </div>
    </Screen>
  );
}
