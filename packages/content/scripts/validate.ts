// npm run content:check — проверить все файлы контента и вывести понятный отчёт.
import { loadCatalog } from "../src/node";

try {
  const catalog = loadCatalog();
  const all = [...catalog.tests, ...catalog.games];
  console.log(`✅ Контент в порядке: тестов — ${catalog.tests.length}, игр — ${catalog.games.length}`);
  for (const item of all) {
    console.log(`   ${item.emoji} ${item.title} (${item.kind}, ${item.status})`);
  }
  const locked = catalog.lockedTests ?? [];
  if (locked.length > 0) {
    console.log(`🔒 Платных тестов под замком: ${locked.length}`);
    for (const t of locked) console.log(`   ${t.emoji} ${t.title} (${t.locked.text})`);
  }
  if (catalog.cardGames) {
    console.log(`${catalog.cardGames.emoji} ${catalog.cardGames.title}: игр — ${catalog.cardGames.games.length}`);
  }
if (catalog.gaz) {
    const g = catalog.gaz;
    console.log(`🚀 GAZ: «Мне скучно» — ${g.bored.length}, рулетка — ${g.roulette.length}, челленджей — ${g.challenges.length}, наборов — ${g.packs.length}`);
  }
if (catalog.today) {
    const t = catalog.today;
    console.log(`🔥 Сегодня: батлов — ${t.battles.length}, вопросов — ${t.questions.length}, ступенек наград — ${t.ladder.length}`);
  }
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
