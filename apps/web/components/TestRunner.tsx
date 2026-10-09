"use client";

// Прохождение теста: вопросы по одному → подсчёт в движке → экран результата.
// Работает с любым тестом из packages/content — сам ничего о тестах не знает.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Test } from "@gazgame/content";
import { scoreTest } from "@gazgame/engine";
import { Button, ProgressBar } from "@gazgame/ui";
import { getProgress } from "@/lib/progress";

export function TestRunner({ test }: { test: Test }) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const index = answers.length;
  const total = test.questions.length;
  const question = test.questions[index];

  function choose(optionIndex: number) {
    const next = [...answers, optionIndex];
    setAnswers(next);
    if (next.length === total) {
      const { resultId, blend } = scoreTest(test, next);
      getProgress().saveTestResult(test.id, resultId);
      router.push(`/test/${test.slug}/result/${resultId}${blend ? `/${blend.resultId}` : ""}`);
    }
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        {test.intro && <p className="rounded-card border border-line bg-surface p-4 text-[15px]">{test.intro}</p>}
        <Button variant="primary" onClick={() => setStarted(true)}>
          Газ! 🔥
        </Button>
      </div>
    );
  }

  if (!question) {
    return <p className="text-center text-muted">Считаем результат…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
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
          <legend className="mb-4 font-display text-2xl font-bold leading-tight">{question.text}</legend>
          {question.options.map((option, i) => (
            <Button key={i} variant="option" onClick={() => choose(i)}>
              {option.text}
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
