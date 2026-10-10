"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@gazgame/ui";

interface PlayersFormProps {
  min: number;
  max: number;
  /** Подписи для полей, например ["Ты", "Партнёр"]. */
  placeholders?: string[];
  submitLabel?: string;
  /** Уже известные имена (например, сохранённые на устройстве). */
  initial?: readonly string[];
  onSubmit: (names: string[]) => void;
}

/** Ввод имён игроков. Все играют с одного телефона. */
export function PlayersForm({ min, max, placeholders = [], submitLabel = "Газ! 🔥", initial = [], onSubmit }: PlayersFormProps) {
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: Math.max(min, Math.min(initial.length, max)) }, (_, i) => initial[i] ?? ""),
  );
  const filled = names.map((n) => n.trim()).filter(Boolean);
  const unique = new Set(filled.map((n) => n.toLowerCase())).size === filled.length;
  const ready = filled.length >= min && unique;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit(filled);
      }}
    >
      <h2 className="font-display text-xl font-bold">Кто играет?</h2>
      {names.map((name, i) => (
        <div key={i} className="flex gap-2">
          <label className="sr-only" htmlFor={`player-${i}`}>
            Игрок {i + 1}
          </label>
          <input
            id={`player-${i}`}
            value={name}
            maxLength={20}
            autoComplete="off"
            placeholder={placeholders[i] ?? `Игрок ${i + 1}`}
            onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
            className="min-h-14 flex-1 rounded-card border border-line bg-surface px-4 text-lg font-semibold placeholder:text-muted/70 focus:border-lime focus:outline-none"
          />
          {names.length > min && (
            <button
              type="button"
              aria-label={`Убрать игрока ${i + 1}`}
              onClick={() => setNames(names.filter((_, j) => j !== i))}
              className="flex min-h-14 w-14 items-center justify-center rounded-card bg-surface text-muted hover:text-cream"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {names.length < max && (
        <Button variant="outline" size="md" onClick={() => setNames([...names, ""])}>
          <Plus aria-hidden="true" size={18} /> Добавить игрока
        </Button>
      )}
      {!unique && <p className="text-sm text-orange">Имена повторяются — сделайте их разными.</p>}
      <Button type="submit" variant="primary" disabled={!ready} className="mt-2">
        {submitLabel}
      </Button>
      {!ready && unique && <p className="text-center text-sm text-muted">Нужно минимум {min} имени</p>}
    </form>
  );
}
