// GAZ GAME $HOW: /show — квиз-шоу. Вопросы читаются из packages/content/data/quiz/*.json.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShowScreen } from "@/components/show/ShowScreen";
import { getCatalog } from "@/lib/catalog";

/** Время сервера для первого кадра: вынесено из компонента, чтобы не считаться «нечистым» вызовом при рендере. */
const serverNowMs = () => Date.now();

export const metadata: Metadata = { title: "$HOW" };

export default function ShowPage() {
  const { quiz, quizArtists } = getCatalog();
  if (!quiz || quiz.length === 0) notFound();
  return <ShowScreen quiz={quiz} artists={quizArtists ?? []} serverMs={serverNowMs()} />;
}
