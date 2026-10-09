/**
 * Копирует текст в буфер обмена. Возвращает false, если браузер не дал (так бывает в Telegram
 * и старых браузерах) — тогда экран должен показать текст, чтобы его скопировали вручную.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
