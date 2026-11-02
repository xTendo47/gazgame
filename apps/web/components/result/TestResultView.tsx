// Экран результата теста. Общий для обычного результата и смешанного («Холерик с нотками меланхолика»).
// Показывает только те блоки, что есть в JSON: старые тесты (text + deepTeaser) выглядят как раньше.
// У тестов по шкалам (scales) и с полосками всех типов (showRanking) баллы приходят в адресе страницы —
// их показывают ScalesPanel и RankingPanel.
// Второй тип смешанного результата (blendNotes) всегда идёт отдельной строкой, к названию не приклеивается.
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Test, TestResult } from "@gazgame/content";
import { fillPlaceholders, scalesConfig, scoringConfig, shareButtonLabel, splitListLabel, type TestBlend } from "@gazgame/engine";
import { Badge, buttonVariants, cn, DeepTeaser } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { CollectionFlash } from "@/components/collection/CollectionFlash";
import { DeeperButton } from "@/components/DeeperButton";
import { RelatedBlock } from "@/components/RelatedBlock";
import { getSection } from "@/lib/sections";
import { stripEmoji } from "@/lib/text";
import { CopyListButton } from "./CopyListButton";
import { CompatLink } from "./CompatLink";
import { AnswerBack } from "@/components/share/AnswerBack";
import { ShareButton, ShareIconButton, ShareProvider } from "@/components/share/ShareSheet";
import { FlagMeter } from "./FlagMeter";
import { LanguagePanel } from "./LanguagePanel";
import { Battery } from "./Battery";
import { PairBlock } from "./PairBlock";
import { Palette } from "./Palette";
import { RankingPanel } from "./RankingPanel";
import { ResultButton } from "./ResultButton";
import { ValueMap } from "./ValueMap";
import { TieBanner } from "./TieBanner";
import { ResultHero } from "./ResultHero";
import { ScalesPanel } from "./ScalesPanel";
import { upsellItems } from "@/lib/upsell";
import { UpsellItems } from "./UpsellItems";
import { UpsellText } from "./UpsellText";
import { DotList } from "../DotList";
import { Em } from "@/components/Em";
import { GIcon } from "@/components/casino/GIcon";
import { Glyph } from "@/components/casino/GIcon";

/** Заголовок блока Premium после теста — одинаковый у всех тестов. */
const UPSELL_TITLE = "Что ты получишь";

/** Название для заголовка вкладки: «Холерик» или «Холерик (с нотками меланхолика 🌙)». */
export function resultTitle(result: TestResult, blend?: Pick<TestBlend, "note">): string {
  return blend ? `${result.title} (${blend.note.title})` : result.title;
}

/** «с нотками холерика» → «С нотками холерика» — для заголовка отдельного блока. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}



export function resultDescription(result: TestResult): string | undefined {
  return result.paragraphs?.[0] ?? result.text;
}

const premiumTextClass = "-mt-1 leading-relaxed text-cream/85";

export function TestResultView({ test, result, blend }: { test: Test; result: TestResult; blend?: TestBlend }) {
  const paragraphs = result.paragraphs ?? [];
  const hasScales = scalesConfig(test) !== null;
  const config = scoringConfig(test);
  const showRanking = config.type === "types" && config.showRanking === true;
  // Блок списка: у «Языков любви» — 💌 и ♥, у других тестов свой эмодзи и своя надпись на кнопке (resultBlocks)
  const blocks = test.resultBlocks;
  const loveHeading = blocks?.howToLoveMe ?? "Как меня любить";
  const listEmoji = blocks?.howToLoveMeEmoji;
  /** Фишки теста: до «Сильных сторон» и после «Совета». */
  const extrasBefore = (result.extras ?? []).filter((e) => !e.after);
  const extrasAfter = (result.extras ?? []).filter((e) => e.after);

  return (
    <ShareProvider test={test} resultId={result.id} blendId={blend?.resultId}>
      {/* Новый итог — «Новая карта в Коллекции 🃏» */}
      <CollectionFlash />
      <div className="flex items-center justify-between gap-3">
        <BackLink href={`/${test.sections[0] ?? ""}`}>Все тесты</BackLink>
        <ShareIconButton />
      </div>

      <ResultHero
        label={`${test.emoji} ${test.title} · твой результат`}
        emoji={result.emoji}
        title={result.title}
        blendEmoji={blend?.result.emoji}
        blendTitle={blend?.note.title}
        subtitle={result.subtitle}
        accent={result.acc ? { color: result.acc, border: result.accBorder } : undefined}
        tag={result.tag}
        status={test.share?.style === "messenger" ? result.share?.line : undefined}
        text={result.text}
      />
      {/* Тест прислал друг — «Ты: … · Друг: …» и «Кинуть ответку 🔁» рядом с героем */}
      <AnswerBack test={test} mine={result} />
      {/* «Куда кидаем?» — сразу под главным блоком итога, пока результат на эмоциях */}
      <ShareButton label={shareButtonLabel(test)} />
      {test.status === "draft" && (
        <Badge tone="draft" className="self-start">
          черновик
        </Badge>
      )}

      {paragraphs.length > 0 && (
        <section aria-label="Разбор результата" className="flex flex-col gap-4 px-1">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "text-lg font-semibold leading-relaxed" : "leading-relaxed text-cream/85"}>
              {p}
            </p>
          ))}
        </section>
      )}

      {showRanking && (
        // Полоски всех типов читаются из адреса уже в браузере; страница при этом остаётся статической.
        <Suspense fallback={null}>
          <RankingPanel test={test} resultId={result.id} blendId={blend?.resultId} />
        </Suspense>
      )}
      {/* Тесты типа types без «Твоего расклада» (Темперамент): плашка ничьей отдельно */}
      {!showRanking && config.type === "types" && (
        <Suspense fallback={null}>
          <TieBanner test={test} resultId={result.id} blendId={blend?.resultId} />
        </Suspense>
      )}

      {test.battery && hasScales && (
        <Suspense fallback={null}>
          <Battery test={test} hours={result.battery} />
        </Suspense>
      )}

      {hasScales && (
        // Шкалы читаются из адреса уже в браузере; страница при этом остаётся статической.
        <Suspense fallback={null}>
          <ScalesPanel test={test} range={result.range} />
        </Suspense>
      )}

      {test.palette && (
        <Suspense fallback={null}>
          <Palette test={test} resultId={result.id} />
        </Suspense>
      )}
      {test.pairBlock && (
        <Suspense fallback={null}>
          <PairBlock test={test} resultId={result.id} />
        </Suspense>
      )}

      {blend && (
        <InsightCard title={capitalize(blend.note.title)} accent="border-cream">
          {blend.note.text}
        </InsightCard>
      )}

      {test.valueMap && (
        <Suspense fallback={null}>
          <ValueMap test={test} resultId={result.id} />
        </Suspense>
      )}
      {test.flagMeter && (
        // Сумма Флаг-метра читается из адреса уже в браузере; страница при этом остаётся статической.
        <Suspense fallback={null}>
          <FlagMeter test={test} />
        </Suspense>
      )}
      {test.languages && (
        <Suspense fallback={null}>
          <LanguagePanel test={test} resultId={result.id} />
        </Suspense>
      )}

      {result.route && <RouteBlock title={blocks?.route ?? "Твой маршрут на выходные"} route={result.route} />}
      {result.board && <BoardBlock board={result.board} blocks={blocks} />}
      <Extras extras={extrasBefore} />
      {result.compat && <CompatBlock compat={result.compat} blocks={blocks} />}

      {result.strengths && result.strengths.length > 0 && (
        <section aria-labelledby="strengths-title" className="flex flex-col gap-3">
          <h2 id="strengths-title" className="font-display text-xl font-bold">
            <Em text="Твои сильные стороны 💪" />
          </h2>
          <ul className="flex flex-wrap gap-2">
            {result.strengths.map((s) => (
              <li key={s} className="rounded-full bg-lime px-4 py-2 text-[15px] font-extrabold text-bg">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.howToLoveMe && (
        <section
          aria-labelledby="love-me-title"
          className="flex flex-col gap-4 rounded-card border-2 border-orange/70 bg-surface p-5"
          style={{ backgroundImage: "radial-gradient(circle at 100% 0%, rgba(255,90,31,0.16), transparent 55%)" }}
        >
          <div className="flex flex-col gap-1">
            <h2 id="love-me-title" className="font-display text-xl font-bold">
              <Em text={`${loveHeading} ${listEmoji ?? "💌"}`} />
            </h2>
            {test.resultBlocks?.howToLoveMeHint && <p className="text-[15px] text-muted">{test.resultBlocks.howToLoveMeHint}</p>}
          </div>
          <ul className="flex flex-col gap-2.5">
            {result.howToLoveMe.map((item) => {
              const { label, text } = splitListLabel(item);
              return (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className={listEmoji ? "shrink-0" : "text-orange"}>
                    {listEmoji ? <Em text={listEmoji} /> : <GIcon name="heart" size="0.9em" />}
                  </span>
                  <span>
                    {label ? (
                      <>
                        <strong className="font-extrabold">{label}:</strong> {text}
                      </>
                    ) : (
                      text
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <CopyListButton
            heading={loveHeading}
            result={`${result.emoji} ${result.title}`}
            items={result.howToLoveMe}
            marker={listEmoji}
            label={blocks?.howToLoveMeCopy ?? "Скопировать для своего человека"}
            linkPath={`/test/${test.slug}`}
          />
        </section>
      )}

      {/* «Сравниться с партнёром 💎» — сразу после списка для партнёра, ведёт в «Для пар» → «Совместимость» */}
      {test.compat && (
        <section aria-label={test.compat.title ?? test.compat.button} className="diamond-glow flex flex-col gap-3 rounded-card bg-surface p-5">
          {test.compat.title && <h2 className="font-display text-xl font-bold text-balance">{test.compat.title}</h2>}
          {test.compat.text && <p className="leading-relaxed text-cream/85">{test.compat.text}</p>}
          <CompatLink testId={test.id} label={test.compat.button} />
        </section>
      )}

      {result.watchOut && (
        <InsightCard emoji="⚠" title="На что обратить внимание" accent="border-orange">
          {result.watchOut}
        </InsightCard>
      )}
      {result.tip && (
        <InsightCard emoji="💡" title="Совет" accent="border-lime">
          {result.tip}
        </InsightCard>
      )}
      <Extras extras={extrasAfter} />
      {result.care && (
        <section className="flex gap-3 rounded-card bg-surface-2/60 p-5">
          <span aria-hidden="true" className="text-2xl leading-none">
            <Em text="🤍" />
          </span>
          <p className="text-[15px] leading-relaxed text-cream/80">{result.care}</p>
        </section>
      )}
      {/* Тёплая строка с ❤️ — последний блок итога, перед «Глубже 💎» и шерингом */}
      {result.heart && (
        <section className="flex items-center justify-center gap-3 rounded-card bg-surface-2/60 px-5 py-4 text-center">
          <span aria-hidden="true" className="shrink-0 text-xl leading-none">
            <Em text="❤️" />
          </span>
          <p className="text-[15px] leading-relaxed text-balance text-cream/80">{result.heart}</p>
        </section>
      )}

      {result.button && <ResultButton label={result.button.label} test={result.button.test} soon={result.button.soon} from={test.id} />}

      {test.upsell ? (
        <section aria-labelledby="premium-get-title" className="diamond-glow flex flex-col gap-4 rounded-card bg-surface p-5">
          {/* Над крупным заголовком — мелко голубым капсом headline теста («Твоё мышление в деталях») */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#62D2FF]">
              <Lock aria-hidden="true" size={13} />
              {test.upsell.premium.headline ?? "Premium"}
            </div>
            <h2 id="premium-get-title" className="font-display text-2xl font-bold">
              {UPSELL_TITLE}
            </h2>
          </div>
          {/* Что человек получит в глубоком разборе; {weakestScale} подставится из шкал в адресе. Нет items — запасной текст */}
          {test.upsell.premium.items ? (
            <Suspense fallback={<DotList items={upsellItems(test.upsell.premium.items)} className={premiumTextClass} />}>
              <UpsellItems test={test} items={test.upsell.premium.items} className={premiumTextClass} />
            </Suspense>
          ) : (
            <Suspense fallback={<p className={premiumTextClass}>{fillPlaceholders(test.upsell.premium.text, {})}</p>}>
              <UpsellText test={test} text={test.upsell.premium.text} className={premiumTextClass} />
            </Suspense>
          )}
          <DeeperButton
            id={test.id}
            kind="test"
            source="result"
            label={test.upsell.button}
            href={`/test/${test.slug}/deeper`}
            keepQuery={hasScales}
          />
        </section>
      ) : (
        result.deepTeaser && (
          <DeepTeaser text={result.deepTeaser.text}>
            <DeeperButton id={test.id} kind="test" source="result" />
          </DeepTeaser>
        )
      )}

      {test.disclaimer && <p className="px-1 text-center text-sm text-muted">{test.disclaimer}</p>}

      <RelatedBlock item={test} />

      <nav aria-label="Что дальше" className="mt-4 flex flex-col gap-3">
        <Link href={`/test/${test.slug}`} className={buttonVariants({ variant: "ghost" })}>
          <Em text="Пройти ещё раз 🔄" />
        </Link>
        <BackToSection test={test} />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md", className: "text-muted hover:text-cream" })}>
          В меню
        </Link>
      </nav>
    </ShareProvider>
  );
}

/** «Вернуться в «Дневник»» (раздел solo). Если теста там нет — в его первый раздел. Названия — в sections.ts. */
function BackToSection({ test }: { test: Test }) {
  const section = getSection(test.sections.includes("solo") ? "solo" : (test.sections[0] ?? "solo"));
  if (!section) return null;
  return (
    <Link href={`/${section.id}`} className={buttonVariants({ variant: "outline" })}>
      Вернуться в «{stripEmoji(section.title)}»
    </Link>
  );
}

/** «Твой маршрут на выходные»: три точки — утро, день, вечер. */
function RouteBlock({ title, route }: { title: string; route: NonNullable<TestResult["route"]> }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-lg leading-tight font-bold"><Em text={`🗺 ${title}`} /></h2>
      <ol className="flex flex-col gap-3">
        {route.map((step) => (
          <li key={step.label} className="flex flex-col gap-0.5 border-l-2 border-orange pl-3">
            <span className="text-sm font-extrabold text-orange">{step.label}</span>
            <span className="leading-snug text-cream/90">{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** «Вайб-борд»: градиент из двух цветов с тремя эмодзи, чипы настроения музыки, локация и звук. */
function BoardBlock({ board, blocks }: { board: NonNullable<TestResult["board"]>; blocks: Test["resultBlocks"] }) {
  const [from, to] = board.colors;
  return (
    <section aria-label={blocks?.board ?? "Твой вайб-борд"} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-lg leading-tight font-bold"><Em text={`🎨 ${blocks?.board ?? "Твой вайб-борд"}`} /></h2>
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-4 rounded-2xl py-6 text-5xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {board.emojis.map((e) => (
          <span key={e}><Glyph emoji={e} size="1em" /></span>
        ))}
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Настроение музыки">
        {board.moods.map((m) => (
          <li key={m} className="rounded-full bg-surface-2 px-3.5 py-1.5 text-[15px] font-bold">
            {m}
          </li>
        ))}
      </ul>
      <p className="leading-snug">
        <b className="font-extrabold">{blocks?.boardPlace ?? "Локация"}:</b> <span className="text-cream/90">{board.place}</span>
      </p>
      <p className="leading-snug">
        <b className="font-extrabold">{blocks?.boardSound ?? "Звук"}:</b> <span className="text-cream/90">{board.sound}</span>
      </p>
    </section>
  );
}

/** «Вайб-совместимость»: с кем совпадаешь и кто разряжает. */
function CompatBlock({ compat, blocks }: { compat: NonNullable<TestResult["compat"]>; blocks: Test["resultBlocks"] }) {
  const title = blocks?.compat ?? "Совместимость";
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-lg leading-tight font-bold"><Em text={`💞 ${title}`} /></h2>
      <p className="border-l-4 border-lime pl-3 leading-snug">
        <b className="font-extrabold">{blocks?.compatMatch ?? "Совпадаешь"}:</b> <span className="text-cream/90">{compat.match}</span>
      </p>
      <p className="border-l-4 border-orange pl-3 leading-snug">
        <b className="font-extrabold">{blocks?.compatDrain ?? "Разряжает"}:</b> <span className="text-cream/90">{compat.drain}</span>
      </p>
    </section>
  );
}

/** Фишки теста (result.extras): «Твоя сцена», «Профессии под тебя», «Шанс дожить до финала» и т.п. */
function Extras({ extras }: { extras: NonNullable<TestResult["extras"]> }) {
  return (
    <>
      {extras.map((e) => (
        <section key={e.title} aria-label={e.title} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg leading-tight font-bold">
            {e.emoji && <span aria-hidden="true"><Em text={e.emoji} /></span>}
            {e.title}
          </h2>
          {e.big && <p className="font-display text-5xl leading-none font-black text-orange tabular-nums">{e.big}</p>}
          {e.text && <p className="leading-relaxed text-cream/85">{e.text}</p>}
          {e.items && e.chips && (
            <ul className="flex flex-wrap gap-2">
              {e.items.map((item) => (
                <li key={item} className="rounded-full bg-surface-2 px-3.5 py-1.5 text-[15px] font-bold">
                  {item}
                </li>
              ))}
            </ul>
          )}
          {e.items && !e.chips && (
            <ul className="flex flex-col gap-2">
              {e.items.map((item) => (
                <li key={item} className="flex gap-3 leading-[1.5]">
                  <span aria-hidden="true" className="flex h-[1.5em] shrink-0 items-center">
                    <span className="size-2 rounded-full bg-orange" />
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

function InsightCard({
  emoji,
  title,
  accent,
  children,
}: {
  emoji?: string;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-card border-l-4 bg-surface p-5", accent)}>
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold leading-tight">
        {emoji && <span aria-hidden="true"><Em text={emoji} /></span>}
        {title}
      </h2>
      <p className="leading-relaxed text-cream/85">{children}</p>
    </section>
  );
}
