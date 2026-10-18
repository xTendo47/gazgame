"use client";

// «Норм или стрём 🤔» (механика verdict): настройки → ситуация → все выбирают «норм» или «стрём» → ответы открываются разом → … → итог.
// Вдвоём экран делится пополам (верхняя половина перевёрнута), втроём и больше — чипы с именами и «Вскрываемся!».
// Логика — packages/engine/src/mechanics/verdict.ts, тексты и колоды — data/games/norm-or-cringe.json.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Plus, X } from "lucide-react";
import type { Deck, VerdictGame as VerdictData } from "@gazgame/content";
import {
  VERDICT_MAX_PLAYERS,
  VERDICT_MIN_PLAYERS,
  allVoted,
  cycleVerdict,
  deckAccess,
  nextVerdict,
  planVerdict,
  playerNames,
  revealVerdicts,
  setVerdict,
  startVerdict,
  summarizeVerdicts,
  tallyVerdicts,
  type Verdict,
  type VerdictState,
} from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/gaz";
import { haptic } from "@/lib/haptics";
import { tierFor, usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";

const usedKey = (game: VerdictData, deck: Deck) => `${game.id}/${deck.id}`;
const noopSubscribe = () => () => {};

/** Подставляет {pct}, {n}, {total} и т. п. */
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all));

/** Цвет ответа: норм — салатовый, стрём — оранжевый. */
const TONE: Record<Verdict, string> = { norm: "bg-lime text-bg", cringe: "bg-orange text-bg" };

/** Ситуации нового раунда без повторов с прошлыми (на устройстве хранятся тексты: номера могут сдвинуться при правке колоды). */
function planRound(game: VerdictData, deck: Deck) {
  const usedTexts = new Set(getProgress().getLastCards(usedKey(game, deck)));
  const used = deck.cards.flatMap((c, i) => (usedTexts.has(c.text) ? [i] : []));
  const plan = planVerdict(deck.cards.length, game.questionsPerGame, used);
  getProgress().saveLastCards(
    usedKey(game, deck),
    plan.used.map((i) => deck.cards[i]?.text ?? ""),
  );
  return plan;
}

export function VerdictGame({ game, related }: { game: VerdictData; related?: ReactNode }) {
  const router = useRouter();
  const premium = usePremium();
  const userTier = tierFor(premium);
  const t = game.texts;
  // ?deck=love&mode=duo — из Романтики сразу колода «Отношения» и двое игроков
  const query = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );
  const params = new URLSearchParams(query);
  const wantedDeck = game.decks.find((d) => d.id === params.get("deck") && deckAccess(d, { userTier }).open);
  const [pickedNames, setPickedNames] = useState<string[] | null>(null);
  const [pickedDeck, setPickedDeck] = useState<string | null>(null);
  const names = pickedNames ?? Array.from({ length: params.get("mode") === "duo" ? 2 : 3 }, () => "");
  const deckId = pickedDeck ?? wantedDeck?.id ?? game.decks[0]?.id ?? "";
  const [state, setState] = useState<VerdictState | null>(null);

  const deck = game.decks.find((d) => d.id === (state?.settings.deckId ?? deckId)) ?? (game.decks[0] as Deck);
  const phase = state?.phase;

  // Каждая новая ситуация и итог — с самого верха
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [phase, state?.index]);

  function chooseDeck(d: Deck) {
    if (!deckAccess(d, { userTier }).open) {
      haptic("double");
      trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
      router.push("/deeper");
      return;
    }
    setPickedDeck(d.id);
  }

  function launch(players: string[], d: Deck) {
    const plan = planRound(game, d);
    setState(startVerdict({ players, deckId: d.id }, plan.cards));
  }

  function vote(player: number, choice: Verdict | null) {
    if (!state) return;
    haptic(choice === null ? "click" : choice === "norm" ? "yes" : "no");
    const after = setVerdict(state, player, choice);
    // вдвоём ответы открываются сами, как только ответил второй
    if (after.votes.length === 2 && allVoted(after)) {
      haptic(after.votes[0] === after.votes[1] ? "win" : "hot");
      setState(revealVerdicts(after));
      return;
    }
    setState(after);
  }

  function reveal() {
    if (!state || !allVoted(state)) return;
    const next = revealVerdicts(state);
    const tally = tallyVerdicts(next.votes as Verdict[]);
    haptic(tally.unanimous ? "win" : "hot");
    setState(next);
  }

  function next() {
    if (!state) return;
    haptic("click");
    const after = nextVerdict(state);
    if (after.phase === "final") {
      haptic("win");
      getProgress().recordGamePlayed(game.id, { score: summarizeVerdicts(after.history, after.settings.players.length).percent });
    }
    setState(after);
  }

  // ---------- настройки ----------
  if (!state) {
    return (
      <div className="flex flex-col gap-5">
        <section aria-labelledby="vd-players" className="flex flex-col gap-3">
          <h2 id="vd-players" className="font-display text-xl font-bold">
            {t.playersTitle}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {names.map((name, i) => (
              <li key={i} className="flex items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-4">
                <label className="sr-only" htmlFor={`vd-player-${i}`}>
                  Игрок {i + 1}
                </label>
                <input
                  id={`vd-player-${i}`}
                  value={name}
                  maxLength={14}
                  size={9}
                  autoComplete="off"
                  placeholder={`Игрок ${i + 1}`}
                  onChange={(e) => setPickedNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                  className="min-h-11 w-28 bg-transparent text-base font-semibold placeholder:text-muted/70 focus:outline-none"
                />
                {names.length > VERDICT_MIN_PLAYERS && (
                  <button
                    type="button"
                    aria-label={`Убрать игрока ${i + 1}`}
                    onClick={() => setPickedNames(names.filter((_, j) => j !== i))}
                    className="flex size-11 items-center justify-center rounded-full text-muted hover:text-cream"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                )}
              </li>
            ))}
            {names.length < VERDICT_MAX_PLAYERS && (
              <li>
                <button
                  type="button"
                  onClick={() => setPickedNames([...names, ""])}
                  className="flex min-h-11 items-center gap-1 rounded-full border border-dashed border-lime/60 px-4 text-base font-bold text-lime"
                >
                  <Plus aria-hidden="true" size={16} />
                  {t.addPlayer.replace(/^\+\s*/, "")}
                </button>
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="vd-deck" className="flex flex-col gap-2">
          <h2 id="vd-deck" className="font-display text-base font-bold">
            {t.deck}
          </h2>
          <div role="radiogroup" aria-labelledby="vd-deck" className="flex flex-col gap-2">
            {game.decks.map((d) => {
              const open = deckAccess(d, { userTier }).open;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={deckId === d.id}
                  onClick={() => chooseDeck(d)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition",
                    deckId === d.id ? "border-lime bg-surface" : "border-line bg-surface",
                    !open && "diamond-glow",
                  )}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">
                    {d.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-display text-base font-bold">{d.title}</b>
                    {d.description && <small className="block text-[13px] text-muted">{d.description}</small>}
                  </span>
                  {!open && <Lock aria-label="Premium" size={18} className="shrink-0 text-[#62D2FF]" />}
                </button>
              );
            })}
          </div>
        </section>

        <Button variant="primary" onClick={() => launch(playerNames(names), deck)}>
          {t.go}
        </Button>
        {related}
      </div>
    );
  }

  const { players } = state.settings;

  // ---------- итог ----------
  if (state.phase === "final") {
    const sum = summarizeVerdicts(state.history, players.length);
    const total = state.history.length;
    const title = fill(game.finale.title, { pct: sum.percent });
    const link = `${window.location.origin}/game/${game.slug}`;
    const flex = fill(game.finale.flexText, { pct: sum.percent, link });
    const awards = [
      { label: game.finale.strictest, who: sum.strictest, n: sum.strictCount },
      { label: game.finale.kindest, who: sum.kindest, n: sum.kindCount },
    ].filter((a) => a.n > 0);
    return (
      <div className="flex flex-col gap-4">
        <section aria-live="polite" className="flex flex-col items-center gap-2 rounded-card bg-lime p-6 text-center text-bg">
          <div aria-hidden="true" className="text-6xl leading-none">
            {game.finale.emoji}
          </div>
          <h2 className="font-display text-3xl font-black text-balance">{title}</h2>
          <p className="text-sm font-extrabold uppercase tracking-wide">
            {deck.emoji} {deck.title}
          </p>
        </section>

        {awards.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {awards.map((a) => (
              <section key={a.label} className="flex flex-col items-center gap-1 rounded-card border border-line bg-surface p-4 text-center">
                <h3 className="font-display text-base font-bold">{a.label}</h3>
                <p className="font-display text-xl font-extrabold text-orange">{players[a.who]}</p>
                <p className="text-[13px] text-muted">{fill(game.finale.awardCount, { n: a.n, total })}</p>
              </section>
            ))}
          </div>
        )}

        <section aria-labelledby="vd-diverged" className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <h3 id="vd-diverged" className="font-display text-lg font-bold">
            {game.finale.diverged} <span className="text-[15px] font-semibold text-muted">· {game.finale.divergedHint}</span>
          </h3>
          {sum.diverged.length === 0 ? (
            <p className="text-[15px] text-cream/85">{game.finale.divergedEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {sum.diverged.map((i) => (
                <li key={i} className="flex flex-col gap-1.5">
                  <p className="text-[15px] font-semibold leading-snug">{deck.cards[state.cards[i] ?? -1]?.text}</p>
                  <p className="flex flex-wrap gap-1.5">
                    {players.map((p, pi) => {
                      const v = state.history[i]?.[pi];
                      return (
                        <span key={pi} className={cn("rounded-full px-2.5 py-1 text-[13px] font-bold", v ? TONE[v] : "bg-surface-2")}>
                          {p} {v === "norm" ? "👍" : "👎"}
                        </span>
                      );
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="primary" onClick={() => launch(players, deck)}>
          {game.finale.again} 🔄
        </Button>
        <Button variant="outline" onClick={() => setState(null)}>
          {game.finale.changeDeck}
        </Button>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={flex}
          card={{ label: game.title, emoji: game.finale.emoji, title, text: `${deck.emoji} ${deck.title}` }}
        />
        {/* «Слишком мирно? Без фильтра 💎» — с Premium звать некуда, всё уже открыто */}
        {deck.upsellText && !premium && (
          <Link
            href="/deeper"
            onClick={() => trackDeeperClick({ id: game.id, kind: "game", source: "game-over" })}
            className="diamond-glow min-h-11 self-center rounded-full bg-surface px-5 py-2.5 text-center text-[15px] font-semibold text-cream"
          >
            {deck.upsellText}
          </Link>
        )}
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- ситуация ----------
  const situation = deck.cards[state.cards[state.index] ?? -1]?.text ?? "";
  const progress = fill(t.progress, { n: state.index + 1, total: state.cards.length });
  const revealed = state.phase === "reveal";
  const tally = tallyVerdicts(state.votes.filter((v): v is Verdict => v !== null));

  if (players.length === 2) {
    const matched = revealed && state.votes[0] === state.votes[1];
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm font-bold text-muted">
          {progress} · {deck.emoji} {deck.title}
        </p>
        <div className="flex flex-col gap-2" style={{ minHeight: "min(34rem, calc(100dvh - 14rem))" }}>
          <Half game={game} situation={situation} choice={state.votes[1] ?? null} revealed={revealed} flipped onVote={(c) => vote(1, c)} name={players[1] ?? ""} />
          <div aria-live="polite" className="flex min-h-14 items-center justify-center gap-3">
            {revealed ? (
              <>
                <b className={cn("font-display text-xl font-black", matched ? "text-lime" : "text-orange")}>{matched ? t.matched : t.clash}</b>
                <Button variant="primary" size="md" onClick={next}>
                  {t.next}
                </Button>
              </>
            ) : (
              <span className="text-sm text-muted">{game.title} 🤔</span>
            )}
          </div>
          <Half game={game} situation={situation} choice={state.votes[0] ?? null} revealed={revealed} onVote={(c) => vote(0, c)} name={players[0] ?? ""} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm font-bold text-muted">
        {progress} · {deck.emoji} {deck.title}
      </p>
      <section className="flex min-h-40 items-center justify-center rounded-card border-2 border-line bg-surface p-6 text-center">
        <h2 className="font-display text-2xl font-extrabold leading-tight text-balance">{situation}</h2>
      </section>

      {!revealed && <p className="text-center text-[15px] text-muted">{t.chipsHint}</p>}
      <ul className="flex flex-wrap justify-center gap-2">
        {players.map((p, i) => {
          const v = state.votes[i] ?? null;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={revealed}
                aria-label={revealed ? `${p}: ${v === "norm" ? "норм" : "стрём"}` : `${p}: ${v ? "ответил" : "не ответил"}`}
                onClick={() => vote(i, cycleVerdict(v))}
                className={cn(
                  "gaz-press flex min-h-12 items-center gap-2 rounded-full border-2 px-4 font-display text-base font-extrabold transition",
                  revealed && v ? `${TONE[v]} border-transparent` : v ? "border-lime bg-surface text-cream" : "border-line bg-surface text-cream",
                )}
              >
                {p}
                <span aria-hidden="true">{revealed ? (v === "norm" ? "👍" : "👎") : v ? "✓" : ""}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {revealed ? (
        <>
          <div aria-live="polite" className="flex flex-col items-center gap-2 text-center">
            <p className="font-display text-xl font-bold">{fill(t.count, { norm: tally.norm, cringe: tally.cringe })}</p>
            {tally.unanimous && <b className="rounded-full bg-lime px-4 py-1.5 font-display text-base font-black text-bg">{t.unanimous}</b>}
            {tally.contested && <b className="rounded-full bg-orange px-4 py-1.5 font-display text-base font-black text-bg">{t.contested}</b>}
          </div>
          <Button variant="primary" onClick={next}>
            {t.next}
          </Button>
        </>
      ) : (
        <Button variant="primary" disabled={!allVoted(state)} onClick={reveal}>
          {t.reveal}
        </Button>
      )}
    </div>
  );
}

/** Половина экрана вдвоём: ситуация и две кнопки; после выбора «Готово ✓», после вскрытия — цвет ответа. flipped — перевёрнута на 180°. */
function Half({
  game,
  situation,
  choice,
  revealed,
  flipped,
  name,
  onVote,
}: {
  game: VerdictData;
  situation: string;
  choice: Verdict | null;
  revealed: boolean;
  flipped?: boolean;
  name: string;
  onVote: (choice: Verdict | null) => void;
}) {
  const done = choice !== null;
  return (
    <section
      aria-label={name}
      className={cn(
        "flex flex-1 flex-col justify-between gap-3 rounded-card p-4 text-center transition-colors",
        revealed && choice ? TONE[choice] : "border-2 border-line bg-surface",
        flipped && "rotate-180",
      )}
    >
      <p className={cn("text-xs font-bold uppercase tracking-wide", revealed && choice ? "text-bg/70" : "text-muted")}>{name}</p>
      <h2 className="font-display text-xl font-extrabold leading-tight text-balance">{situation}</h2>
      {revealed && choice ? (
        <p className="font-display text-2xl font-black">{choice === "norm" ? game.buttons.norm : game.buttons.cringe}</p>
      ) : done ? (
        <button type="button" onClick={() => onVote(null)} className="min-h-14 rounded-2xl bg-surface-2 font-display text-lg font-extrabold text-lime">
          {game.texts.ready}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onVote("norm")} className="gaz-press min-h-14 rounded-2xl bg-lime px-2 font-display text-lg font-extrabold text-bg">
            {game.buttons.norm}
          </button>
          <button type="button" onClick={() => onVote("cringe")} className="gaz-press min-h-14 rounded-2xl bg-orange px-2 font-display text-lg font-extrabold text-bg">
            {game.buttons.cringe}
          </button>
        </div>
      )}
    </section>
  );
}
