// «Вылет» коробки со стола в лоток: главная кладёт сюда, где стояла коробка, экран «Чем займёмся?» берёт и разыгрывает
// анимацию от этого места (и обратно, когда нажали «На стол»). Живёт в памяти страницы: при обычном переходе по приложению
// работает, при открытии «Чем займёмся?» напрямую (адрес, перезагрузка) данных нет — тогда коробка просто сразу открыта.
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
let last: BoxFlight | null = null;

export function setBoxFlight(flight: BoxFlight | null): void {
  pending = flight;
  if (flight) last = flight;
}

/** Посмотреть, не забирая (в режиме разработки React запускает эффекты дважды). */
export function peekBoxFlight(): BoxFlight | null {
  return pending;
}

/** Анимация проиграна — забыть. Место коробки остаётся в lastBoxFlight для обратной анимации. */
export function clearBoxFlight(): void {
  pending = null;
}

/** Где коробка стояла на столе в последний раз (для обратного полёта по «На стол»). */
export function lastBoxFlight(): BoxFlight | null {
  return last;
}

// Папиросная бумага на лотке лежит только при первом открытии за сеанс (как в макете: sessionStorage gaz_tissue).
const TISSUE_KEY = "gaz_tissue";

export function tissueSeen(): boolean {
  try {
    return sessionStorage.getItem(TISSUE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTissueSeen(): void {
  try {
    sessionStorage.setItem(TISSUE_KEY, "1");
  } catch {
    // нет хранилища — бумага просто покажется снова
  }
}
