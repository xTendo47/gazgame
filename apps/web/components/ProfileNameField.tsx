"use client";

// Поле «Имя» в профиле: необязательное, сохраняется на устройстве. Первая буква — на жетоне главного стола.
import { useState } from "react";
import { profileInitial, setProfileName, useProfileName } from "@/lib/profile-name";

export function ProfileNameField() {
  const saved = useProfileName();
  // Пока печатаешь, показываем набранное как есть (пробелы между словами), а храним уже без пробелов по краям
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? saved;
  return (
    <label className="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3">
      <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-full bg-orange font-display text-lg font-extrabold text-bg">
        {profileInitial(saved)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-muted">Имя (необязательно)</span>
        <input
          type="text"
          value={name}
          maxLength={24}
          autoComplete="off"
          placeholder="Как тебя звать?"
          onChange={(e) => {
            setDraft(e.target.value);
            setProfileName(e.target.value);
          }}
          onBlur={() => setDraft(null)}
          className="mt-0.5 min-h-11 w-full bg-transparent text-[17px] font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lime"
        />
      </span>
    </label>
  );
}
