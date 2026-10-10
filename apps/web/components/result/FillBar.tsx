"use client";

// Полоска, которая заполняется от нуля, когда появляется на экране (расклад и шкалы на экране результата).
// Кому мешает движение — заполняется сразу, без анимации (начальное состояние одно и то же, чтобы сервер и браузер совпали).
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@gazgame/ui";

export function FillBar({ percent, className, delay = 0 }: { percent: number; className: string; delay?: number }) {
  const still = useReducedMotion() ?? false;
  const width = `${Math.max(Math.min(percent, 100), 3)}%`;
  return (
    <motion.div
      className={cn("h-full rounded-full", className)}
      initial={{ width: "0%" }}
      whileInView={{ width }}
      viewport={{ once: true, amount: 0.6 }}
      transition={still ? { duration: 0 } : { duration: 0.5, delay, ease: "easeOut" }}
    />
  );
}
