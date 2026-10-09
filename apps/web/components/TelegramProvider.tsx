"use client";

// Интеграция с Telegram Mini App.
// Внутри Telegram: загружаем скрипт Telegram, сообщаем, что готовы, разворачиваем на весь экран,
// красим шапку в цвета бренда и показываем системную кнопку «назад».
// Вне Telegram скрипт не грузим вовсе — сайт работает как обычно и не ходит на telegram.org
// (он бывает недоступен, и тогда в консоли сыпались ошибки).
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const BRAND_BG = "#141217";
const TELEGRAM_SCRIPT = "https://telegram.org/js/telegram-web-app.js";

/** Telegram передаёт данные запуска в адресе (#tgWebAppData=…), скрипт Telegram запоминает их в sessionStorage. */
function launchedFromTelegram(): boolean {
  if (location.hash.includes("tgWebAppData")) return true;
  try {
    return sessionStorage.getItem("__telegram__initParams")?.includes("tgWebAppData") ?? false;
  } catch {
    return false;
  }
}

function getWebApp(): TelegramWebApp | undefined {
  const webApp = window.Telegram?.WebApp;
  // initData заполнена только при запуске из Telegram
  return webApp && webApp.initData ? webApp : undefined;
}

/** Загружает скрипт Telegram. Если не загрузился — тихо работаем как обычный сайт. */
function loadTelegramScript(): Promise<TelegramWebApp | undefined> {
  if (window.Telegram?.WebApp) return Promise.resolve(getWebApp());
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = TELEGRAM_SCRIPT;
    script.onload = () => resolve(getWebApp());
    script.onerror = () => resolve(undefined);
    document.head.append(script);
  });
}

export function TelegramProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const [webApp, setWebApp] = useState<TelegramWebApp>();

  useEffect(() => {
    if (!launchedFromTelegram()) return;
    let cancelled = false;
    void loadTelegramScript().then((app) => {
      if (!cancelled) setWebApp(app);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor(BRAND_BG);
    webApp.setBackgroundColor(BRAND_BG);
    webApp.setBottomBarColor?.(BRAND_BG);
    // Свайп вниз не должен закрывать приложение посреди игры
    webApp.disableVerticalSwipes?.();
    document.documentElement.dataset.telegram = webApp.platform;
  }, [webApp]);

  useEffect(() => {
    if (!webApp) return;
    const goBack = () => router.back();
    if (pathname === "/") {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(goBack);
    }
    return () => webApp.BackButton.offClick(goBack);
  }, [webApp, pathname, router]);

  return null;
}
