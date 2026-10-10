import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Пакеты монорепо лежат исходниками на TypeScript — Next.js компилирует их сам.
  // Правка в packages/ui или packages/engine сразу видна на странице (горячая перезагрузка).
  transpilePackages: ["@gazgame/content", "@gazgame/engine", "@gazgame/ui"],
  // Открывать сайт разработки с телефона в той же Wi-Fi сети (http://192.168.x.x:3000).
  // Без этого Next.js блокирует горячую перезагрузку и служебные запросы с чужих адресов.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // Шрифты для картинок шеринга читаются с диска — кладём их в сборку маршрута.
  outputFileTracingIncludes: { "/share/test/[slug]": ["./assets/fonts/**"], "/share/home": ["./assets/fonts/**"] },
};

export default nextConfig;
