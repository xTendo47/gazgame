"use client";

// «Пофлексить 🧊» на экране результата: меню из двух вариантов —
// карточка 9:16 для сторис (ShareResult) или ссылка на тест в буфер обмена.
import { useId, useState } from "react";
import { Image as ImageIcon, Link2 } from "lucide-react";
import { Button, type ShareCardProps } from "@gazgame/ui";
import { ShareResult } from "@/components/ShareResult";
import { copyText } from "@/lib/clipboard";

type View = "closed" | "menu" | "card";
type CopyStatus = "idle" | "copied" | "failed";

export function FlexMenu({
  card,
  fileName,
  shareText,
  testPath,
}: {
  card: Omit<ShareCardProps, "ref">;
  fileName: string;
  shareText?: string;
  /** Адрес теста, например "/test/temperament" — его копирует «Скопировать ссылку». */
  testPath: string;
}) {
  const [view, setView] = useState<View>("closed");
  const [copy, setCopy] = useState<{ status: CopyStatus; url: string }>({ status: "idle", url: "" });
  const menuId = useId();

  async function copyLink() {
    const url = new URL(testPath, window.location.origin).toString();
    // Если буфер обмена недоступен (Telegram, старые браузеры) — показываем ссылку, чтобы скопировать руками.
    setCopy({ status: (await copyText(url)) ? "copied" : "failed", url });
  }

  if (view === "card") {
    return <ShareResult card={card} fileName={fileName} shareText={shareText} defaultOpen />;
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="primary"
        aria-expanded={view === "menu"}
        aria-controls={menuId}
        onClick={() => setView(view === "menu" ? "closed" : "menu")}
      >
        Пофлексить 🧊
      </Button>

      {view === "menu" && (
        <div id={menuId} role="group" aria-label="Как пофлексить" className="flex flex-col gap-2 rounded-card border border-line bg-surface p-2">
          <Button variant="option" size="md" onClick={() => setView("card")}>
            <ImageIcon aria-hidden="true" size={20} className="text-orange" />
            Карточка в сторис
          </Button>
          <Button variant="option" size="md" onClick={copyLink}>
            <Link2 aria-hidden="true" size={20} className="text-lime" />
            Скопировать ссылку
          </Button>
          <p role="status" className="px-3 pb-1 text-sm text-muted empty:hidden">
            {copy.status === "copied" && "Ссылка скопирована ✅ Кидай друзьям"}
            {copy.status === "failed" && (
              <>
                Не получилось скопировать. Вот ссылка:{" "}
                <span className="break-all font-semibold text-cream select-all">{copy.url}</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
