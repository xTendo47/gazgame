"use client";

// «Что ты получишь»: пункты upsell.premium.items с голубыми точками. {weakestScale} — самая слабая шкала из адреса;
// если шкал в адресе нет, пункт с подстановкой не показывается (как и предложение в UpsellText).
import { useSearchParams } from "next/navigation";
import type { Test } from "@gazgame/content";
import { scalesFromQuery } from "@/lib/result-query";
import { upsellItems } from "@/lib/upsell";
import { DotList } from "../DotList";

export function UpsellItems({ test, items, className }: { test: Test; items: readonly string[]; className?: string }) {
  const scales = scalesFromQuery(test, useSearchParams());
  return <DotList items={upsellItems(items, scales?.weakest.scale.title)} className={className} />;
}
