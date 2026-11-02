"use client";

// Раздел GAZ GAME $HOW (квиз): хаб → раунд (категория, супер-квиз, вопрос дня) → итоги, или «Суд присяжных».
// Режим (соло / вдвоём / компания) выбирается на хабе. Вопросы приходят готовыми из data/quiz/*.json (страница /show).
import { useState } from "react";
import type { QuizArtist, QuizCategory, QuizCourt, QuizFile, QuizQuestion, QuizSuper } from "@gazgame/content";
import { QUIZ_PARTY_MAX, QUIZ_PARTY_MIN, buildArtistRound, buildRound, buildSuperRound, dailyQuestion, nextSeen, quizPlayers, shuffleOptions, type QuizMode } from "@gazgame/engine";
import { readQuizSeen, writeQuizSeen } from "@/lib/quiz-seen";
import { useNow } from "@/lib/gaz";
import { BackTag, Button } from "@gazgame/ui";
import { PlayersForm } from "@/components/games/PlayersForm";
import { getProgress } from "@/lib/progress";
import { saveDailyAnswer, useShowData } from "@/lib/show";
import { ArtistPicker } from "./ArtistPicker";
import { CourtPlay } from "./CourtPlay";
import { QuizPlay, type QuizRoundConfig } from "./QuizPlay";
import { ShowHub } from "./ShowHub";

/** Ключ сохранённых имён игроков $HOW на устройстве. */
const NAMES_KEY = "show";

type View = { kind: "hub" } | { kind: "names"; make: (names?: string[]) => void } | { kind: "play"; config: QuizRoundConfig; key: number } | { kind: "court" } | { kind: "artists" };

/** Порядок артистов в списке (как задал основатель); незнакомые — в конце по алфавиту. */
const ARTIST_ORDER = ["big-baby-tape", "kizaru", "scriptonite", "basta", "lsp", "saluki", "madk1d", "friendly-thug-52-ngg", "og-buda", "eminem", "drake", "playboi-carti", "ye"];
const artistRank = (slug: string) => (ARTIST_ORDER.includes(slug) ? ARTIST_ORDER.indexOf(slug) : ARTIST_ORDER.length);

export function ShowScreen({ quiz, artists: artistFiles, serverMs }: { quiz: QuizFile[]; artists: QuizArtist[]; serverMs: number }) {
  const artists = [...artistFiles].sort((a, b) => artistRank(a.slug) - artistRank(b.slug) || a.name.localeCompare(b.name));
  const categories = quiz.filter((q): q is QuizCategory => q.kind === "category");
  const sup = quiz.find((q): q is QuizSuper => q.kind === "super");
  const court = quiz.find((q): q is QuizCourt => q.kind === "court");
  const ranks = quiz.find((q) => q.kind === "artist-ranks");
  const [mode, setMode] = useState<QuizMode>("solo");
  const [party, setParty] = useState(4);
  const [view, setView] = useState<View>({ kind: "hub" });
  const show = useShowData();
  const now = useNow(serverMs);
  const daily = dailyQuestion(categories, now);

  /** Запомнить показанные вопросы раунда (id в localStorage): в следующий раз будут другие; кончился банк уровня — круг начнётся заново. */
  const banks = [...categories, ...artists.map((a) => ({ id: a.slug, questions: a.questions }))];
  const remember = (questions: QuizQuestion[]) => writeQuizSeen(nextSeen(banks, questions, readQuizSeen()));

  const start = (config: QuizRoundConfig) => setView((v) => ({ kind: "play", config, key: (v.kind === "play" ? v.key : 0) + 1 }));

  /** Компания: сначала имена игроков, остальные режимы стартуют сразу. */
  const begin = (make: (names?: string[]) => void) => {
    if (mode === "party") setView({ kind: "names", make });
    else make();
  };

  const playCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    begin((names) => start({ theme: id, title: category.title, mode, players: names?.length ?? quizPlayers(mode, party), names, questions: (() => { const round = buildRound(category, Math.random, readQuizSeen()); remember(round); return round; })() }));
  };

  const playArtist = (slug: string) => {
    const artist = artists.find((a) => a.slug === slug);
    if (!artist) return;
    begin((names) =>
      start({
        theme: "artist",
        title: artist.name,
        mode,
        players: names?.length ?? quizPlayers(mode, party),
        names,
        questions: (() => {
          const round = buildArtistRound({ id: artist.slug, questions: artist.questions }, Math.random, readQuizSeen());
          remember(round);
          return round;
        })(),
        artist: { slug, ranks: ranks?.kind === "artist-ranks" ? ranks.ranks : [] },
      }),
    );
  };

  const playSuper = () => {
    if (!sup) return;
    begin((names) => start({ theme: "super", title: sup.title, mode, players: names?.length ?? quizPlayers(mode, party), names, questions: (() => { const round = buildSuperRound(sup, categories, Math.random, readQuizSeen()); remember(round); return round; })(), ladder: sup.ladder, safe: sup.safe }));
  };

  const playDaily = () => {
    if (!daily) return;
    const owner = categories.find((c) => c.questions.some((q) => q.id === daily.id));
    start({ theme: owner?.id ?? "general", title: "Вопрос дня", mode: "solo", players: 1, questions: [shuffleOptions(daily)], daily: true });
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

  if (view.kind === "artists")
    return (
      <ArtistPicker
        artists={artists}
        mode={mode}
        onBack={() => setView({ kind: "hub" })}
        onPick={(slug) => playArtist(slug)}
      />
    );

  if (view.kind === "court" && court) return <CourtPlay court={court} onExit={() => setView({ kind: "hub" })} />;

  if (view.kind === "play") {
    const { config } = view;
    return (
      <QuizPlay
        key={view.key}
        config={config}
        onExit={() => setView({ kind: "hub" })}
        onAgain={() => {
          if (config.artist) playArtist(config.artist.slug);
          else if (config.theme === "super") playSuper();
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
      onArtists={artists.length > 0 ? () => setView({ kind: "artists" }) : undefined}
    />
  );
}
