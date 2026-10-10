// Адрес сайта на сервере — для мета-тегов (metadataBase) и полных ссылок в превью.
// NEXT_PUBLIC_SITE_URL, на Vercel — адрес продакшена, иначе localhost при разработке.
export function serverSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
