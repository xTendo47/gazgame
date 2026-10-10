// Экран результата теста. Общий для обычного результата и смешанного («Холерик с нотками меланхолика»).
// Показывает только те блоки, что есть в JSON: старые тесты (text + deepTeaser) выглядят как раньше.
// У тестов по шкалам (scales) и с полосками всех типов (showRanking) баллы приходят в адресе страницы —
// их показывают ScalesPanel и RankingPanel.
// Второй тип смешанного результата (blendNotes) всегда идёт отдельной строкой, к названию не приклеивается.
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Test, TestResult } from "@gazgame/content";
import { scalesConfig, scoringConfig, splitListLabel, type TestBlend } from "@gazgame/engine";
import { Badge, buttonVariants, cn, DeepTeaser } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { DeeperButton } from "@/components/DeeperButton";
import { RelatedBlock } from "@/components/RelatedBlock";
import { getSection } from "@/lib/sections";
import { CopyListButton } from "./CopyListButton";
import { FlexMenu } from "./FlexMenu";
import { RankingPanel } from "./RankingPanel";
import { ScalesPanel } from "./ScalesPanel";

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

export function TestResultView({ test, result, blend }: { test: Test; result: TestResult; blend?: TestBlend }) {
  const paragraphs = result.paragraphs ?? [];
  const hasScales = scalesConfig(test) !== null;
  const config = scoringConfig(test);
  const showRanking = config.type === "types" && config.showRanking === true;
  // Блок списка: у «Языков любви» — 💌 и ♥, у других тестов свой эмодзи и своя надпись на кнопке (resultBlocks)
  const blocks = test.resultBlocks;
  const loveHeading = blocks?.howToLoveMe ?? "Как меня любить";
  const listEmoji = blocks?.howToLoveMeEmoji;

  return (
    <>
      <BackLink href={`/${test.sections[0] ?? ""}`}>Все тесты</BackLink>

      <section className="flex flex-col items-center gap-3 rounded-card bg-orange px-6 pt-8 pb-7 text-center text-bg">
        <div className="text-sm font-extrabold uppercase tracking-wide">
          {test.emoji} {test.title} · твой результат
        </div>
        <div aria-hidden="true" className="relative text-7xl leading-none">
          {result.emoji}
          {blend && (
            <span className="absolute -right-7 -bottom-1 rounded-full bg-bg p-1.5 text-3xl leading-none">
              {blend.result.emoji}
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl font-black">{result.title}</h1>
        {blend && <p className="-mt-2 text-lg font-bold">{blend.note.title}</p>}
        {result.subtitle && (
          <p className="rounded-full bg-bg px-4 py-1 text-sm font-extrabold uppercase tracking-wide text-orange">
            {result.subtitle}
          </p>
        )}
        {result.text && <p className="text-lg font-semibold">{result.text}</p>}
      </section>
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

      {hasScales && (
        // Шкалы читаются из адреса уже в браузере; страница при этом остаётся статической.
        <Suspense fallback={null}>
          <ScalesPanel test={test} range={result.range} />
        </Suspense>
      )}

      {blend && (
        <InsightCard title={capitalize(blend.note.title)} accent="border-cream">
          {blend.note.text}
        </InsightCard>
      )}

      {result.strengths && result.strengths.length > 0 && (
        <section aria-labelledby="strengths-title" className="flex flex-col gap-3">
          <h2 id="strengths-title" className="font-display text-xl font-bold">
            Твои сильные стороны 💪
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
              {loveHeading} {listEmoji ?? "💌"}
            </h2>
            {test.resultBlocks?.howToLoveMeHint && <p className="text-[15px] text-muted">{test.resultBlocks.howToLoveMeHint}</p>}
          </div>
          <ul className="flex flex-col gap-2.5">
            {result.howToLoveMe.map((item) => {
              const { label, text } = splitListLabel(item);
              return (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className={listEmoji ? "shrink-0" : "text-orange"}>
                    {listEmoji ?? "♥"}
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

      {result.watchOut && (
        <InsightCard emoji="⚠️" title="На что обратить внимание" accent="border-orange">
          {result.watchOut}
        </InsightCard>
      )}
      {result.tip && (
        <InsightCard emoji="💡" title="Совет" accent="border-lime">
          {result.tip}
        </InsightCard>
      )}
      {result.care && (
        <section className="flex gap-3 rounded-card bg-surface-2/60 p-5">
          <span aria-hidden="true" className="text-2xl leading-none">
            🤍
          </span>
          <p className="text-[15px] leading-relaxed text-cream/80">{result.care}</p>
        </section>
      )}

      {test.upsell ? (
        <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-lime">
            <Lock aria-hidden="true" size={16} />
            Premium
          </div>
          {test.upsell.premium.headline && (
            <p className="-mt-2 font-display text-xl font-bold">{test.upsell.premium.headline}</p>
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

      <Link href={`/test/${test.slug}`} className={buttonVariants({ variant: "ghost" })}>
        Пройти ещё раз 🔄
      </Link>

      {test.disclaimer && <p className="px-1 text-center text-sm text-muted">{test.disclaimer}</p>}

      <RelatedBlock item={test} />

      <nav aria-label="Что дальше" className="mt-4 flex flex-col gap-3">
        <FlexMenu
          linkPath={`/test/${test.slug}`}
          fileName={`gazgame-${test.slug}-${result.id}${blend ? `-${blend.resultId}` : ""}`}
          shareText={result.shareText}
          card={{
            label: test.title,
            emoji: result.emoji,
            title: result.title,
            text: blend ? blend.note.title : (result.subtitle ?? result.text),
          }}
        />
        <BackToSection test={test} />
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "md", className: "text-muted hover:text-cream" })}>
          В меню
        </Link>
      </nav>
    </>
  );
}

/** «Вернуться в «Познай себя»» (раздел solo). Если теста там нет — в его первый раздел. Названия — в sections.ts. */
function BackToSection({ test }: { test: Test }) {
  const section = getSection(test.sections.includes("solo") ? "solo" : (test.sections[0] ?? "solo"));
  if (!section) return null;
  return (
    <Link href={`/${section.id}`} className={buttonVariants({ variant: "outline" })}>
      Вернуться в «{section.title}» {section.emoji}
    </Link>
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
        {emoji && <span aria-hidden="true">{emoji}</span>}
        {title}
      </h2>
      <p className="leading-relaxed text-cream/85">{children}</p>
    </section>
  );
}
