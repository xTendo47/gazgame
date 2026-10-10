// Шрифты для картинок next/og (сторис и превью ссылок). Читаются с диска один раз.
// next/og не читает woff2 — берём woff из @fontsource (лицензия OFL, см. assets/fonts).
// Латиница и кириллица — отдельные файлы под разными именами: Satori держит один файл на имя и вес,
// поэтому в разметке шрифт задаётся парой «кириллица, латиница» (см. OG_DISPLAY и OG_BODY).
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_DISPLAY = "Unbounded Cyr, Unbounded Lat";
export const OG_BODY = "Manrope Cyr, Manrope Lat";

const fontDir = join(process.cwd(), "assets", "fonts");
const fontFiles = [
  { name: "Unbounded Cyr", weight: 900, file: "unbounded-cyrillic-900-normal.woff" },
  { name: "Unbounded Lat", weight: 900, file: "unbounded-latin-900-normal.woff" },
  { name: "Manrope Cyr", weight: 600, file: "manrope-cyrillic-600-normal.woff" },
  { name: "Manrope Lat", weight: 600, file: "manrope-latin-600-normal.woff" },
  { name: "Manrope Cyr", weight: 800, file: "manrope-cyrillic-800-normal.woff" },
  { name: "Manrope Lat", weight: 800, file: "manrope-latin-800-normal.woff" },
] as const;

let fonts: Promise<{ name: string; weight: 600 | 800 | 900; style: "normal"; data: ArrayBuffer }[]> | undefined;

export function ogFonts() {
  fonts ??= Promise.all(
    fontFiles.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: "normal" as const,
      data: await readFile(join(fontDir, f.file)).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer),
    })),
  );
  return fonts;
}
