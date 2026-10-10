"use client";

// «Мафия» (mechanic: mafia): раздатчик ролей, таймер и подсчёт победы. Один телефон, имён нет.
// Старт → сколько вас → состав → раздача карт → ведущий (роли, шпаргалка, таймер, «Кто выбыл?») → финал.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import type { MafiaGame as MafiaGameData, MafiaRole } from "@gazgame/content";
import {
  aliveByRole,
  aliveSides,
  checkLineup,
  civilianRole,
  configurableRoles,
  createMatch,
  dealRoles,
  defaultLineup,
  eliminate,
  hostRole,
  undoElimination,
  winner,
  type Lineup,
  type LineupProblem,
  type MafiaMatch,
} from "@gazgame/engine";
import { Button, buttonVariants, cn } from "@gazgame/ui";
import { trackDeeperClick } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";
import { FlexMenu } from "../result/FlexMenu";
import { CardFace } from "./mafia/RoleCard";
import { Dealer } from "./mafia/Dealer";
import { DiscussionTimer } from "./mafia/DiscussionTimer";
import { LockedExtras, Stepper } from "./mafia/parts";

type Stage = "start" | "rules" | "roles" | "players" | "lineup" | "deal" | "host" | "final";

const PROBLEM_TEXT: Record<LineupProblem, string> = {
  "too-many-roles": "Ролей больше, чем игроков: убери кого-нибудь или добавь игроков",
  "no-mafia": "Нужна хотя бы одна мафия 🔪",
  "mafia-majority": "Мафии слишком много: её должно быть меньше, чем остальных игроков",
};

export function MafiaGame({ game, related }: { game: MafiaGameData; related?: ReactNode }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("start");
  const [total, setTotal] = useState(Math.max(game.players.min, 8));
  const [host, setHost] = useState(0);
  const [lineup, setLineup] = useState<Lineup>(() => defaultLineup(game, total - host));
  const [cards, setCards] = useState<string[]>([]);
  const [match, setMatch] = useState<MafiaMatch>(() => createMatch([]));
  /** Номер раздачи — чтобы «Ещё партия» начинала раздачу с первой карты. */
  const [dealId, setDealId] = useState(0);

  const role = (id: string) => game.roles.find((r) => r.id === id) as MafiaRole;
  const openDeeper = () => {
    trackDeeperClick({ id: game.id, kind: "game", source: "locked-deck" });
    router.push("/deeper");
  };

  /** Меняем число игроков или ведущего — состав по умолчанию пересчитывается. */
  function setPeople(nextTotal: number, nextHost: number) {
    setTotal(nextTotal);
    setHost(nextHost);
    setLineup(defaultLineup(game, nextTotal - nextHost));
  }

  function deal() {
    const next = dealRoles(game, total, host, lineup);
    setCards(next);
    setMatch(createMatch(next));
    setDealId(dealId + 1);
    setStage("deal");
  }

  function onEliminate(next: MafiaMatch) {
    setMatch(next);
    if (winner(game, next)) {
      getProgress().recordGamePlayed(game.id);
      setStage("final");
    }
  }

  // ---------- Старт, правила, роли ----------
  if (stage === "start") {
    return (
      <section className="flex flex-col gap-4">
        <p className="rounded-card bg-surface p-5 text-center font-display text-xl font-bold leading-snug">{game.texts.start}</p>
        <Button variant="primary" onClick={() => setStage("players")}>
          Играть 🔪
        </Button>
        <Button variant="ghost" onClick={() => setStage("rules")}>
          Правила
        </Button>
        <Button variant="outline" onClick={() => setStage("roles")}>
          Объяснить роли
        </Button>
      </section>
    );
  }

  if (stage === "rules") {
    return (
      <section aria-labelledby="mafia-rules" className="flex flex-col gap-4">
        <h2 id="mafia-rules" className="font-display text-2xl font-bold">
          Правила
        </h2>
        <ol className="flex list-inside list-decimal flex-col gap-2 rounded-card bg-surface p-5 leading-snug marker:font-bold marker:text-lime">
          {game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <Button variant="primary" onClick={() => setStage("players")}>
          Играть 🔪
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("start")}>
          ← Назад
        </Button>
      </section>
    );
  }

  if (stage === "roles") {
    return (
      <section aria-labelledby="mafia-roles" className="flex flex-col gap-4">
        <h2 id="mafia-roles" className="font-display text-2xl font-bold">
          Роли
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {game.roles.map((r) => (
            <CardFace key={r.id} role={r} compact className="max-w-none" />
          ))}
        </div>
        <LockedExtras extras={game.lockedExtras} lockedText={game.lockedText} onOpen={openDeeper} />
        <Button variant="primary" onClick={() => setStage("players")}>
          Играть 🔪
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("start")}>
          ← Назад
        </Button>
      </section>
    );
  }

  // ---------- Сколько вас ----------
  if (stage === "players") {
    return (
      <section aria-labelledby="mafia-players" className="flex flex-col gap-4">
        <h2 id="mafia-players" className="font-display text-2xl font-bold">
          Сколько вас?
        </h2>
        <Stepper
          label="Игроков"
          value={total}
          min={game.players.min}
          max={game.players.max}
          onChange={(n) => setPeople(n, host)}
          big
        />
        <p className="text-center text-muted">{game.playersHint}</p>
        <Button variant="primary" onClick={() => setStage("lineup")}>
          Дальше 👉
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("start")}>
          ← Назад
        </Button>
      </section>
    );
  }

  // ---------- Состав ----------
  if (stage === "lineup") {
    const check = checkLineup(game, total, host, lineup);
    const civilians = civilianRole(game);
    const hostR = hostRole(game);
    return (
      <section aria-labelledby="mafia-lineup" className="flex flex-col gap-3">
        <h2 id="mafia-lineup" className="font-display text-2xl font-bold">
          Состав · {total} игроков
        </h2>
        {hostR && (
          <div className="flex flex-col gap-1 rounded-card bg-surface p-4">
            <RoleStepper
              role={hostR}
              value={host}
              min={0}
              max={Math.min(1, hostR.max ?? 1)}
              onChange={(n) => setPeople(total, n)}
            />
            <p className="text-sm text-muted">{game.hostHint}</p>
          </div>
        )}
        <div className="flex flex-col gap-1 rounded-card bg-surface p-4">
          {configurableRoles(game).map((r) => (
            <RoleStepper
              key={r.id}
              role={r}
              value={lineup[r.id] ?? 0}
              min={0}
              max={r.max ?? total}
              onChange={(n) => setLineup({ ...lineup, [r.id]: n })}
            />
          ))}
          <div className="flex min-h-14 items-center gap-3 border-t border-line pt-2">
            <span aria-hidden="true" className="w-8 text-center text-2xl">
              {civilians.emoji}
            </span>
            <span className="flex-1 font-semibold">
              {civilians.title} <span className="text-sm font-normal text-muted">· считаются сами</span>
            </span>
            <span className={cn("w-10 text-center font-display text-2xl font-black", check.civilians < 0 && "text-orange")}>
              {check.civilians}
            </span>
          </div>
        </div>
        <LockedExtras extras={game.lockedExtras} lockedText={game.lockedText} onOpen={openDeeper} />
        <p role="status" className={cn("min-h-6 text-center text-[15px] font-semibold", check.ok ? "text-muted" : "text-orange")}>
          {check.ok ? `🔪 ${check.mafia} против 🏠 ${check.others}` : PROBLEM_TEXT[check.problem as LineupProblem]}
        </p>
        <Button variant="primary" disabled={!check.ok} onClick={deal}>
          Раздать 🃏
        </Button>
        <Button variant="ghost" size="md" onClick={() => setStage("players")}>
          ← Сколько вас
        </Button>
      </section>
    );
  }

  // ---------- Раздача ----------
  if (stage === "deal") {
    return (
      <Dealer
        key={dealId}
        total={cards.length}
        face={(i) => <CardFace role={role(cards[i] ?? "")} />}
        faceLabel={(i) => `Твоя роль: ${role(cards[i] ?? "").title}`}
        texts={{ deal: game.texts.deal, hide: "Скрыть 🙈", pass: game.texts.pass, cardBack: game.texts.cardBack }}
        done={
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center">
              <div aria-hidden="true" className="text-6xl">
                🌙
              </div>
              <p className="font-display text-2xl font-bold leading-snug">{game.texts.dealt}</p>
            </div>
            <Button variant="primary" onClick={() => setStage("host")}>
              К ведущему 🎙️
            </Button>
          </div>
        }
      />
    );
  }

  // ---------- Финал ----------
  if (stage === "final") {
    const win = winner(game, match) ?? "city";
    const title = win === "city" ? game.texts.cityWins : game.texts.mafiaWins;
    const flex = win === "city" ? game.texts.flexCity : game.texts.flexMafia;
    return (
      <div className="flex flex-col gap-4">
        <section
          className={cn(
            "flex flex-col items-center gap-3 rounded-card p-8 text-center",
            win === "city" ? "bg-lime text-bg" : "bg-[#B3132B] text-cream",
          )}
        >
          <div aria-hidden="true" className="text-7xl leading-none">
            {win === "city" ? "🏙️" : "🔪"}
          </div>
          <h2 className="font-display text-3xl font-black leading-tight">{title}</h2>
        </section>
        <Button variant="primary" onClick={deal}>
          Ещё партия 🔄
        </Button>
        <FlexMenu
          linkPath={`/game/${game.slug}`}
          fileName={`gazgame-${game.slug}`}
          shareText={flex}
          card={{ label: game.title, emoji: win === "city" ? "🏙️" : "🔪", title, text: flex }}
        />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md" })}>
          В меню
        </Link>
        {related}
      </div>
    );
  }

  // ---------- Ведущий ----------
  return (
    <HostPanel
      game={game}
      cards={cards}
      match={match}
      role={role}
      onEliminate={(id) => onEliminate(eliminate(game, match, id))}
      onUndo={() => setMatch(undoElimination(match))}
    />
  );
}

// ---------- Ведущий ----------

function HostPanel({
  game,
  cards,
  match,
  role,
  onEliminate,
  onUndo,
}: {
  game: MafiaGameData;
  cards: string[];
  match: MafiaMatch;
  role: (id: string) => MafiaRole;
  onEliminate: (roleId: string) => void;
  onUndo: () => void;
}) {
  const [reveal, setReveal] = useState<"hidden" | "confirm" | "shown">("hidden");
  const [picking, setPicking] = useState(false);
  const sides = aliveSides(game, match);
  const alive = aliveByRole(game, match);
  const mafiaEmoji = game.roles.find((r) => r.side === "mafia")?.emoji ?? "🔪";
  const cityEmoji = civilianRole(game).emoji;

  return (
    <div className="flex flex-col gap-4">
      <div
        aria-live="polite"
        className="sticky top-2 z-20 flex items-center justify-center gap-3 rounded-full bg-surface-2 px-4 py-2 font-display text-xl font-black"
      >
        <span>
          {mafiaEmoji} {sides.mafia}
        </span>
        <span className="text-muted">·</span>
        <span>
          {cityEmoji} {sides.city}
        </span>
        <span className="sr-only">
          живых: мафии {sides.mafia}, города {sides.city}
        </span>
      </div>

      {reveal === "hidden" && (
        <Button variant="outline" onClick={() => setReveal("confirm")}>
          {game.texts.hostButton}
        </Button>
      )}
      {reveal === "confirm" && (
        <section className="flex flex-col gap-3 rounded-card border-2 border-orange bg-surface p-5 text-center">
          <p className="font-display text-xl font-bold">{game.texts.hostConfirm}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="primary" size="md" onClick={() => setReveal("shown")}>
              Показать
            </Button>
            <Button variant="ghost" size="md" onClick={() => setReveal("hidden")}>
              Отмена
            </Button>
          </div>
        </section>
      )}
      {reveal === "shown" && (
        <section aria-labelledby="host-roles" className="flex flex-col gap-3 rounded-card bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="host-roles" className="font-display text-lg font-bold">
              Кто есть кто
            </h2>
            <Button variant="ghost" size="md" className="w-auto bg-surface-2 px-4" onClick={() => setReveal("hidden")}>
              Скрыть
            </Button>
          </div>
          <ol className="flex flex-col gap-1.5">
            {cards.map((id, i) => {
              const r = role(id);
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-muted">Игрок {i + 1}</span>
                  <span aria-hidden="true">—</span>
                  <span className={cn("font-semibold", r.side === "mafia" && "text-[#FF6B7A]")}>
                    {r.emoji} {r.title}
                  </span>
                </li>
              );
            })}
          </ol>
          <h3 className="mt-2 font-display text-base font-bold">Ночь 🌙</h3>
          <ol className="flex list-inside list-decimal flex-col gap-1 text-[15px] leading-snug marker:text-lime">
            {game.nightScript.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <h3 className="mt-2 font-display text-base font-bold">Утро ☀️</h3>
          <p className="text-[15px] leading-snug">{game.morningHint}</p>
        </section>
      )}

      <DiscussionTimer defaultSec={game.timer.defaultSec} stepSec={game.timer.stepSec} />

      {picking ? (
        <section aria-labelledby="who-out" className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <h2 id="who-out" className="font-display text-lg font-bold">
            Кто выбыл?
          </h2>
          {game.roles
            .filter((r) => r.side !== "host")
            .map((r) => (
              <Button
                key={r.id}
                variant="option"
                size="md"
                disabled={(alive[r.id] ?? 0) <= 0}
                onClick={() => {
                  setPicking(false);
                  onEliminate(r.id);
                }}
              >
                <span aria-hidden="true" className="w-7 text-center text-xl">
                  {r.emoji}
                </span>
                <span className="flex-1">{r.title}</span>
                <span className="text-muted">живых: {alive[r.id] ?? 0}</span>
              </Button>
            ))}
          <Button variant="ghost" size="md" onClick={() => setPicking(false)}>
            Отмена
          </Button>
        </section>
      ) : (
        <Button variant="primary" onClick={() => setPicking(true)}>
          Кто выбыл? ☠️
        </Button>
      )}
      {match.eliminated.length > 0 && (
        <Button variant="ghost" size="md" onClick={onUndo}>
          Отменить последнее ({role(match.eliminated[match.eliminated.length - 1] ?? "").title})
        </Button>
      )}
    </div>
  );
}

// ---------- Мелкие части ----------

function RoleStepper({
  role,
  value,
  min,
  max,
  onChange,
}: {
  role: MafiaRole;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3">
      <span aria-hidden="true" className="w-8 text-center text-2xl">
        {role.emoji}
      </span>
      <span className="flex-1 font-semibold">{role.title}</span>
      <button
        type="button"
        aria-label={`${role.title}: меньше`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex size-11 items-center justify-center rounded-full bg-surface-2 disabled:opacity-40"
      >
        <Minus aria-hidden="true" size={18} />
      </button>
      <span aria-label={`${role.title}: ${value}`} className="w-8 text-center font-display text-2xl font-black">
        {value}
      </span>
      <button
        type="button"
        aria-label={`${role.title}: больше`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex size-11 items-center justify-center rounded-full bg-surface-2 disabled:opacity-40"
      >
        <Plus aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
