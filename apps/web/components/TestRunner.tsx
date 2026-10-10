"use client";

// Прохождение теста: вопросы по одному → подсчёт в движке → экран результата.
// Работает с любым тестом из packages/content — сам ничего о тестах не знает.
// Если у теста есть версии (audience: «Парень» / «Девушка»), перед первым вопросом спрашиваем «Кто проходит?»;
// выбор запоминается на устройстве, тексты вопросов берутся для версии, а баллы и подсчёт общие.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Test } from "@gazgame/content";
import { audienceForLabel, isAudience, questionTexts, scoreTest } from "@gazgame/engine";
import { Button, ProgressBar } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";
import { needsScoresInQuery, scoreQuery } from "@/lib/result-query";

export function TestRunner({ test }: { test: Test }) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  /** Версия теста («Кто проходит?»); null — у теста версий нет или ещё не выбрали. */
  const [audience, setAudience] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const index = answers.length;
  const total = test.questions.length;
  const question = test.questions[index];

  function choose(optionIndex: number) {
    const next = [...answers, optionIndex];
    setAnswers(next);
    if (next.length === total) {
      const { resultId, blend, scores } = scoreTest(test, next);
      getProgress().saveTestResult(test.id, resultId);
      const path = `/test/${test.slug}/result/${resultId}${blend ? `/${blend.resultId}` : ""}`;
      router.push(needsScoresInQuery(test) ? path + scoreQuery(scores) : path);
    }
  }

  function start() {
    setStarted(true);
    if (!test.audience) return;
    // версию спрашиваем один раз: в следующий раз она уже выбрана
    const saved = getProgress().getAudience(test.id);
    if (isAudience(test, saved)) setAudience(saved);
    else setPicking(true);
  }

  function chooseAudience(id: string) {
    getProgress().saveAudience(test.id, id);
    setAudience(id);
    setPicking(false);
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        {test.intro && <p className="rounded-card border border-line bg-surface p-4 text-[15px]">{test.intro}</p>}
        <Button variant="primary" onClick={start}>
          Газ! 🔥
        </Button>
      </div>
    );
  }

  if (picking && test.audience) {
    return (
      <section aria-labelledby="audience-title" className="flex flex-col gap-4">
        <h2 id="audience-title" className="font-display text-2xl font-bold">
          {test.audience.title}
        </h2>
        {test.audience.options.map((o) => (
          <Button key={o.id} variant="primary" onClick={() => chooseAudience(o.id)}>
            {o.label}
          </Button>
        ))}
      </section>
    );
  }

  const audienceLabel = test.audience?.options.find((o) => o.id === audience)?.label;

  if (!question) {
    return <p className="text-center text-muted">Считаем результат…</p>;
  }

  // тексты для выбранной версии; ответы — в базовом порядке, баллы считаются по базе
  const view = questionTexts(question, audience);

  return (
    <div className="flex flex-col gap-6">
      {index === 0 && audienceLabel && (
        <p className="-mb-3 text-sm text-muted">
          {audienceForLabel(audienceLabel)} ·{" "}
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="min-h-11 rounded-full px-1 font-semibold underline underline-offset-4 hover:text-cream"
          >
            сменить
          </button>
        </p>
      )}
      <ProgressBar current={index + 1} total={total} label="Вопрос" />
      <AnimatePresence mode="wait">
        <motion.fieldset
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <legend className="mb-4 font-display text-2xl font-bold leading-tight">{view?.text}</legend>
          {view?.options.map((option, i) => (
            <Button key={i} variant="option" onClick={() => choose(i)}>
              {option}
            </Button>
          ))}
        </motion.fieldset>
      </AnimatePresence>
      {index > 0 && (
        <button
          type="button"
          onClick={() => setAnswers(answers.slice(0, -1))}
          className="min-h-11 self-center rounded-full px-4 text-[15px] font-semibold text-muted hover:text-cream"
        >
          ← Предыдущий вопрос
        </button>
      )}
    </div>
  );
}
