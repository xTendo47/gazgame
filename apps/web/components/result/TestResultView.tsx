// Экран результата теста. Общий для обычного результата и смешанного («Холерик с нотками меланхолика»).
// Показывает только те блоки, что есть в JSON: старые тесты (text + deepTeaser) выглядят как раньше.
// У тестов по шкалам (scales) баллы шкал приходят в адресе страницы — их показывает ScalesPanel.
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { Test, TestResult } from "@gazgame/content";
import { scalesConfig, type TestBlend } from "@gazgame/engine";
import { Badge, buttonVariants, cn, DeepTeaser } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { DeeperButton } from "@/components/DeeperButton";
import { RelatedBlock } from "@/components/RelatedBlock";
import { ShareResult } from "@/components/ShareResult";
import { ScalesPanel } from "./ScalesPanel";

/** Полное название результата: «Холерик» или «Холерик с нотками меланхолика 🌙». */
export function resultTitle(result: TestResult, blend?: Pick<TestBlend, "note">): string {
  return blend ? `${result.title} ${blend.note.title}` : result.title;
}

export function resultDescription(result: TestResult): string | undefined {
  return result.paragraphs?.[0] ?? result.text;
}

export function TestResultView({ test, result, blend }: { test: Test; result: TestResult; blend?: TestBlend }) {
  const paragraphs = result.paragraphs ?? [];
  const hasScales = scalesConfig(test) !== null;

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

      {hasScales && (
        // Шкалы читаются из адреса уже в браузере; страница при этом остаётся статической.
        <Suspense fallback={null}>
          <ScalesPanel test={test} range={result.range} />
        </Suspense>
      )}

      {blend && (
        <InsightCard title={resultTitle(result, blend)} accent="border-cream">
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

      <ShareResult
        fileName={`gazgame-${test.slug}-${result.id}${blend ? `-${blend.resultId}` : ""}`}
        shareText={result.shareText}
        card={{
          label: test.title,
          emoji: result.emoji,
          title: resultTitle(result, blend),
          text: result.subtitle ?? result.text,
        }}
      />

      <Link href={`/test/${test.slug}`} className={buttonVariants({ variant: "ghost" })}>
        Пройти ещё раз 🔄
      </Link>

      {test.disclaimer && <p className="px-1 text-center text-sm text-muted">{test.disclaimer}</p>}

      <RelatedBlock item={test} />
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
        {emoji && <span aria-hidden="true">{emoji}</span>}
        {title}
      </h2>
      <p className="leading-relaxed text-cream/85">{children}</p>
    </section>
  );
}
