// Карточка для сторис: превращаем HTML в картинку и делимся ею.
import { toBlob } from "html-to-image";

const OUR_FONTS = ["Unbounded Variable", "Manrope Variable"];
let fontCSS: Promise<string> | undefined;

/**
 * CSS со шрифтами для картинки — собираем сами и только с нашего сайта.
 * Иначе html-to-image читает все стили страницы, включая стили расширений браузера
 * с чужих сайтов, и пишет в консоль «TypeError: Failed to fetch», если они недоступны.
 * Если шрифт не скачался — карточка просто нарисуется системным шрифтом.
 */
function getFontCSS(): Promise<string> {
  fontCSS ??= collectFontCSS().catch(() => "");
  return fontCSS;
}

async function collectFontCSS(): Promise<string> {
  const rules: { css: string; base: string }[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    const base = sheet.href ?? location.href;
    if (new URL(base).origin !== location.origin) continue;
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
        if (OUR_FONTS.includes(family)) rules.push({ css: rule.cssText, base });
      }
    } catch {
      // стили, которые нельзя прочитать, пропускаем
    }
  }
  const embedded = await Promise.all(rules.map(({ css, base }) => inlineUrls(css, base).catch(() => "")));
  return embedded.filter(Boolean).join("\n");
}

async function inlineUrls(css: string, base: string): Promise<string> {
  let result = css;
  for (const [match, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (!url || url.startsWith("data:")) continue;
    const response = await fetch(new URL(url, base));
    if (!response.ok) throw new Error(`Шрифт не скачался: ${url}`);
    result = result.replace(match, `url(${await toDataUrl(await response.blob())})`);
  }
  return result;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Рисует элемент в PNG 1080×1920 (карточка 270×480 × 4). */
export async function renderCardImage(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    pixelRatio: 4,
    cacheBust: true,
    fontEmbedCSS: await getFontCSS(),
    backgroundColor: "#141217",
    // В сторис скругления не нужны — углы были бы залиты фоном
    style: { borderRadius: "0" },
  });
  if (!blob) throw new Error("Не удалось нарисовать картинку");
  return blob;
}

export type ShareOutcome = "shared" | "downloaded" | "cancelled";

/** Через Web Share API, если устройство умеет делиться файлами, иначе — скачивание. */
export async function shareImage(blob: Blob, fileName: string, text: string): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (error) {
      if ((error as Error).name === "AbortError") return "cancelled";
      // иначе пробуем скачать
    }
  }
  downloadImage(blob, fileName);
  return "downloaded";
}

export function downloadImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
