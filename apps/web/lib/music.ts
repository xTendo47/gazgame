// Музыка GAZ: один трек bg.mp3 на всё приложение, по кругу.
// Громкость — через Web Audio GainNode: на iPhone у audio.volume нет эффекта.
// Сейчас тут только то, что нужно заставке (старт, время трека, громкость).
// Плеер с виниловой кнопкой, паузой и ползунками «Музыка» / «Звуки» — Этап 3.
const SRC = "/audio/bg.mp3";
const DEFAULT_VOLUME = 0.7;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audio: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Для useSyncExternalStore: подписка на «заиграла / поставили на паузу». */
export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Играет ли музыка сейчас. */
export function isMusicPlaying(): boolean {
  return !!audio && !audio.paused;
}
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;

/** Тот же трек, что уже играет (или null, пока музыку не запускали). */
export function getMusic(): HTMLAudioElement | null {
  return audio;
}

/** Громкость 0..1. */
export function setMusicVolume(volume: number): void {
  if (gain) gain.gain.value = Math.min(1, Math.max(0, volume));
}

/**
 * Запускает трек с начала. Вызывать только из жеста пользователя (тап), иначе браузер не даст играть.
 * Возвращает элемент <audio>, по чьему currentTime заставка синхронизирует анимацию,
 * или null, если звук не получился (тогда заставка идёт по таймеру).
 */
export async function startMusic(): Promise<HTMLAudioElement | null> {
  try {
    if (!audio) {
      audio = new Audio(SRC);
      audio.loop = true;
      audio.preload = "auto";
      const Ctx = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
      if (Ctx) {
        ctx = new Ctx();
        gain = ctx.createGain();
        gain.gain.value = DEFAULT_VOLUME;
        ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      }
    }
    if (ctx?.state === "suspended") await ctx.resume();
    audio.currentTime = 0;
    await audio.play();
    notify();
    return audio;
  } catch {
    return null;
  }
}

/** Кнопка «Музыка» на полке: пауза и продолжение; если музыку ещё не запускали (заставку уже видели) — запускает. Из жеста пользователя. */
export async function toggleMusic(): Promise<void> {
  if (!audio) {
    await startMusic();
    return;
  }
  if (audio.paused) {
    if (ctx?.state === "suspended") await ctx.resume();
    await audio.play().catch(() => {});
  } else {
    audio.pause();
  }
  notify();
}
