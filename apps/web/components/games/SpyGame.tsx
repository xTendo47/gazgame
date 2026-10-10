"use client";

// «Шпион» (mechanic: spy): у всех одна карта из набора, у шпиона (или двух) — «Ты шпион». Один телефон, имён нет.
// Старт → набор → сколько вас → раздача → игра (таймер, «Голосуем», «Шпион раскрывается») → финал.
// Колода, карты, степпер, таймер и строки «под замком» — общие с «Мафией».
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import type { SpyGame as SpyGameData } from "@gazgame/content";
import {
  createSpyMatch,
  dealSpy,
  defaultSpies,
  defaultTimerSec,
  isActiveSpy,
  maxSpies,
  pickSpyCard,
  pickStarter,
  spyGuess,
  spyTimeOut,
  spyVote,
  type SpyMatch,
  type SpyPick,
  type UsedSpyCards,
} from "@gazgame/engine";
import { Button, Tile, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";
import { Dealer } from "./mafia/Dealer";
import { formatTimer, useCountdown } from "./mafia/DiscussionTimer";
import { CardBack } from "./mafia/RoleCard";
import { LockedExtras, Stepper } from "./mafia/parts";
import { SpyCardFace, WordCardFace } from "./spy/SpyCard";

type Stage = "start" | "rules" | "deck" | "players" | "deal" | "play" | "vote" | "reveal" | "final";

/** Подставляет {n}, {title} и т.п. */
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all));

/** Сыгранные карты хранятся на устройстве по каждому набору. */
const usedKey = (gameId: string, deckId: string) => `${gameId}/${deckId}`;

function loadUsed(game: SpyGameData): UsedSpyCards {
  const progress = getProgress();
  return Object.fromEntries(game.decks.map((d) => [d.id, progress.getLastCards(usedKey(game.id, d.id))]));
}

function saveUsed(game: SpyGameData, before: UsedSpyCards, after: UsedSpyCards) {
  const progress = getProgress();
  for (const [deckId, ids] of Object.entries(after)) {
    if (ids !== before[deckId]) progress.saveLastCards(usedKey(game.id, deckId), ids);
  }
}

export function SpyGame({ game, related }: { game: SpyGameData; related?: ReactNode }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("start");
  const [choice, setChoice] = useState<string | null>(null);
  const [players, setPlayers] = useState(Math.max(game.players.min, 5));
  const [spies, setSpies] = useState(() => defaultSpies(game, players));
  const [timerSec, setTimerSec] = useState(() => defaultTimerSec(game, players));
  const [pick, setPick] = useState<SpyPick | null>(null);
  const [cards, setCards] = useState<boolean[]>([]);
  const [starter, setStarter] = useState(0);
  const [match, setMatch] = useState<SpyMatch>(() => createSpyMatch([]));
  /** Строка над таймером после поимки первого из двух шпионов или «Ты не шпион». */
  const [notice, setNotice] = useState<string | null>(null);
  /** Номер раздачи — чтобы «Ещё партия» начинала раздачу с первой карты. */
  const [dealId, setDealId] = useState(0);
  /** Шёл ли таймер до «Голосуем» / «Шпион раскрывается» — тогда после них он идёт дальше. */
  const [resume, setResume] = useState(false);
  const timer = useCountdown(timerSec);

  const openDeeper = () => {
    trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
    router.push("/deeper");
  };

  /** Меняем число игроков — шпионы и таймер по умолчанию пересчитываются. */
  function changePlayers(n: number) {
    setPlayers(n);
    setSpies(defaultSpies(game, n));
    setTimerSec(defaultTimerSec(game, n));
  }

  /** Новая партия: новая карта без повторов, новая раздача с первой карты. */
  function deal(deckChoice = choice) {
    if (!deckChoice) return;
    const used = loadUsed(game);
    const next = pickSpyCard(game, deckChoice, used);
    saveUsed(game, used, next.used);
    const dealt = dealSpy(players, spies);
    setPick(next);
    setCards(dealt);
    setStarter(pickStarter(players));
    setMatch(createSpyMatch(dealt));
    setNotice(null);
    timer.reset(timerSec);
    setDealId(dealId + 1);
    setStage("deal");
  }

  /** Итог хода: победитель — финал, иначе обратно в игру (и таймер дальше). */
  function apply(next: SpyMatch, message: string | null) {
    setMatch(next);
    if (next.outcome) {
      timer.pause();
      getProgress().recordGamePlayed(game.id);
      setStage("final");
      return;
    }
    setNotice(message);
    setStage("play");
    if (resume && timer.left > 0) timer.start();
  }

  const deckOfCard = game.decks.find((d) => d.id === pick?.deckId);
  const card = pick?.card;

  // ---------- Старт и правила ----------
  if (stage === "start") {
    return (
      <section className="flex flex-col gap-4">
        <p className="rounded-card bg-surface p-5 text-center font-display text-xl font-bold leading-snug">{game.texts.start}</p>
        <Button variant="primary" onClick={() => setStage("deck")}>
          Играть 🕵️
        </Button>
        <Button variant="ghost" onClick={() => setStage("rules")}>
          Правила
        </Button>
      </section>
    );
  }

  if (stage === "rules") {
    return (
      <section aria-labelledby="spy-rules" className="flex flex-col gap-4">
        <h2 id="spy-rules" className="font-display text-2xl font-bold">
          Правила
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <Button variant="primary" onClick={() => setStage("deck")}>
          Играть 🕵️
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("start")}>
          ← Назад
        </Button>
      </section>
    );
  }

  // ---------- Набор ----------
  if (stage === "deck") {
    const tiles = [
      ...game.decks.map((d) => ({ id: d.id, emoji: d.emoji, title: d.title, subtitle: d.examples.join(" · ") || undefined })),
      { id: game.mix.id, emoji: game.mix.emoji, title: game.mix.title, subtitle: undefined },
    ];
    return (
      <section aria-labelledby="spy-deck" className="flex flex-col gap-3">
        <h2 id="spy-deck" className="font-display text-2xl font-bold">
          {game.texts.pickDeck}
        </h2>
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className="group block rounded-card text-left"
            aria-pressed={choice === t.id}
            onClick={() => {
              setChoice(t.id);
              setStage("players");
            }}
          >
            <Tile emoji={t.emoji} title={t.title} subtitle={t.subtitle} accent={t.id === game.mix.id ? "lime" : "orange"} size="md" />
          </button>
        ))}
        <LockedExtras extras={game.lockedExtras} lockedText={game.lockedText} onOpen={openDeeper} />
        <Button variant="ghost" size="md" onClick={() => setStage("start")}>
          ← Назад
        </Button>
      </section>
    );
  }

  // ---------- Сколько вас ----------
  if (stage === "players") {
    const chosen = choice === game.mix.id ? game.mix : game.decks.find((d) => d.id === choice);
    const spiesMax = maxSpies(game, players);
    return (
      <section aria-labelledby="spy-players" className="flex flex-col gap-4">
        <h2 id="spy-players" className="font-display text-2xl font-bold">
          Сколько вас?
        </h2>
        {chosen && (
          <p className="-mt-2 text-muted">
            Набор: {chosen.title} {chosen.emoji}
          </p>
        )}
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <Stepper label="Игроков" value={players} min={game.players.min} max={game.players.max} onChange={changePlayers} big />
          <p className="text-center text-sm text-muted">{game.playersHint}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <h3 className="font-display text-base font-bold">Шпионов</h3>
          <div role="radiogroup" aria-label="Шпионов" className="grid grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <Button
                key={n}
                role="radio"
                aria-checked={spies === n}
                variant={spies === n ? "primary" : "ghost"}
                size="md"
                className={cn(spies !== n && "bg-surface-2")}
                disabled={n > spiesMax}
                onClick={() => setSpies(n)}
              >
                {"🕵️".repeat(n)} {n}
              </Button>
            ))}
          </div>
          <p className="text-center text-sm text-muted">{game.spies.hint}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <h3 className="font-display text-base font-bold">Таймер ⏱️</h3>
          <Stepper
            label="Таймер"
            value={timerSec}
            min={game.timer.minSec}
            max={game.timer.maxSec}
            step={game.timer.stepSec}
            format={formatTimer}
            onChange={setTimerSec}
          />
        </div>
        <Button variant="primary" onClick={() => deal()}>
          Раздать 🃏
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("deck")}>
          ← Набор
        </Button>
      </section>
    );
  }

  if (!card || !deckOfCard) return null;
  const startsText = fill(game.texts.starts, { n: starter + 1 });
  const deckLabel = fill(game.texts.deckLabel, { title: deckOfCard.title, emoji: deckOfCard.emoji });
  const numbers = (onPick: (player: number) => void) => (
    <PlayerGrid players={players} disabled={match.caught} onPick={onPick} />
  );

  // ---------- Раздача ----------
  if (stage === "deal") {
    return (
      <Dealer
        key={dealId}
        total={cards.length}
        face={(i) =>
          cards[i] ? (
            <SpyCardFace title={game.texts.spyTitle} hint={game.texts.spyHint} />
          ) : (
            <WordCardFace emoji={card.emoji} title={card.title} hint={game.texts.wordHint} />
          )
        }
        faceLabel={(i) => (cards[i] ? game.texts.spyTitle : `Твоя карта: ${card.title}`)}
        texts={{ deal: game.texts.deal, hide: game.texts.hide, pass: game.texts.pass, cardBack: game.texts.cardBack }}
        done={
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center">
              <div aria-hidden="true" className="text-6xl">
                🎯
              </div>
              <p className="font-display text-2xl font-bold leading-snug">{fill(game.texts.dealt, { n: starter + 1 })}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setStage("play");
                timer.start();
              }}
            >
              Поехали ⏱️
            </Button>
          </div>
        }
      />
    );
  }

  // ---------- Голосуем ----------
  if (stage === "vote") {
    return (
      <VoteScreen
        key={`vote-${match.caught.length}`}
        title={game.texts.vote}
        hint={game.texts.voteHint}
        game={game}
        match={match}
        card={card}
        grid={numbers}
        onDone={(player) => apply(spyVote(match, player), game.texts.oneCaught)}
        onCancel={() => apply(match, notice)}
      />
    );
  }

  // ---------- Шпион раскрывается ----------
  if (stage === "reveal") {
    return (
      <RevealScreen
        game={game}
        match={match}
        grid={numbers}
        onNotSpy={() => apply(match, game.texts.revealNotSpy)}
        onGuess={(player, guessed) => apply(spyGuess(match, player, guessed), game.texts.oneCaught)}
        onCancel={() => apply(match, notice)}
      />
    );
  }

  // ---------- Финал ----------
  if (stage === "final") {
    const cityWon = match.outcome?.winner === "city";
    const title = cityWon ? game.texts.cityWins : game.texts.spyWins;
    const flex = fill(cityWon ? game.texts.flexCity : game.texts.flexSpy, { title: card.title, emoji: card.emoji });
    const spyNumbers = match.spies.map((i) => i + 1);
    return (
      <div className="flex flex-col gap-4">
        <section
          aria-live="polite"
          className={cn("flex flex-col items-center gap-3 rounded-card p-8 text-center", cityWon ? "bg-lime text-bg" : "bg-[#B3132B] text-cream")}
        >
          <div aria-hidden="true" className="text-7xl leading-none">
            {cityWon ? "🎯" : "🕵️"}
          </div>
          <h2 className="font-display text-3xl font-black leading-tight">{title}</h2>
          {match.outcome?.winner === "spy" && match.outcome.reason === "wrong-vote" && (
            <p className="font-semibold">{game.texts.wrongVote}</p>
          )}
        </section>
        <section className="flex flex-col gap-1 rounded-card bg-surface p-5 text-center">
          <p className="font-display text-xl font-bold">{fill(game.texts.finalCard, { emoji: card.emoji, title: card.title })}</p>
          <p className="text-muted">
            {spyNumbers.length === 1
              ? fill(game.texts.finalSpy, { n: spyNumbers[0] ?? 1 })
              : fill(game.texts.finalSpies, { a: spyNumbers[0] ?? 1, b: spyNumbers[1] ?? 2 })}
          </p>
        </section>
        <Button variant="primary" onClick={() => deal()}>
          {game.texts.again}
        </Button>
        <Button variant="outline" onClick={() => setStage("deck")}>
          {game.texts.changeDeck}
        </Button>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={flex}
          card={{ label: game.title, emoji: cityWon ? "🎯" : "🕵️", title, text: flex }}
        />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- Игра ----------
  const timeUp = timer.left === 0;
  if (timeUp) {
    return (
      <VoteScreen
        key={`timeup-${match.caught.length}`}
        title={game.texts.timeUp}
        hint={game.texts.voteHint}
        notice={notice}
        game={game}
        match={match}
        card={card}
        grid={numbers}
        onDone={(player) => apply(spyVote(match, player), game.texts.oneCaught)}
        extra={
          <Button variant="ghost" size="md" onClick={() => apply(spyTimeOut(match), null)}>
            {game.texts.noVote}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-xl font-bold">{startsText}</p>
        <p className="text-muted">{deckLabel}</p>
      </div>
      {notice && (
        <p role="status" className="rounded-card border-2 border-lime bg-surface p-4 text-center font-display text-lg font-bold">
          {notice}
        </p>
      )}
      <section aria-label="Таймер" className="flex flex-col items-center gap-3 rounded-card bg-surface p-6">
        <div role="timer" className="font-display text-7xl font-black tabular-nums">
          {formatTimer(timer.left)}
        </div>
        <Button variant="ghost" size="md" className="w-auto bg-surface-2 px-6" onClick={timer.running ? timer.pause : timer.start}>
          {timer.running ? (
            <>
              <Pause aria-hidden="true" size={18} /> Пауза
            </>
          ) : (
            <>
              <Play aria-hidden="true" size={18} /> Дальше
            </>
          )}
        </Button>
      </section>
      <Button
        variant="primary"
        onClick={() => {
          setResume(timer.running);
          timer.pause();
          setStage("vote");
        }}
      >
        {game.texts.vote}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setResume(timer.running);
          timer.pause();
          setStage("reveal");
        }}
      >
        {game.texts.reveal}
      </Button>
    </div>
  );
}

// ---------- Номера игроков ----------

function PlayerGrid({ players, disabled, onPick }: { players: number; disabled: readonly number[]; onPick: (player: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: players }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Игрок ${i + 1}`}
          disabled={disabled.includes(i)}
          onClick={() => onPick(i)}
          className="flex min-h-16 items-center justify-center rounded-card bg-surface-2 font-display text-2xl font-black transition active:scale-95 disabled:opacity-30"
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// ---------- Голосование: выбрали номер → его карта переворачивается ----------

function VoteScreen({
  title,
  hint,
  notice,
  game,
  match,
  card,
  grid,
  onDone,
  onCancel,
  extra,
}: {
  title: string;
  hint: string;
  notice?: string | null;
  game: SpyGameData;
  match: SpyMatch;
  card: { emoji: string; title: string };
  grid: (onPick: (player: number) => void) => ReactNode;
  onDone: (player: number) => void;
  onCancel?: () => void;
  extra?: ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  if (picked === null) {
    return (
      <section aria-labelledby="spy-vote" className="flex flex-col gap-4">
        <h2 id="spy-vote" className="font-display text-2xl font-bold">
          {title}
        </h2>
        {notice && <p className="font-semibold text-lime">{notice}</p>}
        <p className="text-muted">{hint}</p>
        {grid(setPicked)}
        {extra}
        {onCancel && (
          <Button variant="ghost" size="md" onClick={onCancel}>
            ← Назад в игру
          </Button>
        )}
      </section>
    );
  }

  const spy = isActiveSpy(match, picked);
  return (
    <MotionConfig reducedMotion="user">
      <section aria-live="polite" className="flex flex-col items-center gap-5">
        <h2 className="font-display text-2xl font-bold">Игрок {picked + 1}</h2>
        <div className="w-full max-w-64" style={{ perspective: 1200 }}>
          <motion.button
            type="button"
            aria-label={flipped ? (spy ? game.texts.isSpy : game.texts.notSpy) : "Перевернуть карту"}
            disabled={flipped}
            onClick={() => setFlipped(true)}
            className="relative block w-full rounded-[22px] text-left"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <CardBack label={game.texts.cardBack} style={{ backfaceVisibility: "hidden" }} />
            <div className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
              {spy ? <SpyCardFace title={game.texts.isSpy} /> : <WordCardFace emoji={card.emoji} title={game.texts.notSpy} />}
            </div>
          </motion.button>
        </div>
        {flipped ? (
          <Button variant="primary" onClick={() => onDone(picked)}>
            Дальше 👉
          </Button>
        ) : (
          <>
            <Button variant="primary" onClick={() => setFlipped(true)}>
              Перевернуть 🃏
            </Button>
            <Button variant="ghost" size="md" onClick={() => setPicked(null)}>
              ← Другой номер
            </Button>
          </>
        )}
      </section>
    </MotionConfig>
  );
}

// ---------- Шпион раскрывается ----------

function RevealScreen({
  game,
  match,
  grid,
  onNotSpy,
  onGuess,
  onCancel,
}: {
  game: SpyGameData;
  match: SpyMatch;
  grid: (onPick: (player: number) => void) => ReactNode;
  onNotSpy: () => void;
  onGuess: (player: number, guessed: boolean) => void;
  onCancel: () => void;
}) {
  const [spy, setSpy] = useState<number | null>(null);

  if (spy === null) {
    return (
      <section aria-labelledby="spy-reveal" className="flex flex-col gap-4">
        <h2 id="spy-reveal" className="font-display text-2xl font-bold">
          {game.texts.revealWho}
        </h2>
        {grid((player) => (isActiveSpy(match, player) ? setSpy(player) : onNotSpy()))}
        <Button variant="ghost" size="md" onClick={onCancel}>
          ← Назад в игру
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="spy-say" className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-card bg-[#B3132B] p-8 text-center text-cream">
        <div aria-hidden="true" className="text-6xl leading-none">
          🕵️
        </div>
        <h2 id="spy-say" className="font-display text-2xl font-black leading-tight">
          {game.texts.revealSay}
        </h2>
        <p className="font-semibold">Игрок {spy + 1}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="primary" onClick={() => onGuess(spy, true)}>
          {game.texts.guessed}
        </Button>
        <Button variant="outline" onClick={() => onGuess(spy, false)}>
          {game.texts.missed}
        </Button>
      </div>
    </section>
  );
}
