"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@gazgame/ui";
import { copyText } from "@/lib/clipboard";

type Status = "idle" | "copied" | "failed";

/** Кнопка «Скопировать для своего человека»: кладёт готовый текст в буфер обмена. */
export function CopyListButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<Status>("idle");

  return (
    <div className="flex flex-col gap-2">
      <Button variant="accent" size="md" onClick={async () => setStatus((await copyText(text)) ? "copied" : "failed")}>
        <Copy aria-hidden="true" size={18} />
        {label}
      </Button>
      <p role="status" className="text-center text-sm text-muted empty:hidden">
        {status === "copied" && "Скопировано ✅ Осталось отправить"}
        {status === "failed" && "Не получилось скопировать — выдели список выше и скопируй вручную."}
      </p>
    </div>
  );
}
