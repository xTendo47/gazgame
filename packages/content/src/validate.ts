// Проверка контента: по схемам и связей между файлами.
// Чистая функция — без чтения диска, поэтому работает где угодно и легко тестируется.
import { z } from "zod";
import { gameSchema, lockedTestsFileSchema, testSchema, type Catalog, type ContentItem, type LockedTest } from "./schema";

z.config(z.locales.ru());

/** Сырой файл контента: путь (для сообщений об ошибках) и разобранный JSON. */
export interface RawContentFile {
  path: string;
  kind: "test" | "game";
  data: unknown;
  /** Файл не читается как JSON — текст ошибки. */
  parseError?: string;
}

/** Файл data/locked-tests.json (необязательный). */
export interface RawLockedTestsFile {
  path: string;
  data: unknown;
  parseError?: string;
}

/** Одна проблема в файле: какое поле и что не так. */
export interface ContentIssue {
  field: string;
  message: string;
}

/** Отчёт по одному файлу. */
export interface FileReport {
  path: string;
  kind: "test" | "game";
  /** Разобранный элемент, если файл прошёл схему. */
  item?: ContentItem;
  /** Исходные данные файла — чтобы показать хоть что-то, даже если схема не прошла. */
  data: unknown;
  issues: ContentIssue[];
  /** id из related, которых нет в каталоге. */
  brokenRelated: string[];
}

/** Отчёт по всему контенту: по файлам и общий список проблем текстом. */
export interface ContentReport {
  files: FileReport[];
  problems: string[];
  /** Платные тесты под замком, если файл есть и прошёл проверку. */
  lockedTests: LockedTest[];
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Ошибки в контенте (${problems.length}):\n\n${problems.join("\n\n")}`);
    this.name = "ContentError";
  }
}

// ---------- Эмодзи, которых нет на Windows 10 и старых Android ----------

/**
 * Эмодзи 2020 года и новее (Emoji 13.0+): на Windows 10 и Android 10 и ниже вместо них квадратик.
 * Диапазоны кодов — включительно.
 */
const HIDDEN_EMOJI_RANGES: [number, number][] = [
  [0x1fa74, 0x1fa77],
  [0x1fa7b, 0x1fa7c],
  [0x1fa83, 0x1fa88],
  [0x1fa96, 0x1faff],
  [0x1f90c, 0x1f90c],
  [0x1f972, 0x1f972],
  [0x1f977, 0x1f979],
  [0x1f9a3, 0x1f9a4],
  [0x1f9ab, 0x1f9ad],
  [0x1f9cb, 0x1f9cc],
  [0x1f6d6, 0x1f6d7],
  [0x1f6dc, 0x1f6df],
  [0x1f6fb, 0x1f6fc],
  [0x1f7f0, 0x1f7f0],
];

/** Новые сочетания из старых эмодзи (через ZWJ): по отдельности символы видны, вместе — нет. */
const HIDDEN_EMOJI_SEQUENCES = ["❤️‍🔥", "❤️‍🩹", "😮‍💨", "😵‍💫", "😶‍🌫️"];

/** Такое же сочетание без невидимого вариационного селектора (U+FE0F) — его часто теряют при копировании. */
const withoutVs16 = (s: string) => s.replace(/\uFE0F/g, "");

/** Все «невидимые» эмодзи в строках файла (без повторов, в порядке появления). */
export function findHiddenEmoji(data: unknown): string[] {
  const found: string[] = [];
  const add = (e: string) => {
    if (!found.includes(e)) found.push(e);
  };
  const scan = (value: unknown) => {
    if (typeof value === "string") {
      let rest = value;
      for (const seq of HIDDEN_EMOJI_SEQUENCES) {
        for (const variant of new Set([seq, withoutVs16(seq)])) {
          if (rest.includes(variant)) {
            add(seq);
            rest = rest.split(variant).join(" ");
          }
        }
      }
      for (const ch of rest) {
        const code = ch.codePointAt(0) ?? 0;
        if (HIDDEN_EMOJI_RANGES.some(([from, to]) => code >= from && code <= to)) add(ch);
      }
    } else if (Array.isArray(value)) {
      value.forEach(scan);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(scan);
    }
  };
  scan(data);
  return found;
}

export function hiddenEmojiMessage(path: string, emoji: string): string {
  return `${path}: эмодзи ${emoji} не видно на Windows 10 и старых Android, возьми другой`;
}

/** Проверяет все файлы и не падает на ошибках — возвращает отчёт. */
export function inspectContent(files: RawContentFile[], lockedFile?: RawLockedTestsFile): ContentReport {
  const problems: string[] = [];
  const reports: FileReport[] = files.map((file) => {
    const report: FileReport = { path: file.path, kind: file.kind, data: file.data, issues: [], brokenRelated: [] };
    if (file.parseError !== undefined) {
      report.issues.push({ field: "весь файл", message: `не читается как JSON — проверь запятые и кавычки. ${file.parseError}` });
      problems.push(`❌ ${file.path}: файл не читается как JSON — проверь запятые и кавычки.\n${file.parseError}`);
      return report;
    }
    for (const emoji of findHiddenEmoji(file.data)) {
      report.issues.push({ field: "эмодзи", message: `${emoji} не видно на Windows 10 и старых Android, возьми другой` });
      problems.push(`❌ ${hiddenEmojiMessage(file.path, emoji)}`);
    }
    const schema = file.kind === "test" ? testSchema : gameSchema;
    const parsed = schema.safeParse(file.data);
    if (parsed.success) {
      report.item = parsed.data;
    } else {
      report.issues.push(
        ...parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "весь файл", message: issue.message })),
      );
      problems.push(`❌ ${file.path}\n${z.prettifyError(parsed.error)}`);
    }
    return report;
  });

  const valid = reports.filter((r): r is FileReport & { item: ContentItem } => r.item !== undefined);
  const ids = new Map<string, number>();
  const slugs = new Map<string, number>();
  for (const { item } of valid) {
    ids.set(item.id, (ids.get(item.id) ?? 0) + 1);
    slugs.set(`${item.kind}:${item.slug}`, (slugs.get(`${item.kind}:${item.slug}`) ?? 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) problems.push(`❌ id "${id}" используется в ${count} файлах — id должен быть уникальным`);
  }
  for (const [key, count] of slugs) {
    if (count > 1) problems.push(`❌ slug "${key.split(":")[1]}" используется в ${count} файлах — slug должен быть уникальным`);
  }
  // Файл не прошёл схему — всё равно проверим ссылки в related, чтобы показать их на /dev/content
  for (const report of reports) {
    if (report.item) continue;
    const related: unknown = (report.data as { related?: unknown } | undefined)?.related;
    if (!Array.isArray(related)) continue;
    related.forEach((rel: unknown, i) => {
      if (typeof rel === "string" && !ids.has(rel)) {
        report.brokenRelated.push(rel);
        report.issues.push({ field: `related.${i}`, message: `"${rel}" — такого теста или игры нет` });
      }
    });
  }
  for (const report of valid) {
    const { item } = report;
    if ((ids.get(item.id) ?? 0) > 1) report.issues.push({ field: "id", message: `id "${item.id}" есть ещё в другом файле` });
    if ((slugs.get(`${item.kind}:${item.slug}`) ?? 0) > 1) {
      report.issues.push({ field: "slug", message: `slug "${item.slug}" есть ещё в другом файле` });
    }
    item.related.forEach((rel, i) => {
      if (rel === item.id) {
        report.brokenRelated.push(rel);
        report.issues.push({ field: `related.${i}`, message: "указан сам этот элемент" });
        problems.push(`❌ "${item.id}": в related указан сам этот элемент`);
      } else if (!ids.has(rel)) {
        report.brokenRelated.push(rel);
        report.issues.push({ field: `related.${i}`, message: `"${rel}" — такого теста или игры нет` });
        problems.push(`❌ "${item.id}": в related указан "${rel}", но такого теста или игры нет`);
      }
    });
  }

  const lockedTests = inspectLockedTests(lockedFile, valid.map((r) => r.item), problems);
  return { files: reports, problems, lockedTests };
}

/** Проверяет locked-tests.json: схема, уникальные id/slug и что они не совпадают с обычными тестами и играми. */
function inspectLockedTests(file: RawLockedTestsFile | undefined, items: ContentItem[], problems: string[]): LockedTest[] {
  if (!file) return [];
  if (file.parseError !== undefined) {
    problems.push(`❌ ${file.path}: файл не читается как JSON — проверь запятые и кавычки.\n${file.parseError}`);
    return [];
  }
  for (const emoji of findHiddenEmoji(file.data)) problems.push(`❌ ${hiddenEmojiMessage(file.path, emoji)}`);
  const parsed = lockedTestsFileSchema.safeParse(file.data);
  if (!parsed.success) {
    problems.push(`❌ ${file.path}\n${z.prettifyError(parsed.error)}`);
    return [];
  }
  const tests = parsed.data.lockedTests;
  const taken = new Set(items.flatMap((i) => [i.id, `test:${i.slug}`]));
  const seen = new Set<string>();
  for (const t of tests) {
    if (seen.has(t.id) || seen.has(`slug:${t.slug}`)) problems.push(`❌ ${file.path}: "${t.id}" повторяется`);
    seen.add(t.id);
    seen.add(`slug:${t.slug}`);
    if (taken.has(t.id)) problems.push(`❌ ${file.path}: id "${t.id}" уже есть у обычного теста или игры`);
    if (taken.has(`test:${t.slug}`)) problems.push(`❌ ${file.path}: slug "${t.slug}" уже есть у обычного теста`);
  }
  return tests;
}

export function buildCatalog(files: RawContentFile[], lockedFile?: RawLockedTestsFile): Catalog {
  const { files: reports, problems, lockedTests } = inspectContent(files, lockedFile);
  if (problems.length > 0) throw new ContentError(problems);
  const catalog: Catalog = { tests: [], games: [], lockedTests };
  for (const { item } of reports) {
    if (item?.kind === "test") catalog.tests.push(item);
    else if (item?.kind === "game") catalog.games.push(item);
  }
  return catalog;
}
