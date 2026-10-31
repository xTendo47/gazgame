// Звуки интерфейса GAZ: синтез на Web Audio (шум и тона), файлов нет. Набор и параметры — из макета v6.4 (объект SFX).
// Контекст создаётся при первом касании пальцем или клавишей (браузер иначе не даст играть звук).
// Громкость и выключатель «Звуки» (ползунки, сохранение) — Этап 3; пока звук включён, общая громкость 0.5.
import { haptic } from "./haptics";

const MASTER_VOLUME = 0.5;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
let armed = false;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function unlock(): void {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = enabled ? MASTER_VOLUME : 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  master.connect(comp);
  comp.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (ctx.state === "suspended") void ctx.resume();
}

/** Подписаться на первое касание: делается один раз при первом звуке. */
function arm(): void {
  if (armed || typeof document === "undefined") return;
  armed = true;
  for (const name of ["pointerdown", "keydown", "touchstart"]) document.addEventListener(name, unlock, { capture: true, passive: true });
}

const ready = () => !!ctx && !!master && !!noise && enabled;

interface NoiseOpts {
  at?: number;
  dur?: number;
  type?: BiquadFilterType;
  f?: number;
  f2?: number;
  q?: number;
  g?: number;
  a?: number;
}
interface ToneOpts {
  at?: number;
  dur?: number;
  type?: OscillatorType;
  f?: number;
  f2?: number;
  g?: number;
  a?: number;
  hold?: number;
}

/** Всплеск шума через фильтр. */
function nz({ at = 0, dur = 0.1, type = "bandpass", f = 1000, f2 = 0, q = 1, g = 0.1, a = 0.004 }: NoiseOpts): void {
  if (!ready() || !ctx || !master || !noise) return;
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  const fl = ctx.createBiquadFilter();
  const v = ctx.createGain();
  src.buffer = noise;
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  fl.Q.value = q;
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(g, t + a);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl);
  fl.connect(v);
  v.connect(master);
  src.start(t, rnd(0, 1.5), dur + 0.05);
  src.stop(t + dur + 0.06);
}

/** Короткий тон со скольжением высоты. */
function tn({ at = 0, dur = 0.12, type = "sine", f = 440, f2 = 0, g = 0.1, a = 0.004, hold = 0 }: ToneOpts): void {
  if (!ready() || !ctx || !master) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const v = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(g, t + a);
  if (hold) v.gain.setValueAtTime(g, t + a + hold);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(v);
  v.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Все звуки. Каждый вызов безопасен: нет звука (запрет браузера, выключено) — просто тишина. */
export const sfx = {
  press() {
    arm();
    nz({ dur: 0.05, type: "lowpass", f: 900, g: 0.12, a: 0.002 });
    tn({ dur: 0.07, f: 150, f2: 90, g: 0.08 });
  },
  click(at = 0) {
    arm();
    nz({ at, dur: 0.018, type: "highpass", f: 3200, g: 0.2, a: 0.001 });
    tn({ at, dur: 0.03, type: "square", f: 1800, f2: 900, g: 0.02, a: 0.001 });
  },
  chain() {
    arm();
    for (let i = 0; i < 5; i++) nz({ at: i * 0.032 + rnd(0, 0.01), dur: 0.022, type: "bandpass", f: rnd(3800, 5600), q: 7, g: 0.06, a: 0.001 });
  },
  hum(at = 0) {
    tn({ at, dur: 2.6, f: 100, g: 0.016, a: 0.5, hold: 0.9 });
    tn({ at, dur: 2.6, f: 50, g: 0.012, a: 0.5, hold: 0.9 });
    tn({ at, dur: 2.2, f: 150, g: 0.004, a: 0.6, hold: 0.5 });
  },
  /** Лампочка на цепочке: звякнула цепочка, щелчок выключателя, гул. */
  lamp() {
    sfx.chain();
    sfx.click(0.16);
    sfx.hum(0.2);
  },
  /** Крышка коробки скользит. */
  lid() {
    arm();
    nz({ dur: 0.55, type: "lowpass", f: 500, f2: 1700, q: 0.7, g: 0.14, a: 0.14 });
    nz({ at: 0.05, dur: 0.42, type: "bandpass", f: 2600, f2: 1300, q: 1.3, g: 0.03, a: 0.1 });
  },
  thump(v = 0.6) {
    arm();
    tn({ dur: 0.2, f: 88, f2: 46, g: 0.32 * v, a: 0.003 });
    nz({ dur: 0.09, type: "lowpass", f: 520, g: 0.2 * v, a: 0.002 });
  },
  /** Шорох бумаги. */
  rustle(n = 16, len = 0.6) {
    arm();
    for (let i = 0; i < n; i++) nz({ at: rnd(0, len), dur: rnd(0.03, 0.1), type: "bandpass", f: rnd(2400, 7200), q: rnd(0.7, 2), g: rnd(0.025, 0.07), a: 0.006 });
  },
  riffle(at = 0, n = 12, step = 0.035) {
    arm();
    for (let i = 0; i < n; i++) nz({ at: at + i * step + rnd(-0.004, 0.004), dur: 0.02, type: "highpass", f: rnd(2600, 4200), g: rnd(0.08, 0.13), a: 0.001 });
    nz({ at, dur: n * step + 0.05, type: "bandpass", f: 3200, q: 0.6, g: 0.02, a: 0.05 });
    nz({ at: at + n * step + 0.02, dur: 0.07, type: "lowpass", f: 900, g: 0.08, a: 0.003 });
  },
  swish(at = 0) {
    arm();
    nz({ at, dur: 0.17, type: "bandpass", f: 800, f2: 3400, q: 1.3, g: 0.06, a: 0.06 });
  },
  tap(at = 0) {
    arm();
    nz({ at, dur: 0.03, type: "lowpass", f: 1900, g: 0.1, a: 0.001 });
    tn({ at, dur: 0.05, f: 230, f2: 140, g: 0.04, a: 0.002 });
  },
  flip() {
    arm();
    nz({ dur: 0.06, type: "bandpass", f: 2700, f2: 1500, q: 1.5, g: 0.11, a: 0.004 });
    tn({ at: 0.045, dur: 0.04, f: 320, f2: 200, g: 0.035 });
  },
  rattle(burst = false) {
    arm();
    const n = burst ? 7 : 4;
    for (let i = 0; i < n; i++) nz({ at: i * 0.024 + rnd(0, 0.014), dur: 0.02, type: "bandpass", f: rnd(1700, 3300), q: 4, g: rnd(0.04, 0.09), a: 0.001 });
  },
  knock(v = 0.5, at = 0) {
    arm();
    const k = Math.min(1, v);
    if (k < 0.06) return;
    tn({ at, dur: 0.08, f: rnd(240, 330), f2: 150, g: 0.17 * k, a: 0.001 });
    nz({ at, dur: 0.045, type: "lowpass", f: 1500, g: 0.11 * k, a: 0.001 });
  },
  clack(v = 0.5) {
    arm();
    const k = Math.min(1, Math.max(0.2, v));
    nz({ dur: 0.016, type: "bandpass", f: rnd(3600, 4600), q: 5, g: 0.1 * k, a: 0.001 });
    tn({ dur: 0.03, f: rnd(1900, 2300), g: 0.02 * k, a: 0.001 });
  },
  seal() {
    arm();
    tn({ dur: 0.24, f: 115, f2: 52, g: 0.26, a: 0.004 });
    nz({ dur: 0.2, type: "lowpass", f: 950, f2: 280, g: 0.11, a: 0.01 });
    nz({ at: 0.07, dur: 0.15, type: "bandpass", f: 700, f2: 240, q: 3, g: 0.05, a: 0.02 });
  },
  cover() {
    arm();
    nz({ dur: 0.03, type: "bandpass", f: 2100, q: 3, g: 0.09, a: 0.001 });
    tn({ dur: 0.08, type: "triangle", f: 480, f2: 950, g: 0.025 });
  },
  clunk() {
    arm();
    tn({ dur: 0.18, type: "triangle", f: 140, f2: 58, g: 0.3, a: 0.002 });
    nz({ dur: 0.1, type: "lowpass", f: 620, g: 0.2, a: 0.001 });
  },
  alarm() {
    arm();
    [0, 0.15, 0.3].forEach((d, i) => tn({ at: 0.14 + d, dur: 0.1, type: "square", f: i % 2 ? 660 : 880, g: 0.03, a: 0.005, hold: 0.05 }));
  },
  frost() {
    arm();
    for (let i = 0; i < 24; i++) nz({ at: rnd(0, 0.6), dur: rnd(0.008, 0.022), type: "highpass", f: rnd(4200, 8500), g: rnd(0.03, 0.08), a: 0.001 });
    tn({ dur: 0.8, f: 2600, f2: 3500, g: 0.01, a: 0.25 });
    tn({ dur: 0.8, f: 3950, g: 0.006, a: 0.3 });
  },
  /** Страница перевернулась (правила, обои). */
  page() {
    arm();
    nz({ dur: 0.3, type: "bandpass", f: 1100, f2: 4300, q: 0.9, g: 0.08, a: 0.07 });
    nz({ at: 0.2, dur: 0.06, type: "lowpass", f: 1500, g: 0.05, a: 0.005 });
  },
  lock() {
    arm();
    [0, 0.07, 0.15, 0.23].forEach((d) => nz({ at: d, dur: 0.03, type: "bandpass", f: rnd(2200, 3400), q: 12, g: 0.12, a: 0.001 }));
    tn({ at: 0.23, dur: 0.22, f: 2900, g: 0.01, a: 0.002 });
  },
  tin() {
    arm();
    nz({ dur: 0.05, type: "bandpass", f: 3000, q: 8, g: 0.1, a: 0.001 });
    tn({ dur: 0.25, type: "triangle", f: 620, f2: 1240, g: 0.035, a: 0.003 });
  },
  tear() {
    arm();
    nz({ dur: 0.32, type: "bandpass", f: 1800, f2: 5200, q: 1.2, g: 0.07, a: 0.02 });
    sfx.rustle(5, 0.25);
  },
  /** Звук интерфейса включён? */
  isOn: () => enabled,
  /** Включить или выключить все звуки (ползунки «Звуки» — Этап 3). */
  set(on: boolean) {
    enabled = on;
    if (master && ctx) master.gain.setTargetAtTime(on ? MASTER_VOLUME : 0, ctx.currentTime, 0.03);
  },
  /** Подготовить звук заранее (например, при показе экрана), чтобы первый звук не опоздал. */
  arm,
  /** Тактильный отклик вместе со звуком. */
  haptic,
};
