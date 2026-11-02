"use client";

// Панель «Музыка» под кнопкой-винилом на столе (эталон 14_muzyka_panel.png): круглая оранжевая кнопка «пауза / играть»,
// ползунки «Музыка» и «Звуки» с числом справа и название трека. Громкость и пауза запоминаются на устройстве.
// Громкость меняется через Web Audio GainNode (lib/music, lib/sfx): на iPhone у <audio>.volume эффекта нет.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { GIcon } from "@/components/casino/GIcon";
import { getMusicVolume, isMusicPlaying, setMusicVolume, subscribeMusic, toggleMusic } from "@/lib/music";
import { sfx } from "@/lib/sfx";
import "./music-panel.css";

function Slider({ label, icon, value, onChange, tone }: { label: string; icon: "music" | "speaker"; value: number; onChange: (v: number) => void; tone: "gold" | "orange" }) {
  const id = `mp-${tone}`;
  const percent = Math.round(value * 100);
  return (
    <div className="mp-row">
      <label htmlFor={id}>
        <GIcon name={icon} size="1.15em" />
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        data-tone={tone}
        data-silent
        style={{ "--v": `${percent}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-valuetext={`${percent} из 100`}
      />
      <output htmlFor={id}>{percent}</output>
    </div>
  );
}

export function MusicPanel({ onClose }: { onClose: () => void }) {
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);
  // громкость читаем с устройства уже после гидратации, чтобы разметка совпала с серверной
  const [music, setMusic] = useState(0.5);
  const [effects, setEffects] = useState(0.5);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setMusic(getMusicVolume());
      setEffects(sfx.getVolume());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // закрыть: тап мимо панели или Escape
  useEffect(() => {
    const away = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (ref.current?.contains(target) || target?.closest("[data-music-toggle]")) return;
      onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="mp-panel" role="group" aria-label="Музыка и звуки">
      <span className="mp-arrow" aria-hidden="true" />
      <button
        type="button"
        className="mp-play"
        aria-label={playing ? "Музыка: пауза" : "Музыка: играть"}
        onClick={() => {
          void toggleMusic();
        }}
      >
        <GIcon name={playing ? "pause" : "play"} size="1.7em" />
      </button>
      <div className="mp-rows">
        <Slider
          label="Музыка"
          icon="music"
          tone="gold"
          value={music}
          onChange={(v) => {
            setMusic(v);
            setMusicVolume(v);
          }}
        />
        <Slider
          label="Звуки"
          icon="speaker"
          tone="orange"
          value={effects}
          onChange={(v) => {
            setEffects(v);
            sfx.setVolume(v);
            sfx.click();
          }}
        />
      </div>
      <p className="mp-track">NAPHI — TIPTOES</p>
    </div>
  );
}
