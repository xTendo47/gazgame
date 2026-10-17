"use client";

// Кнопка-ссылка в конце итога: «Пройти «Здоровые ли у вас отношения? 🚦» →». Если теста ещё нет (soon), тап считается как «скоро».
import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@gazgame/ui";
import { trackSoonClick } from "@/lib/analytics";

export function ResultButton({ label, test, soon, from }: { label: string; test?: string; soon?: boolean; from: string }) {
  const [toast, setToast] = useState(false);
  if (test && !soon) {
    return (
      <Link href={`/test/${test}`} className={buttonVariants({ variant: "outline" })}>
        {label}
      </Link>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={() => {
          trackSoonClick({ id: `result:${from}:${label}` });
          setToast(true);
        }}
      >
        {label}
      </Button>
      {toast && (
        <p role="status" className="px-1 text-center text-sm text-muted">
          Скоро! Считаем, сколько людей ждут
        </p>
      )}
    </div>
  );
}
