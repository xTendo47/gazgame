// @gazgame/content — весь контент GAZ Game: схемы и типы.
// Сами данные лежат в packages/content/data/*.json.
// Загрузка с диска — в "@gazgame/content/node" (только для сервера и бота).
export * from "./schema";
export * from "./sections";
export * from "./premium-codes";
export {
  buildCatalog,
  findHiddenEmoji,
  hiddenEmojiMessage,
  ContentError,
  inspectContent,
  type ContentIssue,
  type ContentReport,
  type FileReport,
  type RawContentFile,
  type RawLockedTestsFile,
  type RawDataFile,
  type ExtraContentFiles,
} from "./validate";
