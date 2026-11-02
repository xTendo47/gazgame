// Тесты читают JSON из packages/content/data напрямую; в данных вместо эмодзи стоят ключи значков, поэтому разворачиваем их
// в эмодзи при импорте (так же, как это делает загрузчик контента в node.ts).
import { defineConfig } from "vitest/config";
import { expandEmojiKeys } from "../content/src/emoji-keys";

export default defineConfig({
  plugins: [
    {
      name: "expand-emoji-keys",
      enforce: "pre",
      transform(code, id) {
        if (!/packages\/content\/data\/.*\.json$/.test(id.replaceAll("\\", "/"))) return null;
        return { code: JSON.stringify(expandEmojiKeys(JSON.parse(code) as unknown)), map: null };
      },
    },
  ],
});
