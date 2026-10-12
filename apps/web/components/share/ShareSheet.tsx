"use client";

// Меню «Куда кидаем?» для итога теста: превью настоящей картинки (тот же PNG, что уйдёт в сторис) и каналы.
// Открывается большой кнопкой под главным блоком итога и иконкой в шапке экрана (ShareProvider).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Share2, X } from "lucide-react";
import type { Test, TestResult } from "@gazgame/content";
import { answerBackMessage, findResult, scalesConfig, shareMessage } from "@gazgame/engine";
import { Button, cn } from "@gazgame/ui";
import { trackShareClick, trackShareKind, type ShareChannel } from "@/lib/analytics";
import { usePremium } from "@/lib/premium";
import { copyText } from "@/lib/clipboard";
import { mainPercent, shareImagePath, shareLink, siteUrl, topScale, type ShareKind, type ShareParams } from "@/lib/share-card";

interface ShareTarget {
  test: Test;
  resultId: string;
  blendId?: string;
}

/** С чем открыть меню: answerTo — «ответка» другу (свой текст сообщения). */
export interface ShareOpenOptions {
  answerTo?: TestResult;
}

const ShareContext = createContext<((options?: ShareOpenOptions) => void) | null>(null);

/** Даёт кнопкам «поделиться» на экране итога одно общее меню. */
export function ShareProvider({ children, ...target }: ShareTarget & { children: ReactNode }) {
  const [open, setOpen] = useState<ShareOpenOptions | null>(null);
  const openSheet = useCallback((options: ShareOpenOptions = {}) => setOpen(options), []);
  return (
    <ShareContext.Provider value={openSheet}>
      {children}
      <AnimatePresence>{open && <ShareSheet {...target} {...open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </ShareContext.Provider>
  );
}

export function useOpenShare() {
  const open = useContext(ShareContext);
  if (!open) throw new Error("Кнопка «поделиться» должна быть внутри ShareProvider");
  return open;
}

/** Большая кнопка под главным блоком итога: «Показать состав 🧪», «Пофлексить 🧊»… */
export function ShareButton({ label }: { label: string }) {
  const open = useOpenShare();
  return (
    <Button variant="primary" onClick={() => open()}>
      {label}
    </Button>
  );
}

/** Маленькая иконка «поделиться» в шапке экрана. */
export function ShareIconButton() {
  const open = useOpenShare();
  return (
    <button
      type="button"
      aria-label="Поделиться"
      onClick={() => open()}
      className="flex size-11 items-center justify-center rounded-full bg-surface text-cream transition hover:bg-surface-2"
    >
      <Share2 aria-hidden="true" size={20} />
    </button>
  );
}

/** Баллы из адреса страницы результата (те же ключи, что в lib/result-query.ts). */
function scoresFromLocation(test: Test): Record<string, number> {
  const params = new URLSearchParams(window.location.search);
  const ids = scalesConfig(test)?.scales.map((s) => s.id) ?? test.results.map((r) => r.id);
  const scores: Record<string, number> = {};
  for (const id of ids) {
    const raw = params.get(id);
    if (raw !== null && /^\d+$/.test(raw)) scores[id] = Number(raw);
  }
  return scores;
}

/** Телефон или компьютер: на компьютере вместо системного меню — «Скопировать текст» и «Скачать картинку». */
function isDesktop(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Swag 😎 — чтобы выпендриться, Facts 📋 — факты о себе. */
const KINDS: { value: ShareKind; label: string }[] = [
  { value: "swag", label: "Swag 😎" },
  { value: "facts", label: "Facts 📋" },
];

function ShareSheet({ test, resultId, blendId, answerTo, onClose }: ShareTarget & ShareOpenOptions & { onClose: () => void }) {
  const result = findResult(test, resultId);
  // Всё, что зависит от адреса страницы, считаем один раз при открытии
  const [ctx] = useState(() => {
    const scores = scoresFromLocation(test);
    const link = shareLink(siteUrl(window.location.origin), test, { resultId, blendId, scores });
    return { scores, link, desktop: isDesktop() };
  });
  // Какая карточка над картинкой: Swag 😎 (по умолчанию) или Facts 📋 — с процентами и сильными сторонами
  const [kind, setKind] = useState<ShareKind>("swag");
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [status, setStatus] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Значок 💎 в углу картинки у тех, у кого Premium
  const premium = usePremium();
  const params: ShareParams = useMemo(
    () => ({ slug: test.slug, resultId, blendId, scores: ctx.scores, stats: kind === "facts", premium, kind }),
    [test.slug, resultId, blendId, ctx.scores, kind, premium],
  );
  const imagePath = shareImagePath(params);
  const message = !result
    ? ctx.link
    : answerTo
      ? answerBackMessage(result, answerTo, ctx.link)
      : shareMessage(test, result, { link: ctx.link, pct: mainPercent(test, params), topScale: topScale(test, ctx.scores) });

  // Картинку грузим заранее: делиться файлом нужно сразу по нажатию, пока телефон считает это действием человека
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    fetch(imagePath)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ url: objectUrl, blob });
      })
      .catch(() => alive && setStatus("Картинка не загрузилась. Проверь интернет и открой меню ещё раз."));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath]);

  // Закрытие по Esc, фокус в панель, страница под панелью не прокручивается
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const fileName = `gazgame-${test.slug}-${resultId}.png`;
  // Куда поделились и какую карточку выбрали (share_swag / share_facts)
  const track = (channel: ShareChannel) => {
    trackShareClick({ id: test.id, channel });
    trackShareKind({ id: test.id, kind });
  };

  function shareStory() {
    track("story");
    // ссылку копируем сразу: в сторис её добавляют стикером «Ссылка»
    void copyText(ctx.link).then((ok) => ok && setStatus("Ссылка скопирована. Добавь в сторис стикер «Ссылка» 🔗"));
    const file = image && new File([image.blob], fileName, { type: "image/png" });
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {});
    } else {
      setFullscreen(true);
    }
  }

  function shareTelegram() {
    track("telegram");
    const text = message.replace(ctx.link, "").trim();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(ctx.link)}&text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  async function copyMessageText() {
    setStatus((await copyText(message)) ? "Текст со ссылкой скопирован ✅" : "Не получилось скопировать — выдели текст вручную.");
  }

  function shareFriend() {
    track("other");
    if (navigator.share) navigator.share({ text: message }).catch(() => {});
    else void copyMessageText();
  }

  function copyMessage() {
    track("other");
    void copyMessageText();
  }

  async function copyLink() {
    track("copy");
    setStatus((await copyText(ctx.link)) ? "Ссылка скопирована ✅" : `Не получилось скопировать. Вот ссылка: ${ctx.link}`);
  }

  function save() {
    track("save");
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = fileName;
    a.click();
  }

  const tiles: { label: string; onClick: () => void }[] = ctx.desktop
    ? [
        { label: "В Telegram ✈️", onClick: shareTelegram },
        { label: "Скопировать текст 💬", onClick: copyMessage },
        { label: "Скачать картинку ⬇️", onClick: save },
        { label: "Ссылка 🔗", onClick: () => void copyLink() },
      ]
    : [
        { label: "В сторис 📸", onClick: shareStory },
        { label: "В Telegram ✈️", onClick: shareTelegram },
        { label: "Другу 💬", onClick: shareFriend },
        { label: "Ссылка 🔗", onClick: () => void copyLink() },
      ];

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
      >
        <div aria-hidden="true" className="mx-auto h-1.5 w-12 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <h2 id="share-title" className="font-display text-xl font-bold">
            {answerTo ? "Куда кидаем ответку?" : "Куда кидаем?"}
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-cream"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {/* Превью — настоящий PNG, который уйдёт в сторис */}
        <div className="flex justify-center">
          <div className="relative aspect-[4/5] h-[min(46dvh,440px)] overflow-hidden rounded-2xl bg-bg">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- это blob из нашего же маршрута, оптимизатор не нужен
              <img src={image.url} alt="Картинка для сторис" className="size-full object-contain" />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted">Рисуем картинку…</div>
            )}
          </div>
        </div>

        <div role="group" aria-label="Какая карточка" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
          {KINDS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={kind === o.value}
              onClick={() => {
                if (kind === o.value) return;
                setImage(null);
                setKind(o.value);
              }}
              className={cn(
                "min-h-11 rounded-full px-4 text-[15px] font-bold transition",
                kind === o.value ? "bg-lime text-bg" : "text-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <Button key={t.label} variant="ghost" size="md" className="min-h-16 bg-surface-2 px-3" onClick={t.onClick}>
              {t.label}
            </Button>
          ))}
        </div>

        {!ctx.desktop && (
          <button type="button" onClick={save} className="min-h-11 self-center px-3 text-sm font-semibold text-muted hover:text-cream">
            Сохранить картинку ⬇️
          </button>
        )}

        <p role="status" className="min-h-5 text-center text-sm font-semibold text-lime">
          {status}
        </p>
      </motion.div>

      {fullscreen && image && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black p-4" role="dialog" aria-label="Картинка для сторис">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob из нашего маршрута */}
          <img src={image.url} alt="Картинка для сторис" className="max-h-[80dvh] max-w-full rounded-2xl object-contain" />
          <p className="text-center font-semibold text-cream">Зажми и сохрани</p>
          <Button variant="ghost" size="md" className="max-w-xs" onClick={() => setFullscreen(false)}>
            Готово
          </Button>
        </div>
      )}
    </>
  );
}
