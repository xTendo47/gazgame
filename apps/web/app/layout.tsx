import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { DevContentReload } from "@/components/DevContentReload";
import { TelegramProvider } from "@/components/TelegramProvider";
// Шрифты с кириллицей лежат в проекте (Fontsource), а не грузятся с Google Fonts:
// он бывает недоступен, и тогда сайт и сборка тормозят или падают.
// Переменные --font-unbounded и --font-manrope заданы в globals.css.
import "@fontsource-variable/unbounded";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GAZ Game — Не сиди. Не тупи. Газ!",
    template: "%s · GAZ Game",
  },
  description: "Игры и тесты для пар, компаний и соло. Не сиди. Не тупи. Газ!",
  applicationName: "GAZ Game",
  appleWebApp: { capable: true, title: "GAZ", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#141217",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: скрипт Telegram и расширения браузера добавляют к <html> свои атрибуты
    <html lang="ru" suppressHydrationWarning>
      <body>
        {/* Telegram Mini App: скрипт Telegram грузится только при запуске из Telegram */}
        <TelegramProvider />
        {children}
        {/* Разработка: правка JSON в packages/content сразу видна на странице */}
        {process.env.NODE_ENV === "development" && <DevContentReload />}
        {/* Аналитика — только в продакшене: при разработке ничего не грузим и не отправляем */}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
