"use client";

// Невидимая отметка: игру открыли. Пока её не доиграют до конца (recordGamePlayed), она висит в «Продолжить» на главной.
import { useEffect } from "react";
import { getProgress } from "@/lib/progress";

export function GameStartMarker({ id }: { id: string }) {
  useEffect(() => {
    getProgress().markGameStarted(id);
  }, [id]);
  return null;
}
