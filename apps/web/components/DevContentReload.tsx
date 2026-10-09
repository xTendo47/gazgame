"use client";

// Только для разработки: когда меняется JSON в packages/content/data, перерисовываем страницу.
// Сервер присылает событие из app/dev/content/events/route.ts. Состояние страницы (ответы в тесте) не сбрасывается.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DevContentReload() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/dev/content/events");
    source.onmessage = () => router.refresh();
    // Сервер остановлен — EventSource сам переподключится, когда он снова заработает
    source.onerror = () => {};
    return () => source.close();
  }, [router]);

  return null;
}
