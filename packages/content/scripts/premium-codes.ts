// npm run premium:codes -- 30 — выдать N кодов Премиума для фокус-группы.
// Коды (GAZ-7K2M) дописываются в premium-codes.txt в корне репозитория — он в .gitignore, в git не попадает.
// SHA-256 кодов дописываются в packages/content/data/premium-codes.json — это в git, по нему проверяет устройство.
// Старые коды не теряются: новые добавляются к ним, повторов нет.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { generatePremiumCode, normalizePremiumCode } from "../src/premium-codes";
import { findContentDir } from "../src/node";

const count = Number(process.argv[2] ?? "");
if (!Number.isInteger(count) || count < 1 || count > 1000) {
  console.error("Сколько кодов? Например: npm run premium:codes -- 30");
  process.exit(1);
}

const dataDir = findContentDir();
const repoRoot = path.resolve(dataDir, "..", "..", "..");
const txtPath = path.join(repoRoot, "premium-codes.txt");
const jsonPath = path.join(dataDir, "premium-codes.json");
const NOTE =
  "SHA-256 кодов Премиума 💎 (код без пробелов, большими буквами). Сами коды — в premium-codes.txt в корне, его нет в git. Новые коды: npm run premium:codes -- 30";

const sha256 = (code: string) => createHash("sha256").update(normalizePremiumCode(code), "utf8").digest("hex");

const existing: { hashes: string[] } = fs.existsSync(jsonPath)
  ? (JSON.parse(fs.readFileSync(jsonPath, "utf8")) as { hashes: string[] })
  : { hashes: [] };
const taken = new Set(existing.hashes);

const codes: string[] = [];
while (codes.length < count) {
  const code = generatePremiumCode();
  const hash = sha256(code);
  if (taken.has(hash)) continue;
  taken.add(hash);
  codes.push(code);
}

fs.appendFileSync(txtPath, codes.map((c) => `${c}\n`).join(""), "utf8");
fs.writeFileSync(jsonPath, `${JSON.stringify({ _note: NOTE, hashes: [...existing.hashes, ...codes.map(sha256)] }, null, 2)}\n`, "utf8");

console.log(`✅ Новых кодов: ${codes.length} (всего: ${existing.hashes.length + codes.length})`);
console.log(`   Коды: ${txtPath}`);
console.log(`   Хэши: ${jsonPath}`);
