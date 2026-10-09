"use client";

import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button, ShareCard, type ShareCardProps } from "@gazgame/ui";
import { downloadImage, renderCardImage, shareImage } from "@/lib/share";

type Status = "idle" | "working" | "done" | "error";

/** Карточка для сторис: превью + «Поделиться» (Web Share API) и «Сохранить картинку». */
export function ShareResult({
  card,
  fileName,
  shareText = "Мой результат в GAZ Game 🔥",
  defaultOpen = false,
}: {
  card: Omit<ShareCardProps, "ref">;
  fileName: string;
  /** Подпись к картинке при «Поделиться». */
  shareText?: string;
  /** Сразу показать карточку, без кнопки «Карточка для сторис» (когда её выбрали в меню). */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [status, setStatus] = useState<Status>("idle");
  const cardRef = useRef<HTMLDivElement>(null);

  async function run(action: "share" | "download") {
    if (!cardRef.current) return;
    setStatus("working");
    try {
      const blob = await renderCardImage(cardRef.current);
      if (action === "share") {
        await shareImage(blob, `${fileName}.png`, shareText);
      } else {
        downloadImage(blob, `${fileName}.png`);
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        📸 Карточка для сторис
      </Button>
    );
  }

  return (
    <section aria-label="Карточка для сторис" className="flex flex-col items-center gap-3">
      <ShareCard ref={cardRef} {...card} />
      <div className="grid w-full grid-cols-2 gap-3">
        <Button variant="primary" size="md" disabled={status === "working"} onClick={() => run("share")}>
          <Share2 aria-hidden="true" size={18} /> Поделиться
        </Button>
        <Button variant="ghost" size="md" disabled={status === "working"} onClick={() => run("download")}>
          <Download aria-hidden="true" size={18} /> Сохранить
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted">
        {status === "working" && "Рисуем картинку…"}
        {status === "done" && "Готово! Выкладывай в сторис 🔥"}
        {status === "error" && "Не получилось. Попробуй ещё раз или сделай скриншот."}
      </p>
    </section>
  );
}
