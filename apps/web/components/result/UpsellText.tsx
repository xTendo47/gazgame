"use client";

// Текст upsell с подстановками: {weakestScale} — название самой слабой шкалы из адреса страницы.
// Если шкал в адресе нет, предложение с подстановкой просто не показывается.
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { fillPlaceholders } from "@gazgame/engine";
import { scalesFromQuery } from "@/lib/scale-query";

export function UpsellText({ test, text, className }: { test: Test; text: string; className?: string }) {
  const scales = scalesFromQuery(test, useSearchParams());
  return <p className={className}>{fillPlaceholders(text, { weakestScale: scales?.weakest.scale.title })}</p>;
}
