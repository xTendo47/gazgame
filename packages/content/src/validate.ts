// Проверка контента: по схемам и связей между файлами.
// Чистая функция — без чтения диска, поэтому работает где угодно и легко тестируется.
import { z } from "zod";
import {
  cardGamesFileSchema,
  gameSchema,
  lockedTestsFileSchema,
  premiumCodesFileSchema,
  premiumFileSchema,
  testSchema,
  ultimateFileSchema,
  sectionsFileSchema,
  type CardGamesFile,
  type PremiumFile,
  type UltimateFile,
  type SectionsFile,
  type Catalog,
  type ContentItem,
  type LockedTest,
} from "./schema";

z.config(z.locales.ru());

/** Сырой файл контента: путь (для сообщений об ошибках) и разобранный JSON. */
export interface RawContentFile {
  path: string;
  kind: "test" | "game";
  data: unknown;
  /** Файл не читается как JSON — текст ошибки. */
  parseError?: string;
}

/** Необязательный файл с одним JSON: data/locked-tests.json, data/card-games.json. */
export interface RawDataFile {
  path: string;
  data: unknown;
  parseError?: string;
}
export type RawLockedTestsFile = RawDataFile;

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
  /** «Карточные игры 🃏», если файл есть и прошёл проверку. */
  cardGames?: CardGamesFile;
  /** Тексты экрана «Premium». */
  premium?: PremiumFile;
  /** SHA-256 кодов Premium. */
  premiumCodes?: string[];
  /** Тизер Ultimate. */
  ultimate?: UltimateFile;
  /** Разделы: плитки-вкладки и карточки. */
  sectionLayouts?: SectionsFile;
}

/** Необязательные файлы помимо тестов и игр. */
export interface ExtraContentFiles {
  lockedTests?: RawDataFile;
  cardGames?: RawDataFile;
  premium?: RawDataFile;
  premiumCodes?: RawDataFile;
  ultimate?: RawDataFile;
  sectionLayouts?: RawDataFile;
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Ошибки в контенте (${problems.length}):\n\n${problems.join("\n\n")}`);
    this.name = "ContentError";
  }
}

/** Проверяет все файлы и не падает на ошибках — возвращает отчёт. */
export function inspectContent(files: RawContentFile[], extras: ExtraContentFiles = {}): ContentReport {
  const problems: string[] = [];
  const reports: FileReport[] = files.map((file) => {
    const report: FileReport = { path: file.path, kind: file.kind, data: file.data, issues: [], brokenRelated: [] };
    if (file.parseError !== undefined) {
      report.issues.push({ field: "весь файл", message: `не читается как JSON — проверь запятые и кавычки. ${file.parseError}` });
      problems.push(`❌ ${file.path}: файл не читается как JSON — проверь запятые и кавычки.\n${file.parseError}`);
      return report;
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

  const lockedTests = inspectLockedTests(extras.lockedTests, valid.map((r) => r.item), problems);
  const cardGames = inspectDataFile(extras.cardGames, cardGamesFileSchema, problems);
  const premium = inspectDataFile(extras.premium, premiumFileSchema, problems);
  const codes = inspectDataFile(extras.premiumCodes, premiumCodesFileSchema, problems);
  if (codes && new Set(codes.hashes).size !== codes.hashes.length) {
    problems.push(`❌ ${extras.premiumCodes?.path}: хэши кодов повторяются`);
  }
  const ultimate = inspectDataFile(extras.ultimate, ultimateFileSchema, problems);
  const sectionLayouts = inspectDataFile(extras.sectionLayouts, sectionsFileSchema, problems);
  return { files: reports, problems, lockedTests, cardGames, premium, premiumCodes: codes?.hashes, ultimate, sectionLayouts };
}

/** Проверяет необязательный файл (card-games.json, premium.json…): JSON и схема. */
function inspectDataFile<T>(file: RawDataFile | undefined, schema: z.ZodType<T>, problems: string[]): T | undefined {
  if (!file) return undefined;
  if (file.parseError !== undefined) {
    problems.push(`❌ ${file.path}: файл не читается как JSON — проверь запятые и кавычки.
${file.parseError}`);
    return undefined;
  }
  const parsed = schema.safeParse(file.data);
  if (!parsed.success) {
    problems.push(`❌ ${file.path}
${z.prettifyError(parsed.error)}`);
    return undefined;
  }
  return parsed.data;
}

/** Проверяет locked-tests.json: схема, уникальные id/slug и что они не совпадают с обычными тестами и играми. */
function inspectLockedTests(file: RawDataFile | undefined, items: ContentItem[], problems: string[]): LockedTest[] {
  if (!file) return [];
  if (file.parseError !== undefined) {
    problems.push(`❌ ${file.path}: файл не читается как JSON — проверь запятые и кавычки.\n${file.parseError}`);
    return [];
  }
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

export function buildCatalog(files: RawContentFile[], extras: ExtraContentFiles = {}): Catalog {
  const { files: reports, problems, lockedTests, cardGames, premium, premiumCodes, ultimate, sectionLayouts } = inspectContent(files, extras);
  if (problems.length > 0) throw new ContentError(problems);
  const catalog: Catalog = {
    tests: [],
    games: [],
    lockedTests,
    ...(cardGames ? { cardGames } : {}),
    ...(premium ? { premium } : {}),
    ...(premiumCodes ? { premiumCodes } : {}),
    ...(ultimate ? { ultimate } : {}),
    ...(sectionLayouts ? { sectionLayouts } : {}),
  };
  for (const { item } of reports) {
    if (item?.kind === "test") catalog.tests.push(item);
    else if (item?.kind === "game") catalog.games.push(item);
  }
  return catalog;
}
