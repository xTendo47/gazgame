// Загрузка контента с диска. Только для Node.js (сервер Next.js, бот, скрипты).
// Новый файл в data/tests или data/games появляется в приложении сам — код менять не нужно.
import fs from "node:fs";
import path from "node:path";
import { buildCatalog, inspectContent, type ContentReport, type ExtraContentFiles, type RawContentFile, type RawDataFile } from "./validate";
import type { Catalog } from "./schema";

const FOLDERS = { tests: "test", games: "game" } as const;

/**
 * Ищет папку packages/content/data, поднимаясь вверх от текущей папки.
 * Так загрузка работает из любого приложения монорепо (apps/web, apps/bot) и из тестов.
 */
export function findContentDir(start = process.cwd()): string {
  if (process.env.GAZ_CONTENT_DIR) return path.resolve(process.env.GAZ_CONTENT_DIR);
  let dir = path.resolve(start);
  for (;;) {
    for (const candidate of [path.join(dir, "packages", "content", "data"), path.join(dir, "data")]) {
      if (fs.existsSync(path.join(candidate, "tests")) && fs.existsSync(path.join(candidate, "games"))) {
        return candidate;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Не нашёл папку с контентом (packages/content/data), начиная с ${start}`);
    dir = parent;
  }
}

/** Читает все JSON-файлы. Файл с ошибкой в JSON не роняет чтение — ошибка попадёт в parseError. */
export function readContentFiles(contentDir = findContentDir()): RawContentFile[] {
  const files: RawContentFile[] = [];
  for (const [folder, kind] of Object.entries(FOLDERS)) {
    const dir = path.join(contentDir, folder);
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      const filePath = path.join(contentDir, folder, name);
      const shown = `packages/content/data/${folder}/${name}`;
      const raw = fs.readFileSync(filePath, "utf8");
      try {
        files.push({ path: shown, kind, data: JSON.parse(raw) as unknown });
      } catch (error) {
        files.push({ path: shown, kind, data: undefined, parseError: (error as Error).message });
      }
    }
  }
  return files;
}

/** Необязательный файл data/<name>. Файла нет — undefined (это не ошибка). */
function readDataFile(contentDir: string, name: string): RawDataFile | undefined {
  const filePath = path.join(contentDir, name);
  if (!fs.existsSync(filePath)) return undefined;
  const shown = `packages/content/data/${name}`;
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return { path: shown, data: JSON.parse(raw) as unknown };
  } catch (error) {
    return { path: shown, data: undefined, parseError: (error as Error).message };
  }
}

/** Платные тесты под замком: data/locked-tests.json. Файла нет — undefined (это не ошибка). */
export function readLockedTestsFile(contentDir = findContentDir()): RawDataFile | undefined {
  return readDataFile(contentDir, "locked-tests.json");
}

/** Необязательные файлы: платные тесты под замком и «Карточные игры». */
function readExtraFiles(dir: string): ExtraContentFiles {
  return {
    lockedTests: readLockedTestsFile(dir),
    cardGames: readDataFile(dir, "card-games.json"),
    premium: readDataFile(dir, "premium.json"),
    premiumCodes: readDataFile(dir, "premium-codes.json"),
    ultimate: readDataFile(dir, "ultimate.json"),
    sectionLayouts: readDataFile(dir, "sections.json"),
  };
}

/** Загружает и проверяет весь контент. Бросает ContentError со списком проблем. */
export function loadCatalog(contentDir?: string): Catalog {
  const dir = contentDir ?? findContentDir();
  return buildCatalog(readContentFiles(dir), readExtraFiles(dir));
}

/** Отчёт по каждому файлу, без падения на ошибках. Для страницы /dev/content. */
export function inspectContentDir(contentDir?: string): ContentReport {
  const dir = contentDir ?? findContentDir();
  return inspectContent(readContentFiles(dir), readExtraFiles(dir));
}
