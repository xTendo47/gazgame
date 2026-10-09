// Только для разработки: сообщает браузеру, что изменились JSON-файлы в packages/content/data.
// Браузер (components/DevContentReload.tsx) в ответ перерисовывает страницу — без перезапуска сервера.
// Next.js сам следит только за кодом, а контент мы читаем с диска, поэтому следим за ним здесь.
import fs from "node:fs";
import { connection } from "next/server";
import { findContentDir } from "@gazgame/content/node";

export async function GET(request: Request) {
  await connection();
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  let watcher: fs.FSWatcher | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(timer);
    watcher?.close();
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": подключено\n\n"));
      watcher = fs.watch(findContentDir(), { recursive: true }, (_event, file) => {
        if (!file?.endsWith(".json")) return;
        // Редактор часто сохраняет файл в несколько шагов — ждём, пока утихнет
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ file })}\n\n`));
          } catch {
            stop(); // браузер уже отключился
          }
        }, 150);
      });
      request.signal.addEventListener("abort", stop);
    },
    cancel: stop,
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
  });
}
