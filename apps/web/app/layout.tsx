import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { DevContentReload } from "@/components/DevContentReload";
import { TelegramProvider } from "@/components/TelegramProvider";
import { serverSiteUrl } from "@/lib/site";
// Шрифты с кириллицей лежат в проекте (Fontsource), а не грузятся с Google Fonts:
// он бывает недоступен, и тогда сайт и сборка тормозят или падают.
// Переменные --font-unbounded и --font-manrope заданы в globals.css.
import "@fontsource-variable/unbounded";
import "@fontsource-variable/manrope";
import "./globals.css";

// Превью ссылки на главную (Telegram, VK): логотип, слоган и эмодзи разделов — картинка /share/home
const HOME_PREVIEW = { url: "/share/home", width: 1200, height: 630, alt: "GAZ Game — Не сиди. Не тупи. Газ!" };

export const metadata: Metadata = {
  metadataBase: new URL(serverSiteUrl()),
  title: {
    default: "GAZ Game — Не сиди. Не тупи. Газ!",
    template: "%s · GAZ Game",
  },
  description: "Игры и тесты для пар, компаний и соло. Не сиди. Не тупи. Газ!",
  applicationName: "GAZ Game",
  appleWebApp: { capable: true, title: "GAZ", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "GAZ Game",
    locale: "ru_RU",
    title: "GAZ Game — Не сиди. Не тупи. Газ!",
    description: "Игры и тесты для пар, компаний и соло. Не сиди. Не тупи. Газ!",
    images: [HOME_PREVIEW],
  },
  twitter: { card: "summary_large_image", images: [HOME_PREVIEW.url] },
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
