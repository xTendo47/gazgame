"use client";

// Раздел GAZ GAME $HOW (квиз): хаб → раунд (категория, супер-квиз, вопрос дня) → итоги, или «Суд присяжных».
// Режим (соло / вдвоём / компания) выбирается на хабе. Вопросы приходят готовыми из data/quiz/*.json (страница /show).
import { useState } from "react";
import type { QuizCategory, QuizCourt, QuizFile, QuizSuper } from "@gazgame/content";
import { buildRound, buildSuperRound, dailyQuestion, quizPlayers, type QuizMode } from "@gazgame/engine";
import { useNow } from "@/lib/gaz";
import { saveDailyAnswer, useShowData } from "@/lib/show";
import { CourtPlay } from "./CourtPlay";
import { QuizPlay, type QuizRoundConfig } from "./QuizPlay";
import { ShowHub } from "./ShowHub";

type View = { kind: "hub" } | { kind: "play"; config: QuizRoundConfig; key: number } | { kind: "court" };

export function ShowScreen({ quiz, serverMs }: { quiz: QuizFile[]; serverMs: number }) {
  const categories = quiz.filter((q): q is QuizCategory => q.kind === "category");
  const sup = quiz.find((q): q is QuizSuper => q.kind === "super");
  const court = quiz.find((q): q is QuizCourt => q.kind === "court");
  const [mode, setMode] = useState<QuizMode>("solo");
  const [party, setParty] = useState(4);
  const [view, setView] = useState<View>({ kind: "hub" });
  const show = useShowData();
  const now = useNow(serverMs);
  const daily = dailyQuestion(categories, now);

  const start = (config: QuizRoundConfig) => setView((v) => ({ kind: "play", config, key: (v.kind === "play" ? v.key : 0) + 1 }));

  const playCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    start({ theme: id, title: category.title, mode, players: quizPlayers(mode, party), questions: buildRound(category) });
  };

  const playSuper = () => {
    if (!sup) return;
    start({ theme: "super", title: sup.title, mode, players: quizPlayers(mode, party), questions: buildSuperRound(sup, categories), ladder: sup.ladder, safe: sup.safe });
  };

  const playDaily = () => {
    if (!daily) return;
    const owner = categories.find((c) => c.questions.some((q) => q.id === daily.id));
    start({ theme: owner?.id ?? "general", title: "Вопрос дня", mode: "solo", players: 1, questions: [daily], daily: true });
  };

  if (view.kind === "court" && court) return <CourtPlay court={court} onExit={() => setView({ kind: "hub" })} />;

  if (view.kind === "play") {
    const { config } = view;
    return (
      <QuizPlay
        key={view.key}
        config={config}
        onExit={() => setView({ kind: "hub" })}
        onAgain={() => {
          if (config.theme === "super") playSuper();
          else playCategory(config.theme);
        }}
        onFinish={config.daily ? (state) => saveDailyAnswer(state.results[0] === true) : undefined}
      />
    );
  }

  return (
    <ShowHub
      categories={categories}
      court={court}
      sup={sup}
      mode={mode}
      party={party}
      onMode={setMode}
      onParty={(n) => setParty(quizPlayers("party", n))}
      daily={daily}
      show={show}
      now={now}
      onDaily={playDaily}
      onCategory={playCategory}
      onSuper={playSuper}
      onCourt={() => setView({ kind: "court" })}
    />
  );
}
