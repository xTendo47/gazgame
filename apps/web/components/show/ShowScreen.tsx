"use client";

// Раздел GAZ GAME $HOW (квиз): хаб → раунд (категория, супер-квиз, вопрос дня) → итоги, или «Суд присяжных».
// Режим (соло / вдвоём / компания) выбирается на хабе. Вопросы приходят готовыми из data/quiz/*.json (страница /show).
import { useState } from "react";
import type { QuizCategory, QuizCourt, QuizFile, QuizSuper } from "@gazgame/content";
import { QUIZ_PARTY_MAX, QUIZ_PARTY_MIN, buildRound, buildSuperRound, dailyQuestion, quizPlayers, type QuizMode } from "@gazgame/engine";
import { useNow } from "@/lib/gaz";
import { BackTag, Button } from "@gazgame/ui";
import { PlayersForm } from "@/components/games/PlayersForm";
import { getProgress } from "@/lib/progress";
import { saveDailyAnswer, useShowData } from "@/lib/show";
import { CourtPlay } from "./CourtPlay";
import { QuizPlay, type QuizRoundConfig } from "./QuizPlay";
import { ShowHub } from "./ShowHub";

/** Ключ сохранённых имён игроков $HOW на устройстве. */
const NAMES_KEY = "show";

type View = { kind: "hub" } | { kind: "names"; make: (names?: string[]) => void } | { kind: "play"; config: QuizRoundConfig; key: number } | { kind: "court" };

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

  /** Компания: сначала имена игроков, остальные режимы стартуют сразу. */
  const begin = (make: (names?: string[]) => void) => {
    if (mode === "party") setView({ kind: "names", make });
    else make();
  };

  const playCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    begin((names) => start({ theme: id, title: category.title, mode, players: names?.length ?? quizPlayers(mode, party), names, questions: buildRound(category) }));
  };

  const playSuper = () => {
    if (!sup) return;
    begin((names) => start({ theme: "super", title: sup.title, mode, players: names?.length ?? quizPlayers(mode, party), names, questions: buildSuperRound(sup, categories), ladder: sup.ladder, safe: sup.safe }));
  };

  const playDaily = () => {
    if (!daily) return;
    const owner = categories.find((c) => c.questions.some((q) => q.id === daily.id));
    start({ theme: owner?.id ?? "general", title: "Вопрос дня", mode: "solo", players: 1, questions: [daily], daily: true });
  };

  if (view.kind === "names") {
    const saved = getProgress().getPlayers(NAMES_KEY) ?? [];
    return (
      <div className="sw-page">
        <div className="sw-inner">
          <BackTag onClick={() => setView({ kind: "hub" })}>← В студию</BackTag>
          <PlayersForm
            min={QUIZ_PARTY_MIN}
            max={QUIZ_PARTY_MAX}
            initial={saved.length >= QUIZ_PARTY_MIN ? saved : Array.from({ length: party }, () => "")}
            placeholders={[]}
            onSubmit={(names) => {
              getProgress().savePlayers(NAMES_KEY, names);
              view.make(names);
            }}
          />
          <Button variant="ghost" size="md" onClick={() => view.make()}>
            Играть без имён
          </Button>
        </div>
      </div>
    );
  }

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
