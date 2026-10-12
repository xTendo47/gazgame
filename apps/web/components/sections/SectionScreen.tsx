"use client";

// Раздел в одном формате для всех (data/sections.json, макет drafts sections.html / pairs.html):
// шапка, три плитки-вкладки (две бесплатные + Premium с голубым свечением, при входе открыта первая),
// «Сколько вас?» в «Для компании», заголовок списка с подписью справа и карточки с чипами уровней.
// Тапы: обычная карточка — игра или тест; «скоро» — «Скоро! Тап засчитан 🔥» и счёт; Premium — как замки 💎
// (с Premium открывает то, что уже есть); игре не хватает людей — «Вас пока мало для этой игры».
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LockedTest, PremiumFile, SectionItem, SectionLayout, SectionsFile, SectionTab } from "@gazgame/content";
import { boldParts, peopleOption, tooFewPeople, type SectionTarget } from "@gazgame/engine";
import { cn } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { LockedPreviewSheet } from "@/components/LockedPreviewSheet";
import { trackDeeperClick, trackPreviewOpen, trackSoonClick } from "@/lib/analytics";
import { haptic } from "@/lib/haptics";
import { usePremium } from "@/lib/premium";
import { getProgress } from "@/lib/progress";

const noopSubscribe = () => () => {};
const SIZE_EVENT = "gazgame:company-size";
const subscribeSize = (cb: () => void) => {
  window.addEventListener(SIZE_EVENT, cb);
  return () => window.removeEventListener(SIZE_EVENT, cb);
};

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

export function SectionScreen({
  section,
  texts,
  targets,
  lockedTests,
  previewTexts,
  openLocked,
}: {
  section: SectionLayout;
  texts: SectionsFile["texts"];
  /** Куда ведёт каждая карточка: targets[tabId][номер карточки] (посчитано на сервере по контенту). */
  targets: Record<string, SectionTarget[]>;
  /** Платные тесты для шторки превью. */
  lockedTests: LockedTest[];
  previewTexts?: PremiumFile["preview"];
  /** Старый адрес /locked/<slug>: шторка превью открыта сразу. */
  openLocked?: string;
}) {
  const router = useRouter();
  const premium = usePremium();
  // Вкладка: выбранная тапом, иначе из адреса (?tab=compat — с кнопки «Сравниться с партнёром 💎»), иначе первая
  const urlTab = useSyncExternalStore(noopSubscribe, () => new URLSearchParams(window.location.search).get("tab") ?? "", () => "");
  const [picked, setPicked] = useState<string | null>(openLocked ? (section.tabs.find((t) => t.items.some((i) => i.ref?.lockedTest === openLocked))?.id ?? null) : null);
  const tabId = picked ?? (section.tabs.some((t) => t.id === urlTab) ? urlTab : section.tabs[0]!.id);
  const tab = section.tabs.find((t) => t.id === tabId) ?? section.tabs[0]!;

  // «Сколько вас?» — с устройства
  const savedSize = useSyncExternalStore(subscribeSize, () => getProgress().getCompanySize() ?? "", () => "");
  const people = peopleOption(section, savedSize);

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

  /** Как замки 💎: считаем «Глубже 💎» и ведём на экран «Глубже». */
  function lockedTap(target: SectionTarget, title: string) {
    const ref = target.kind === "link" ? target.href.split("/").pop() ?? title : title;
    trackDeeperClick({ id: ref, kind: target.kind === "link" && target.href.startsWith("/test/") ? "test" : "game", source: "locked-deck" });
    router.push("/deeper");
  }

  function open(target: SectionTarget) {
    if (target.kind === "link") router.push(target.href);
    else if (target.kind === "locked-test") {
      const test = lockedTests.find((t) => t.slug === target.slug);
      if (test) trackPreviewOpen({ id: test.id });
      setSheet(target.slug);
    }
  }

  function tap(item: SectionItem, target: SectionTarget, off: boolean) {
    if (off) {
      haptic("double");
      say(texts.fewPeople);
      return;
    }
    if (target.kind === "soon") return countSoon(item.title);
    // Платные тесты открывают своё превью (как раньше), остальные Premium-карточки — как замки 💎
    if (item.premium && !premium && target.kind !== "locked-test") return lockedTap(target, item.title);
    open(target);
  }

  function pickTab(t: SectionTab) {
    haptic("tick");
    setPicked(t.id);
  }

  function pickSize(id: string) {
    haptic("tick");
    getProgress().saveCompanySize(id);
    window.dispatchEvent(new Event(SIZE_EVENT));
  }

  const sheetTest = lockedTests.find((t) => t.slug === sheet);

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex flex-col gap-1">
        <BackLink href="/">Меню</BackLink>
        <h1 className="mt-1 font-display text-[32px] leading-[1.05] font-black">{section.title}</h1>
        <p className="text-[15px] leading-[1.45] text-muted">
          <Rich text={section.lead} />
        </p>
      </header>

      {/* Три плитки-вкладки */}
      <div role="tablist" aria-label="Подразделы" className="grid grid-cols-3 gap-2">
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
              <b className="font-display text-[min(12.5px,3.2vw)] leading-[1.15] font-bold hyphens-manual" lang="ru">
                {t.name}
              </b>
              <small className={cn("text-[10.5px] font-bold", t.premium ? "text-[#62D2FF]" : "text-muted")}>
                {t.premium ? texts.premium : texts.free}
              </small>
            </button>
          );
        })}
      </div>

      {/* «Сколько вас?» */}
      {section.people && people && (
        <div className="flex items-center gap-2.5 rounded-[18px] border border-line bg-surface px-3 py-2.5">
          <span className="font-display text-[13px] font-bold whitespace-nowrap">{section.people.question}</span>
          <div role="group" aria-label={section.people.question} className="grid flex-1 grid-cols-3 gap-1.5">
            {section.people.options.map((o) => {
              const on = o.id === people.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickSize(o.id)}
                  className={cn(
                    "min-h-10 rounded-xl border px-1 text-[13px] font-extrabold tabular-nums",
                    on ? "border-lime bg-lime/12 text-lime" : "border-line bg-surface-2",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Список выбранной вкладки */}
      <section id="section-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`} key={tab.id} className="section-pop flex flex-col gap-2.5">
        <PanelHead title={tab.head} side={tab.side} />

        {tab.hero && (
          <button
            type="button"
            onClick={() => {
              trackSoonClick({ id: `${section.id}:${tab.hero!.title}` });
              say(texts.heroToast);
            }}
            className="flex w-full items-center gap-3.5 rounded-[22px] border-[1.5px] border-[#62D2FF]/55 bg-[linear-gradient(160deg,#1F2A33,#1B1822)] p-4 text-left shadow-[0_0_24px_rgb(98_210_255/0.16)]"
          >
            <span aria-hidden="true" className="text-4xl leading-none">
              {tab.hero.emoji}
            </span>
            <span>
              <b className="block font-display text-[15px] font-bold">{tab.hero.title}</b>
              <small className="mt-0.5 block text-[12.5px] text-muted">{tab.hero.text}</small>
            </span>
          </button>
        )}

        {tab.compat && (
          <Compat
            compat={tab.compat}
            onOpen={() => {
              if (premium) return countSoon(tab.compat!.example.button);
              trackDeeperClick({ id: "attachment-style", kind: "test", source: "compat" });
              router.push("/deeper");
            }}
          />
        )}

        {tab.items.map((item, i) => {
          const target = targets[tab.id]?.[i] ?? ({ kind: "soon" } as SectionTarget);
          const soon = target.kind === "soon";
          const off = tooFewPeople(item, people?.max);
          return (
            <button
              key={`${item.title}-${i}`}
              type="button"
              aria-disabled={off || undefined}
              onClick={() => tap(item, target, off)}
              className={cn(
                "relative flex w-full items-center gap-3.5 rounded-[20px] border bg-surface px-4 py-3.5 text-left transition",
                item.premium ? "border-[#62D2FF]/35" : "border-line",
                off && "opacity-40 grayscale-[0.7]",
              )}
            >
              {soon && (
                <span
                  className={cn(
                    "absolute top-2.5 right-3 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.04em]",
                    item.premium ? "border-[#62D2FF]/40 bg-[#62D2FF]/10 text-[#62D2FF]" : "border-lime/35 bg-lime/8 text-lime",
                  )}
                >
                  {texts.soon}
                </span>
              )}
              <span aria-hidden="true" className="shrink-0 text-[32px] leading-none">
                {item.emoji}
              </span>
              <span className="min-w-0">
                <b className={cn("block font-display text-[14.5px] leading-[1.25] font-bold", soon && "pr-14")}>{item.title}</b>
                <small className="mt-0.5 block text-[12.5px] text-muted">{item.text}</small>
                {item.levels && (
                  <span className="mt-[7px] flex flex-wrap gap-[5px]">
                    {item.levels.map((l) => (
                      <span
                        key={l.label}
                        className={cn(
                          "rounded-full px-2 py-[3px] text-[10.5px] font-bold",
                          l.premium ? "bg-[#62D2FF]/10 text-[#62D2FF]" : "bg-cream/7 text-muted",
                        )}
                      >
                        {l.label}
                      </span>
                    ))}
                  </span>
                )}
                {off && item.min && (
                  <span className="mt-1.5 block text-[11px] font-extrabold text-orange">{texts.needPeople.replace("{n}", String(item.min))}</span>
                )}
              </span>
            </button>
          );
        })}

        {tab.note && (
          <p className="rounded-2xl bg-surface-2 px-3.5 py-3 text-[13px] text-muted">
            <Rich text={tab.note} />
          </p>
        )}
      </section>

      {previewTexts && <LockedPreviewSheet test={sheetTest} texts={previewTexts} onClose={() => setSheet(null)} />}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
        {toast && (
          <p key={toast.id} className="max-w-full rounded-[14px] border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] shadow-[0_10px_24px_rgb(0_0_0/0.5)]">
            {toast.text}
          </p>
        )}
      </div>
    </div>
  );
}

function PanelHead({ title, side }: { title: string; side: string }): ReactNode {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="font-display text-base leading-[1.2] font-bold">{title}</h2>
      <span className="text-xs text-muted">{side}</span>
    </div>
  );
}

/** «Совместимость»: три шага, карточка-пример с размытыми блоками, подпись и «Что внутри». */
function Compat({ compat, onOpen }: { compat: NonNullable<SectionTab["compat"]>; onOpen: () => void }) {
  const ex = compat.example;
  return (
    <>
      <ol className="grid grid-cols-3 gap-1.5">
        {compat.steps.map((step, i) => (
          <li key={step} className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 px-2 py-2.5 text-center text-xs text-muted">
            <i
              className={cn(
                "grid size-[26px] place-items-center rounded-full border bg-surface font-display text-[13px] font-black not-italic",
                i === 2 ? "border-[#62D2FF] text-[#62D2FF]" : "border-line text-cream",
              )}
            >
              {i + 1}
            </i>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-1.5 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{compat.exampleLabel}</div>
      <article className="flex flex-col gap-3 rounded-[24px] border-[1.5px] border-[#62D2FF]/55 bg-[linear-gradient(160deg,#1F2A33,#1B1822)] p-[18px] shadow-[0_0_26px_rgb(98_210_255/0.15)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center">
          {[ex.left, ex.right].map((p, i) => (
            <div key={p.title} className={cn(i === 1 && "col-start-3")}>
              <span aria-hidden="true" className="text-4xl leading-none">
                {p.emoji}
              </span>
              <b className="mt-1 block font-display text-xs leading-[1.2] font-bold">{p.title}</b>
              <small className="block text-[11px] text-muted">{p.name}</small>
            </div>
          ))}
          <span aria-hidden="true" className="col-start-2 row-start-1 font-display text-lg font-black text-muted">
            +
          </span>
        </div>
        <div className="text-center">
          <b className="font-display text-[40px] leading-none font-black text-[#62D2FF] tabular-nums">{ex.percent}</b>
          <small className="mt-1 block text-xs text-muted">{ex.caption}</small>
        </div>
        <p className="rounded-[14px] bg-cream/5 px-3 py-2.5 text-sm">{ex.free}</p>
        <div className="flex flex-col gap-2">
          {ex.blurred.map((b) => (
            <div key={b.title} className="rounded-xl bg-cream/5 px-3 py-2.5 text-[13px]">
              <b className="mb-0.5 block font-display text-[13px] font-bold">{b.title}</b>
              <span aria-hidden="true" className="text-muted blur-[4px] select-none">
                {b.text}
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onOpen} className="min-h-12 w-full rounded-[14px] bg-[#62D2FF] px-2.5 py-3 text-center font-display text-[15px] font-black text-bg">
          {ex.button}
        </button>
      </article>
      <p className="text-center text-xs text-muted">{compat.hint}</p>
      <div className="mt-2">
        <PanelHead title={compat.insideTitle} side={compat.insideSide} />
      </div>
    </>
  );
}
