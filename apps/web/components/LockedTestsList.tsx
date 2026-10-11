"use client";

// Платные тесты под замком 💎 в разделе. Тап — шторка с превью: зачем тест, что узнаешь, пример вопроса
// (первый виден, второй размыт) и «Открыть с Премиумом 💎». С Премиумом вопросов у этих тестов пока нет —
// без размытия и без кнопки, вместо неё плашка «Тест уже в работе».
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LockedTest, PremiumFile } from "@gazgame/content";
import { Button, cn } from "@gazgame/ui";
import { trackPreviewOpen, trackPreviewUnlockClick } from "@/lib/analytics";
import { usePremium } from "@/lib/premium";
import { BottomSheet } from "./BottomSheet";
import { LockedTestTile } from "./LockedTestTile";

/** Плашка вместо кнопки, когда Премиум уже включён (текст из задания основателя). */
const IN_WORK = "Тест уже в работе. С Премиумом откроется первым 💎";

export function LockedTestsList({
  tests,
  texts,
  sectionPath,
  initialOpen,
}: {
  tests: LockedTest[];
  texts: PremiumFile["preview"];
  /** Адрес раздела — куда вернуться после закрытия, если шторку открыли по старому адресу /locked/<slug>. */
  sectionPath: string;
  /** slug теста, чья шторка открыта сразу (/locked/<slug>). */
  initialOpen?: string;
}) {
  const router = useRouter();
  const premium = usePremium();
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const test = tests.find((t) => t.slug === open);

  // Пришли по старому адресу /locked/<slug> — шторка уже открыта, это тоже открытие превью (считаем один раз)
  const initial = tests.find((t) => t.slug === initialOpen);
  const tracked = useRef(false);
  useEffect(() => {
    if (!initial || tracked.current) return;
    tracked.current = true;
    trackPreviewOpen({ id: initial.id });
  }, [initial]);

  function close() {
    setOpen(null);
    if (initialOpen) router.replace(sectionPath, { scroll: false });
  }

  return (
    <>
      {tests.map((t) => (
        <LockedTestTile
          key={t.id}
          test={t}
          onOpen={() => {
            trackPreviewOpen({ id: t.id });
            setOpen(t.slug);
          }}
        />
      ))}

      <BottomSheet open={!!test} onClose={close} label={test?.title ?? ""}>
        {test && (
          <>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-5xl leading-none">
                {test.emoji}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-xl leading-tight font-bold">{test.title}</h2>
                <p className="text-[15px] leading-snug text-cream/80">{test.description}</p>
              </div>
            </div>

            {test.preview && (
              <section className="flex flex-col gap-1 rounded-card bg-surface p-4">
                <h3 className="text-xs font-extrabold tracking-wide text-[#62D2FF] uppercase">{texts.why}</h3>
                <p className="leading-snug">{test.preview.why}</p>
              </section>
            )}

            <section className="flex flex-col gap-2 rounded-card bg-surface p-4">
              <h3 className="text-xs font-extrabold tracking-wide text-[#62D2FF] uppercase">{texts.learn}</h3>
              <ul className="flex flex-col gap-1.5">
                {test.learn.slice(0, 3).map((item) => (
                  <li key={item} className="flex gap-2 leading-snug">
                    <span aria-hidden="true" className="text-lime">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {test.preview && (
              <section className="flex flex-col gap-3 rounded-card bg-surface p-4">
                <h3 className="text-xs font-extrabold tracking-wide text-[#62D2FF] uppercase">{texts.example}</h3>
                {test.preview.questions.slice(0, 2).map((q, i) => {
                  const hidden = i > 0 && !premium;
                  return (
                    <div
                      key={q.text}
                      aria-hidden={hidden || undefined}
                      className={cn("flex flex-col gap-2", hidden && "pointer-events-none blur-[5px] select-none")}
                    >
                      <p className="font-bold leading-snug">{q.text}</p>
                      <ul className="flex flex-col gap-1.5">
                        {q.options.map((o) => (
                          <li key={o} className="rounded-xl border border-line bg-bg px-3 py-2 text-[15px] leading-snug">
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            )}

            {premium ? (
              <p role="status" className="rounded-card border border-[#62D2FF]/50 bg-[#62D2FF]/10 p-4 text-center font-semibold text-[#9BE4FF]">
                {IN_WORK}
              </p>
            ) : (
              <Button
                variant="accent"
                className="diamond-glow-ring"
                onClick={() => {
                  trackPreviewUnlockClick({ id: test.id });
                  router.push("/premium");
                }}
              >
                {texts.unlock}
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={close}>
              {texts.close}
            </Button>
          </>
        )}
      </BottomSheet>
    </>
  );
}
