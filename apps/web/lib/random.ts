// Случайное целое от 0 до n−1 (для «Наугад», «Мне скучно»). Вынесено в отдельную функцию, чтобы вызывать из обработчиков нажатий.
export function randomIndex(n: number): number {
  return Math.floor(Math.random() * n);
}
