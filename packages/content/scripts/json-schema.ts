// npm run schema --workspace=@gazgame/content
// Генерирует data/schema/*.schema.json из zod-схем.
// Благодаря им VS Code подсказывает поля и подчёркивает ошибки прямо в JSON-файлах.
// Запускай после изменения src/schema.ts.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { gameSchema, testSchema } from "../src/schema";

const outDir = path.join(import.meta.dirname, "..", "data", "schema");
fs.mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries({ test: testSchema, game: gameSchema })) {
  const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
  fs.writeFileSync(path.join(outDir, `${name}.schema.json`), JSON.stringify(json, null, 2) + "\n");
  console.log(`✅ data/schema/${name}.schema.json`);
}
