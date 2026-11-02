// Музыка GAZ: один трек bg.mp3 на всё приложение, по кругу.
// Громкость — через Web Audio GainNode: на iPhone у audio.volume нет эффекта.
// Громкость и пауза запоминаются на устройстве (audio-prefs). Трек сам стартует после первого касания (autoStartOnFirstTouch),
// на паузу уходит, когда вкладка скрыта или телефон заблокирован, и сам продолжает при возврате.
import { readAudioPrefs, writeAudioPrefs } from "./audio-prefs";
const SRC = "/audio/bg.mp3";

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

/** Громкость музыки 0..1 (запоминается). */
export function setMusicVolume(volume: number): void {
  const v = Math.min(1, Math.max(0, volume));
  writeAudioPrefs({ music: v });
  if (gain && ctx) gain.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
  notify();
}

/** Текущая громкость музыки 0..1. */
export function getMusicVolume(): number {
  return readAudioPrefs().music;
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
        gain.gain.value = readAudioPrefs().music;
        ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      }
    }
    if (ctx?.state === "suspended") await ctx.resume();
    audio.currentTime = 0;
    await audio.play();
    writeAudioPrefs({ paused: false });
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
    writeAudioPrefs({ paused: false });
  } else {
    audio.pause();
    writeAudioPrefs({ paused: true });
  }
  autoPaused = false;
  notify();
}

// ---------- сама заиграла и сама уснула ----------

/** Музыку усыпила вкладка в фоне (а не человек): при возврате продолжаем. */
let autoPaused = false;
let lifecycleOn = false;

/**
 * Первое касание → музыка играет (если её не поставили на паузу руками); вкладка скрыта → пауза, вернулись → продолжает.
 * Вызывается один раз при старте приложения. Пока идёт заставка, музыку запускает она сама.
 */
export function initMusicLifecycle(): void {
  if (lifecycleOn || typeof document === "undefined") return;
  lifecycleOn = true;

  const first = () => {
    if (audio) return;
    if (document.querySelector(".gz-intro")) return; // заставка запускает трек сама, с синхронизацией
    if (readAudioPrefs().paused) return;
    void startMusic();
  };
  for (const name of ["pointerup", "keydown", "touchend"]) document.addEventListener(name, first, { capture: true, passive: true, once: false });

  const hide = () => {
    if (audio && !audio.paused) {
      audio.pause();
      autoPaused = true;
      notify();
    }
  };
  const show = () => {
    if (!autoPaused || !audio) return;
    autoPaused = false;
    void (async () => {
      if (ctx?.state === "suspended") await ctx.resume().catch(() => {});
      await audio?.play().catch(() => {});
      notify();
    })();
  };
  document.addEventListener("visibilitychange", () => (document.hidden ? hide() : show()));
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", show);
}
