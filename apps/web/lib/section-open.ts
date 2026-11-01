// «Открытие раздела»: плитка на «Чем займёмся?» ставит метку, экран раздела берёт её и разыгрывает анимацию (рулетка, раскладка колод).
// Живёт в памяти страницы: при заходе по адресу или перезагрузке метки нет — раздел просто открыт.
export type OpeningSection = "party" | "love" | "solo";

let pending: OpeningSection | null = null;

export function setOpeningSection(id: OpeningSection | null): void {
  pending = id;
}

/** Посмотреть, не забирая (в режиме разработки React запускает эффекты дважды). */
export function peekOpeningSection(): OpeningSection | null {
  return pending;
}

export function clearOpeningSection(): void {
  pending = null;
}
