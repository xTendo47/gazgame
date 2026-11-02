// Настройки звука на устройстве: громкость «Музыка» и «Звуки» (0..1) и пауза музыки.
// Хранятся в localStorage; доступ запрещён (приватный режим) — работаем со значениями по умолчанию.
const KEY = "gazgame:audio";

export interface AudioPrefs {
  /** Громкость фоновой музыки, 0..1. */
  music: number;
  /** Громкость звуков интерфейса, 0..1. */
  sfx: number;
  /** Музыку поставили на паузу руками: после первого касания сама не заиграет. */
  paused: boolean;
}

export const DEFAULT_AUDIO_PREFS: AudioPrefs = { music: 0.5, sfx: 0.5, paused: false };

const clamp = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

export function readAudioPrefs(): AudioPrefs {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULT_AUDIO_PREFS };
    const data = JSON.parse(raw) as Partial<AudioPrefs>;
    return { music: clamp(data.music, DEFAULT_AUDIO_PREFS.music), sfx: clamp(data.sfx, DEFAULT_AUDIO_PREFS.sfx), paused: data.paused === true };
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

export function writeAudioPrefs(patch: Partial<AudioPrefs>): AudioPrefs {
  const next = { ...readAudioPrefs(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // сохранить не вышло — настройки поживут до закрытия вкладки
  }
  return next;
}
