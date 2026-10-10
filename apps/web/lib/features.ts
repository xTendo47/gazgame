// Разделы меню, которых пока нет: открывают экран «Скоро».
export interface SoonFeature {
  id: string;
  emoji: string;
  title: string;
  text: string;
}

export const SOON_FEATURES: SoonFeature[] = [
  {
    id: "subscription",
    emoji: "💎",
    title: "Подписка",
    text: "Одна подписка — глубина во всех разделах: полные разборы тестов, режимы «Глубоко» и новые колоды. Уже скоро!",
  },
  {
    id: "suggest",
    emoji: "💡",
    title: "Предложи своё",
    text: "Скоро можно будет присылать свои вопросы и задания. Лучшие попадут в игры.",
  },
  {
    id: "community",
    emoji: "👥",
    title: "Сообщество",
    text: "Место, где можно делиться историями и находить свою тусовку. Готовим.",
  },
  {
    id: "feedback",
    emoji: "📝",
    title: "Обратная связь",
    text: "Скоро здесь можно будет написать нам напрямую. Мы читаем всё.",
  },
  {
    id: "story",
    emoji: "📖",
    title: "История создания",
    text: "Как и зачем мы делаем GAZ. Рассказ появится здесь совсем скоро.",
  },
];

export function getSoonFeature(id: string): SoonFeature | undefined {
  return SOON_FEATURES.find((f) => f.id === id);
}
