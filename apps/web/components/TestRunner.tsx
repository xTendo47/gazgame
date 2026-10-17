"use client";

// Прохождение теста: вопросы по одному → подсчёт в движке → экран результата.
// Работает с любым тестом из packages/content — сам ничего о тестах не знает.
// Если у теста есть версии (audience: «Парень» / «Девушка»), перед первым вопросом спрашиваем «Кто проходит?»;
// выбор запоминается на устройстве, тексты вопросов берутся для версии, а баллы и подсчёт общие.
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Test } from "@gazgame/content";
import { audienceForLabel, isAudience, isTopTie, questionTexts, resumeAnswers, scoreTest, testCard, typeRanking } from "@gazgame/engine";
import { Button, ProgressBar } from "@gazgame/ui";
import { announceCard } from "@/lib/collection";
import { getProgress } from "@/lib/progress";
import { needsScoresInQuery, scoreQuery } from "@/lib/result-query";

const noSubscribe = () => () => {};

/**
 * Незаконченный тест продолжается с того же вопроса («Продолжить» на главной). Ответы лежат на устройстве, поэтому читаем их
 * только после гидратации: сначала рисуем чистый тест (как на сервере), потом он пересоздаётся уже с сохранёнными ответами.
 */
export function TestRunner({ test }: { test: Test }) {
  const client = useSyncExternalStore(noSubscribe, () => true, () => false);
  return <Runner key={client ? "client" : "server"} test={test} restore={client} />;
}

function Runner({ test, restore }: { test: Test; restore: boolean }) {
  const router = useRouter();
  const [saved] = useState(() => (restore ? resumeAnswers(test, getProgress().getTestProgress(test.id)) : null));
  const [started, setStarted] = useState(saved !== null);
  const [answers, setAnswers] = useState<number[]>(saved ?? []);
  /** Версия теста («Кто проходит?»); null — у теста версий нет или ещё не выбрали. */
  const [audience, setAudience] = useState<string | null>(() => {
    if (saved === null || !test.audience) return null;
    const chosen = getProgress().getAudience(test.id);
    return isAudience(test, chosen) ? chosen : null;
  });
  const [picking, setPicking] = useState(saved !== null && !!test.audience && audience === null);

  const index = answers.length;
  const total = test.questions.length;
  const question = test.questions[index];

  function choose(optionIndex: number) {
    const next = [...answers, optionIndex];
    setAnswers(next);
    // ответы на устройстве: тест можно закрыть и продолжить с главной; дошёл до итога — запись удаляется
    if (next.length < total) getProgress().saveTestProgress(test.id, next);
    else getProgress().clearTestProgress(test.id);
    if (next.length === total) {
      const { resultId, blend, scores } = scoreTest(test, next);
      // Последний итог теста лежит на устройстве: из него собирается карта Коллекции. Ничья: второй итог тоже на карте
      const ranking = typeRanking(test, scores, { resultId, blendId: blend?.resultId });
      const tieId = isTopTie(ranking) ? ranking?.[1]?.result.id : undefined;
      const previous = getProgress().getTestResult(test.id);
      getProgress().saveTestResult(test.id, resultId, new Date(), tieId);
      // новый итог (первое прохождение или другой результат) — «Новая карта в Коллекции 🃏»
      if (!previous || previous.resultId !== resultId || previous.tieId !== tieId) announceCard(testCard(test, resultId, tieId));
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
          onClick={() => {
            const back = answers.slice(0, -1);
            setAnswers(back);
            getProgress().saveTestProgress(test.id, back);
          }}
          className="min-h-11 self-center rounded-full px-4 text-[15px] font-semibold text-muted hover:text-cream"
        >
          ← Предыдущий вопрос
        </button>
      )}
    </div>
  );
}
