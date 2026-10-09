// @gazgame/content — весь контент GAZ Game: схемы и типы.
// Сами данные лежат в packages/content/data/*.json.
// Загрузка с диска — в "@gazgame/content/node" (только для сервера и бота).
export * from "./schema";
export {
  buildCatalog,
  ContentError,
  inspectContent,
  type ContentIssue,
  type ContentReport,
  type FileReport,
  type RawContentFile,
} from "./validate";
