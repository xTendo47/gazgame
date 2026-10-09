// @gazgame/agents — ЗАРЕЗЕРВИРОВАНО под ИИ-персонажей Ultimate («Фрейд», «Сократ», «Марк Аврелий»…).
// Здесь только типы, обязательные правила и сбор контекста. Вызовов моделей и ключей НЕТ —
// они появятся только на сервере (apps/api). Подробности — в README.md.
import type { Catalog, Tier } from "@gazgame/content";
import { findById, findResult, type ProgressData } from "@gazgame/engine";

/** Персонаж = файл с характером и правилами (personas/<id>.json). */
export interface Persona {
  id: string;
  /** Как зовут персонажа в приложении, например «Сократ». */
  name: string;
  emoji: string;
  /** Чей стиль вдохновил персонажа — для честного дисклеймера. */
  inspiredBy: string;
  /** Минимальный уровень подписки для доступа. */
  tier: Tier;
  /** Характер и манера речи — основа системного промпта. */
  character: string;
  /** Что персонаж делает: «задаёт вопросы», «предлагает практику дня»… */
  abilities: string[];
  /** Дополнительные правила персонажа. Обязательные правила (MANDATORY_RULES) добавляются всегда. */
  rules: string[];
  status: "draft" | "published";
}

/** Правила, которые сервер ОБЯЗАН добавить к каждому персонажу. Персонаж не может их отменить. */
export const MANDATORY_RULES: readonly string[] = [
  "Честно говори, что ты ИИ в стиле персонажа, а не реальный человек.",
  "Ты не врач и не психотерапевт: не ставишь диагнозы и не назначаешь лечение.",
  "Если видишь признаки кризиса (мысли о самоповреждении или суициде, насилие, угроза жизни) — прекрати роль, мягко поддержи и направь к живой помощи (CRISIS_RESOURCES).",
  "Пользователю может быть меньше 18 лет: никакого контента 18+, романтических и сексуальных ролевых игр.",
  "Не проси и не сохраняй лишние личные данные: адрес, телефон, документы.",
];

export type CrisisCategory = "self-harm" | "suicide" | "violence" | "abuse" | "medical-emergency";

export interface HelpResource {
  title: string;
  phone?: string;
  url?: string;
  note: string;
}

/** Куда направлять при кризисе (Россия). Перед запуском проверить актуальность с юристом/экспертом. */
export const CRISIS_RESOURCES: readonly HelpResource[] = [
  { title: "Экстренные службы", phone: "112", note: "Если есть угроза жизни — звони сразу" },
  { title: "Телефон доверия для детей, подростков и родителей", phone: "8-800-2000-122", note: "Бесплатно, анонимно" },
];

/** Лимиты сообщений в день по уровню подписки. Значения — заглушки, решаются продуктово. */
export type MessageLimits = Record<Tier, number>;

export const DEFAULT_MESSAGE_LIMITS: MessageLimits = { free: 0, premium: 20, supreme: 100 };

/** Что агент знает о пользователе — только результаты тестов, без переписок и личных данных. */
export interface AgentContext {
  tier: Tier;
  testResults: { testId: string; testTitle: string; resultId: string; resultTitle: string }[];
}

export interface AgentMessage {
  role: "user" | "agent";
  text: string;
  at: string;
}

/** Ответ агента. crisis — сработал кризисный протокол, интерфейс должен показать CRISIS_RESOURCES. */
export interface AgentReply {
  text: string;
  crisis?: CrisisCategory;
  remainingMessages: number;
}

/** Интерфейс сервиса агентов. Реализация — только в apps/api (там ключи и вызовы моделей). */
export interface AgentService {
  reply(persona: Persona, context: AgentContext, history: AgentMessage[]): Promise<AgentReply>;
}

/** Собирает контекст для агента из прогресса пользователя (через engine). */
export function buildAgentContext(catalog: Catalog, progress: ProgressData, tier: Tier): AgentContext {
  const testResults = Object.entries(progress.tests).flatMap(([testId, record]) => {
    const test = findById(catalog, testId);
    if (!test || test.kind !== "test") return [];
    const result = findResult(test, record.resultId);
    return result ? [{ testId, testTitle: test.title, resultId: result.id, resultTitle: result.title }] : [];
  });
  return { tier, testResults };
}
