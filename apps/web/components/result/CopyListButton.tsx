"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { listCopyText } from "@gazgame/engine";
import { Button } from "@gazgame/ui";
import { copyText } from "@/lib/clipboard";

type Status = "idle" | "copied" | "failed";

/**
 * Кнопка «Скопировать…»: кладёт список в буфер обмена.
 * В конце — «Пройди тест: <полная ссылка на linkPath>», чтобы друзья из чата сразу прошли (адрес сайта известен только в браузере).
 */
export function CopyListButton({
  label,
  linkPath,
  ...list
}: Omit<Parameters<typeof listCopyText>[0], "testUrl"> & { label: string; linkPath: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function copy() {
    const text = listCopyText({ ...list, testUrl: new URL(linkPath, window.location.origin).toString() });
    setStatus((await copyText(text)) ? "copied" : "failed");
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="accent" size="md" onClick={copy}>
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
