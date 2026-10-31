// «Вылет» коробки со стола в лоток: главная кладёт сюда, где стояла коробка, экран «Чем займёмся?» берёт и разыгрывает
// анимацию от этого места. Живёт в памяти страницы: при обычном переходе по приложению работает,
// при открытии «Чем займёмся?» напрямую (адрес, перезагрузка) данных нет — тогда коробка просто сразу открыта.
export interface BoxFlight {
  /** Центр коробки на экране (px, от левого верхнего угла окна). */
  cx: number;
  cy: number;
  /** Размер коробки (px, без поворота). */
  w: number;
  h: number;
  /** Наклон коробки в градусах. */
  rot: number;
}

let pending: BoxFlight | null = null;

export function setBoxFlight(flight: BoxFlight | null): void {
  pending = flight;
}

/** Посмотреть, не забирая (в режиме разработки React запускает эффекты дважды). */
export function peekBoxFlight(): BoxFlight | null {
  return pending;
}

/** Анимация проиграна — забыть. */
export function clearBoxFlight(): void {
  pending = null;
}
