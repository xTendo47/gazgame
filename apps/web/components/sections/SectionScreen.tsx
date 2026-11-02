"use client";

// Раздел в одном формате для всех (data/sections.json, спека главной и разделов 16.10): «← Главная», заголовок с подписью,
// три плитки-вкладки (две бесплатные + Premium с голубым свечением, при входе открыта первая), под бесплатными три мини-кнопки
// «во что» (тап оставляет одну группу, повторный возвращает все), список по группам с заголовками и карточки с чипами уровней.
// Разделы без мини-кнопок (пока Романтика и Дневник) показывают список целиком с заголовком и подписью справа.
// Тапы: обычная карточка — игра или тест; «скоро» — «Скоро! Тап засчитан 🔥» и счёт; Premium — как замки 💎
// (с Premium открывает то, что уже есть). Экрана «Сколько вас?» больше нет: если игре нужно больше людей, это в подписи.
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  LockedTest,
  PremiumFile,
  SectionItem,
  SectionLayout,
  SectionsFile,
  SectionTab,
} from "@gazgame/content";
import {
  boldParts,
  sectionGroups,
  toggleKind,
  type SectionTarget,
} from "@gazgame/engine";
import { BackTag, cn } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CasinoDeckView } from "@/components/casino/CasinoDeckView";
import { CasinoScene } from "@/components/casino/CasinoScene";
import { DiaryDeckView } from "@/components/diary/DiaryDeckView";
import { DiaryScene } from "@/components/diary/DiaryScene";
import { CosmosDeckView } from "@/components/diary/CosmosDeckView";
import { ClinicDeckView } from "@/components/diary/ClinicDeckView";
import { WantedDeckView } from "@/components/diary/WantedDeckView";
import { LoveDeckView } from "@/components/love/LoveDeckView";
import { LoveScene } from "@/components/love/LoveScene";
import { LockedPreviewSheet } from "@/components/LockedPreviewSheet";
import { RulesSheet } from "@/components/RulesSheet";
import {
  trackDeeperClick,
  trackPreviewOpen,
  trackRulesOpen,
  trackRulesPlay,
  trackSoonClick,
} from "@/lib/analytics";
import { haptic } from "@/lib/haptics";
import { usePremium } from "@/lib/premium";
import { randomIndex } from "@/lib/random";
import { stripEmoji } from "@/lib/text";

const noopSubscribe = () => () => {};

/** «**жирный**» → <b>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((p, i) =>
        p.bold ? (
          <b key={i} className="font-bold text-cream">
            {p.text}
          </b>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** Названия кармашков «Дневника» (по макету): вкладки раздела who / psy / deep. */
const DIARY_NAMES: Record<string, string> = { who: "Ты в розыске", psy: "Психо", deep: "Глубже" };

export function SectionScreen({
  section,
  texts,
  targets,
  players,
  meta,
  lockedTests,
  previewTexts,
  rules,
  openLocked,
}: {
  section: SectionLayout;
  texts: SectionsFile["texts"];
  /** Куда ведёт каждая карточка: targets[tabId][номер карточки] (посчитано на сервере по контенту). */
  targets: Record<string, SectionTarget[]>;
  /** Подпись «сколько игроков» по карточкам: players[tabId][номер карточки] (null — неизвестно). */
  players: Record<string, (string | null)[]>;
  /** Подпись «2 · 20 МИН» / «ТЕСТ» на карточках «Романтики»: meta[tabId][номер карточки]. */
  meta?: Record<string, (string | null)[]>;
  /** Платные тесты для шторки превью. */
  lockedTests: LockedTest[];
  previewTexts?: PremiumFile["preview"];
  /** «Как играть за 10 секунд»: три строки по id игры (cards — «Карточные игры», test — любой тест). */
  rules: Record<string, string[]>;
  /** Старый адрес /locked/<slug>: шторка превью открыта сразу. */
  openLocked?: string;
}) {
  const router = useRouter();
  const premium = usePremium();
  // Вкладка: выбранная тапом, иначе из адреса (?tab=compat — с кнопки «Сравниться с партнёром 💎»), иначе первая
  const urlTab = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("tab") ?? "",
    () => "",
  );
  const [picked, setPicked] = useState<string | null>(
    openLocked
      ? (section.tabs.find((t) =>
          t.items.some((i) => i.ref?.lockedTest === openLocked),
        )?.id ?? null)
      : null,
  );
  const tabId =
    picked ??
    (section.tabs.some((t) => t.id === urlTab) ? urlTab : section.tabs[0]!.id);
  const tab = section.tabs.find((t) => t.id === tabId) ?? section.tabs[0]!;
  // «Тусовка»: сначала сцена казино с тремя колодами (это вкладки раздела), после выбора колоды — список игр
  const casino = section.id === "company";
  // «Романтика»: сцена с конвертом и тремя колодами, дальше экран колоды с карточками-билетами
  const love = section.id === "pairs";
  // «Дневник»: книга с тремя кармашками (это вкладки раздела), после выбора — страница со списком тестов
  const diary = section.id === "solo";
  const themed = casino || love || diary;
  const [casinoView, setCasinoView] = useState<"decks" | "games" | null>(null);
  const showDecks =
    themed &&
    (casinoView ?? (picked || urlTab || openLocked ? "games" : "decks")) ===
      "decks";

  // Мини-кнопка «во что»: выбранная группа этой вкладки (при смене вкладки показываем все группы)
  const [kindSel, setKindSel] = useState<{ tab: string; kind: string | null }>({
    tab: "",
    kind: null,
  });
  const selKind = kindSel.tab === tab.id ? kindSel.kind : null;
  const groups = sectionGroups(tab, selKind);

  const [sheet, setSheet] = useState<string | null>(openLocked ?? null);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const toastSeq = useRef(0);
  function say(text: string) {
    const id = ++toastSeq.current;
    setToast({ text, id });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2400);
  }

  function countSoon(title: string) {
    trackSoonClick({ id: `${section.id}:${title}` });
    say(texts.soonToast);
  }

  /** Как замки 💎: считаем «Глубже» и ведём на экран Premium. */
  function lockedTap(target: SectionTarget, title: string) {
    const ref =
      target.kind === "link" ? (target.href.split("/").pop() ?? title) : title;
    trackDeeperClick({
      id: ref,
      kind:
        target.kind === "link" && target.href.startsWith("/test/")
          ? "test"
          : "game",
      source: "locked-deck",
    });
    router.push("/premium");
  }

  function open(target: SectionTarget) {
    if (target.kind === "link") router.push(target.href);
    else if (target.kind === "locked-test") {
      const test = lockedTests.find((t) => t.slug === target.slug);
      if (test) trackPreviewOpen({ id: test.id });
      setSheet(target.slug);
    }
  }

  /** Шторка «Как играть за 10 секунд» перед игрой или тестом: что открыть и ключ правил. */
  const [rulesFor, setRulesFor] = useState<{
    item: SectionItem;
    href: string;
    key: string;
  } | null>(null);

  function tap(item: SectionItem, target: SectionTarget) {
    if (target.kind === "soon") return countSoon(item.title);
    // Платные тесты открывают своё превью (как раньше), остальные Premium-карточки — как замки 💎
    if (item.premium && !premium && target.kind !== "locked-test")
      return lockedTap(target, item.title);
    // Игра или тест: сначала три строки «как играть», потом «Играть →»
    const key =
      item.ref?.game ??
      (item.ref?.cards ? "cards" : item.ref?.test ? "test" : undefined);
    if (target.kind === "link" && key && rules[key]) {
      trackRulesOpen({
        id: key === "test" ? (item.ref?.test ?? key) : key,
        source: "section",
      });
      setRulesFor({ item, href: target.href, key });
      return;
    }
    open(target);
  }

  /** Тап по чипу уровня: голубой 💎 и «Сравниться 💎» объясняют себя и считаются «Глубже 💎»; с Premium чип — часть карточки. */
  function chipTap(
    e: { stopPropagation: () => void },
    item: SectionItem,
    level: NonNullable<SectionItem["levels"]>[number],
  ) {
    if (!level.premium || premium) return;
    e.stopPropagation();
    haptic("double");
    const id = item.ref?.game ?? item.ref?.test ?? item.title;
    trackDeeperClick({
      id,
      kind: item.ref?.test ? "test" : "game",
      source: level.compare ? "compat" : "locked-deck",
    });
    say(level.compare ? texts.compareHint : texts.premiumHint);
  }

  function pickTab(t: SectionTab) {
    haptic("tick");
    setPicked(t.id);
    setKindSel({ tab: "", kind: null }); // новая плитка — снова все группы
  }

  function pickKind(id: string) {
    haptic("tick");
    setKindSel({ tab: tab.id, kind: toggleKind(selKind, id) });
  }

  /** Карточка игры или теста. index — номер в tab.items: по нему посчитана цель тапа. */
  function renderItem(item: SectionItem, i: number) {
    const target = targets[tab.id]?.[i] ?? ({ kind: "soon" } as SectionTarget);
    const soon = target.kind === "soon";
    return (
      <button
        key={`${item.title}-${i}`}
        type="button"
        onClick={() => tap(item, target)}
        className={cn(
          "relative flex w-full items-center gap-3.5 rounded-[20px] border bg-surface px-4 py-3.5 text-left transition",
          item.premium ? "border-[#62D2FF]/35" : "border-line",
        )}
      >
        {soon && (
          <span
            className={cn(
              "absolute top-2.5 right-3 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.04em]",
              item.premium
                ? "border-[#62D2FF]/40 bg-[#62D2FF]/10 text-[#62D2FF]"
                : "border-lime/35 bg-lime/8 text-lime",
            )}
          >
            {texts.soon}
          </span>
        )}
        <span aria-hidden="true" className="shrink-0 text-[32px] leading-none">
          {item.emoji}
        </span>
        <span className="min-w-0">
          <b
            className={cn(
              "block font-display text-[14.5px] leading-[1.25] font-bold",
              soon && "pr-14",
            )}
          >
            {item.title}
          </b>
          <small className="mt-0.5 block text-[12.5px] text-muted">
            {item.text}
          </small>
          {item.levels && (
            <span className="mt-[7px] flex flex-wrap gap-[5px]">
              {item.levels.map((l) => (
                <span
                  key={l.label}
                  onClick={(e) => chipTap(e, item, l)}
                  className={cn(
                    "rounded-full px-2 py-[3px] text-[10.5px] font-bold",
                    l.premium
                      ? "bg-[#62D2FF]/10 text-[#62D2FF]"
                      : l.free
                        ? "bg-lime/10 text-lime"
                        : "bg-cream/7 text-muted",
                  )}
                >
                  {l.label}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
    );
  }

  const sheetTest = lockedTests.find((t) => t.slug === sheet);

  /** «Наугад»: случайная из доступных карточек колоды (не «скоро» и не закрытая Premium). */
  function randomTap(list: { item: SectionItem; target: SectionTarget }[]) {
    const pick = list[randomIndex(list.length)];
    if (pick) tap(pick.item, pick.target);
  }

  const overlays = (
    <>
      {rulesFor && (
        <RulesSheet
          emoji={rulesFor.item.emoji}
          name={rulesFor.item.title}
          lines={rules[rulesFor.key] ?? []}
          texts={{
            title: texts.rulesTitle,
            play: texts.play,
            later: texts.later,
          }}
          onClose={() => setRulesFor(null)}
          onPlay={() => {
            trackRulesPlay({
              id:
                rulesFor.item.ref?.game ??
                rulesFor.item.ref?.test ??
                rulesFor.key,
            });
            router.push(rulesFor.href);
          }}
        />
      )}

      {previewTexts && (
        <LockedPreviewSheet
          test={sheetTest}
          texts={previewTexts}
          onClose={() => setSheet(null)}
        />
      )}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
      >
        {toast && (
          <p
            key={toast.id}
            className="max-w-full rounded-[14px] border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] shadow-[0_10px_24px_rgb(0_0_0/0.5)]"
          >
            {toast.text}
          </p>
        )}
      </div>
    </>
  );

  // «Тусовка», колода открыта: казино-карты вместо списка. Что делает тап по карточке — те же tap/countSoon/lockedTap выше
  if (diary && !showDecks) {
    const DeckView = tab.id === "who" ? WantedDeckView : tab.id === "psy" ? ClinicDeckView : tab.id === "deep" ? CosmosDeckView : DiaryDeckView;
    const items = tab.items.map((item, index) => {
      const target = targets[tab.id]?.[index] ?? ({ kind: "soon" } as SectionTarget);
      return { item, index, target };
    });
    const playable = items.filter(({ item, target }) => target.kind === "link" && !(item.premium && !premium));
    return (
      <>
        <DeckView
          title={DIARY_NAMES[tab.id] ?? stripEmoji(tab.name)}
          entries={items.map(({ item, index, target }) => ({
            index,
            title: stripEmoji(item.title),
            text: stripEmoji(item.text),
            emoji: item.emoji,
            soon: target.kind === "soon",
            locked: !!item.premium && !premium,
            meta: meta?.[tab.id]?.[index] ?? null,
          }))}
          onBack={() => setCasinoView("decks")}
          onPick={(index) => {
            const found = items[index];
            if (!found) return;
            // «Глубже»: закрытая карточка (в том числе «скоро») ведёт на экран Premium
            if (tab.id === "deep" && found.item.premium && !premium) return lockedTap(found.target, found.item.title);
            tap(found.item, found.target);
          }}
          onRandom={playable.length > 0 ? () => randomTap(playable) : null}
        />
        {overlays}
      </>
    );
  }

  if (love && !showDecks) {
    const items = tab.items.map((item, index) => {
      const target = targets[tab.id]?.[index] ?? ({ kind: "soon" } as SectionTarget);
      return { item, index, target };
    });
    const playable = items.filter(({ item, target }) => target.kind === "link" && !(item.premium && !premium));
    const tabPos = section.tabs.findIndex((t) => t.id === tab.id);
    const numberBase = section.tabs.slice(0, tabPos).reduce((n, t) => n + t.items.length, 0);
    const numberTotal = section.tabs.reduce((n, t) => n + t.items.length, 0);
    return (
      <>
        <LoveDeckView
          deckId={tab.id}
          title={stripEmoji(tab.name)}
          cards={items.map(({ item, index, target }) => ({
            index,
            title: stripEmoji(item.title),
            emoji: item.emoji,
            meta: meta?.[tab.id]?.[index] ?? null,
            soon: target.kind === "soon",
            locked: !!item.premium && !premium,
          }))}
          numberBase={numberBase}
          numberTotal={numberTotal}
          onBack={() => setCasinoView("decks")}
          onPick={(index) => {
            const found = items[index];
            if (found) tap(found.item, found.target);
          }}
          onRandom={playable.length > 0 ? () => randomTap(playable) : null}
        />
        {overlays}
      </>
    );
  }

  if (casino && !showDecks) {
    const items = tab.items.map((item, index) => {
      const target =
        targets[tab.id]?.[index] ?? ({ kind: "soon" } as SectionTarget);
      return { item, index, target };
    });
    const playable = items.filter(
      ({ item, target }) =>
        target.kind === "link" && !(item.premium && !premium),
    );
    return (
      <>
        <CasinoDeckView
          deckId={tab.id}
          title={stripEmoji(tab.name)}
          cards={items.map(({ item, index, target }) => ({
            index,
            title: item.title,
            emoji: item.emoji,
            kind: tab.kinds
              ?.find((k) => k.id === item.kind)
              ?.name.toUpperCase(),
            players: players[tab.id]?.[index] ?? null,
            soon: target.kind === "soon",
            locked: !!item.premium && !premium,
          }))}
          onBack={() => setCasinoView("decks")}
          onPick={(index) => {
            const found = items[index];
            if (found) tap(found.item, found.target);
          }}
          onRandom={playable.length > 0 ? () => randomTap(playable) : null}
        />
        {overlays}
      </>
    );
  }

  if (showDecks && diary) {
    return (
      <DiaryScene
        title={stripEmoji(section.title)}
        pockets={section.tabs.map((t) => ({
          id: t.id,
          count: t.items.filter((i) => i.ref?.test || i.ref?.lockedTest).length,
          premium: !!t.premium,
        }))}
        names={DIARY_NAMES}
        onPick={(id) => {
          const t = section.tabs.find((x) => x.id === id);
          if (t) pickTab(t);
          setCasinoView("games");
        }}
      />
    );
  }

  if (showDecks && love) {
    return (
      <LoveScene
        title={stripEmoji(section.title)}
        decks={section.tabs.map((t) => ({ id: t.id, name: stripEmoji(t.name), premium: !!t.premium }))}
        premium={premium}
        onPick={(id) => {
          const t = section.tabs.find((x) => x.id === id);
          if (t) pickTab(t);
          setCasinoView("games");
        }}
      />
    );
  }

  if (showDecks) {
    return (
      <CasinoScene
        title={stripEmoji(section.title)}
        decks={section.tabs.map((t) => ({
          id: t.id,
          name: t.name,
          premium: !!t.premium,
        }))}
        premium={premium}
        onPick={(id) => {
          const t = section.tabs.find((x) => x.id === id);
          if (t) pickTab(t);
          setCasinoView("games");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex flex-col gap-1">
        {casino ? (
          <div>
            <BackTag onClick={() => setCasinoView("decks")}>
              ← К колодам
            </BackTag>
          </div>
        ) : (
          <BackLink href="/">Главная</BackLink>
        )}
        <h1 className="mt-1 font-display text-[26px] leading-[1.1] font-extrabold">
          {section.title}
        </h1>
        <p className="text-[15px] leading-[1.45] text-muted">
          <Rich text={section.lead} />
        </p>
      </header>

      {/* Три плитки-вкладки */}
      <div
        role="tablist"
        aria-label="Подразделы"
        className="grid grid-cols-3 gap-2"
      >
        {section.tabs.map((t) => {
          const on = t.id === tab.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls="section-panel"
              onClick={() => pickTab(t)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] border-[1.5px] bg-surface px-1.5 pt-3.5 pb-3 text-center transition active:scale-[0.96]",
                t.premium
                  ? on
                    ? "border-[#62D2FF] shadow-[0_0_24px_rgb(98_210_255/0.38)]"
                    : "border-[#62D2FF]/50 shadow-[0_0_18px_rgb(98_210_255/0.18)]"
                  : on
                    ? "border-orange shadow-[0_0_18px_rgb(255_90_31/0.25)]"
                    : "border-line",
              )}
            >
              <span aria-hidden="true" className="text-[30px] leading-none">
                {t.emoji}
              </span>
              {/* на узком телефоне шрифт чуть меньше, чтобы «Поверхность» и «Погружение» не рвались посреди слова */}
              <b
                className="font-display text-[min(12.5px,3.2vw)] leading-[1.15] font-bold hyphens-manual"
                lang="ru"
              >
                {t.name}
              </b>
              <small
                className={cn(
                  "text-[10.5px] font-bold",
                  t.premium ? "text-[#62D2FF]" : "text-muted",
                )}
              >
                {t.tag ?? (t.premium ? texts.premium : texts.free)}
              </small>
            </button>
          );
        })}
      </div>

      {/* Три мини-кнопки «во что»: тап оставляет одну группу, повторный тап возвращает все (у Premium-плитки их нет) */}
      {tab.kinds && (
        <div className="flex flex-col gap-2">
          <div
            role="group"
            aria-label="Во что играем"
            className="grid grid-cols-3 gap-1.5"
          >
            {tab.kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={selKind === k.id}
                onClick={() => pickKind(k.id)}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-[3px] rounded-[14px] border px-1 py-2 text-center text-[11.5px] leading-[1.15] font-bold transition-colors",
                  selKind === k.id
                    ? "border-orange bg-orange/14"
                    : "border-line",
                )}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {k.emoji}
                </span>
                {k.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            {selKind ? texts.kindsOne : texts.kindsAll}
          </p>
        </div>
      )}

      {/* Список выбранной вкладки */}
      <section
        id="section-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab.id}`}
        key={tab.id}
        className="section-pop flex flex-col gap-2.5"
      >
        {tab.head && tab.side && <PanelHead title={tab.head} side={tab.side} />}

        {tab.note && tab.premium && (
          <p className="rounded-2xl border border-dashed border-[#62D2FF]/50 bg-[#62D2FF]/[0.06] px-3.5 py-3 text-[13px] text-cream/85">
            <Rich text={tab.note} />
          </p>
        )}

        {groups
          ? groups.map((g) => (
              <div key={g.id} className="flex flex-col gap-2.5">
                <h3 className="mt-2 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">
                  <span aria-hidden="true">{g.emoji}</span> {g.name}
                </h3>
                {g.items.map(({ item, index }) => renderItem(item, index))}
              </div>
            ))
          : tab.items.map((item, i) => renderItem(item, i))}

        {tab.note && !tab.premium && (
          <p className="rounded-2xl bg-surface-2 px-3.5 py-3 text-[13px] text-muted">
            <Rich text={tab.note} />
          </p>
        )}
      </section>

      {overlays}
    </div>
  );
}

function PanelHead({
  title,
  side,
}: {
  title: string;
  side: string;
}): ReactNode {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="font-display text-base leading-[1.2] font-bold">
        {title}
      </h2>
      <span className="text-xs text-muted">{side}</span>
    </div>
  );
}
