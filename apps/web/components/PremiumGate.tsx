"use client";

// Показывает children, если Премиум включён, иначе — locked (кнопку с замком).
// Нужен серверным экранам (итог теста), где сам хук usePremium не вызвать.
import type { ReactNode } from "react";
import { usePremium } from "@/lib/premium";

export function PremiumGate({ locked, children }: { locked: ReactNode; children: ReactNode }) {
  return <>{usePremium() ? children : locked}</>;
}
