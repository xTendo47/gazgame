"use client";

// После «Сделано 🔥»: огоньки, «Карта в Коллекции 🃏» и кнопка «В сторис».
// Картинку для сторис рисует сервер (/share/gaz, тот же движок next/og, что и у карточек тестов).
// Загружаем её заранее: делиться файлом нужно сразу по нажатию, пока телефон считает это действием человека.
import { useEffect, useState, type CSSProperties } from "react";
import type { GazTask } from "@gazgame/content";
import { cn } from "@gazgame/ui";
import { siteUrl } from "@/lib/share-card";
import { shareImage } from "@/lib/share";

/** Огоньки по кругу: 14 штук, три цвета, разная дальность. */
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 60 + (i % 3) * 26;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: ["#FF5A1F", "#D4FF3A", "#FFC83A"][i % 3] as string,
  };
});

export function DoneCard({ task, gold }: { task: GazTask; gold: boolean }) {
  const [image, setImage] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/share/gaz?${new URLSearchParams({ id: task.id, g: gold ? "1" : "0" })}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => alive && setImage(blob))
      .catch(() => alive && setStatus("Картинка не загрузилась. Проверь интернет и обнови страницу."));
    return () => {
      alive = false;
    };
  }, [task.id, gold]);

  async function share() {
    if (!image) return;
    const link = `${siteUrl(window.location.origin)}/gaz`;
    const outcome = await shareImage(image, `gaz-${task.id}.png`, `Мы сделали задание GAZ 🔥 ${link}`);
    if (outcome === "downloaded") setStatus("Картинка сохранена. Выложи её в сторис 🔥");
  }

  return (
    <div
      className={cn(
        "gaz-pop relative flex flex-col items-center gap-1.5 overflow-hidden rounded-3xl border bg-[linear-gradient(160deg,#2B2430,#1C1920)] p-[18px] text-center shadow-[0_14px_30px_rgb(0_0_0/0.45)]",
        gold ? "border-[#FFC83A] shadow-[0_0_24px_rgb(255_200_58/0.3)]" : "border-orange/60",
      )}
    >
      {SPARKS.map((s, i) => (
        <i
          key={i}
          aria-hidden="true"
          className="gaz-spark"
          style={{ "--dx": s.dx, "--dy": s.dy, background: s.color, boxShadow: `0 0 8px ${s.color}` } as CSSProperties}
        />
      ))}
      <span aria-hidden="true" className="text-[54px] leading-none">
        {task.emoji}
      </span>
      <b className="font-display text-lg font-extrabold">{gold ? "Золотая карта в Коллекции 🃏" : "Карта в Коллекции 🃏"}</b>
      <small className="text-[15px] text-muted">Выложи в сторис: «Мы сделали задание GAZ 🔥»</small>
      <button
        type="button"
        onClick={() => void share()}
        disabled={!image}
        className="gaz-press mt-2 min-h-12 w-full rounded-2xl bg-lime px-4 py-3 font-display text-base font-extrabold text-bg disabled:bg-[#2A2531] disabled:text-muted"
      >
        {image ? "В сторис" : "Рисуем картинку…"}
      </button>
      <p role="status" className="min-h-4 text-[13px] font-semibold text-lime">
        {status}
      </p>
    </div>
  );
}
