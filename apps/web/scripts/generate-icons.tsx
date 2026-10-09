// Генерирует иконки приложения (PWA, iPhone, вкладка браузера) в фирменном стиле.
// Запуск из корня: npm run icons --workspace=@gazgame/web
// Нужен интернет: шрифт Unbounded скачивается с Google Fonts.
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

const BG = "#141217";
const ORANGE = "#FF5A1F";
const LIME = "#D4FF3A";

async function loadFont(): Promise<ArrayBuffer> {
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Unbounded:wght@900&text=GAZ")).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("Не удалось найти шрифт в ответе Google Fonts");
  return (await fetch(url)).arrayBuffer();
}

/** scale — какую часть иконки занимает логотип (для maskable меньше, чтобы не обрезалось). */
function Icon({ size, scale }: { size: number; scale: number }) {
  return (
    <div style={{ width: size, height: size, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "Unbounded", fontSize: size * 0.3 * scale, color: ORANGE, letterSpacing: -size * 0.01 }}>
          GAZ
        </div>
        <div style={{ width: size * 0.42 * scale, height: size * 0.05 * scale, background: LIME, borderRadius: size }} />
      </div>
    </div>
  );
}

async function main() {
  const font = await loadFont();
  const webRoot = path.join(import.meta.dirname, "..");
  const targets = [
    { file: "public/icons/icon-192.png", size: 192, scale: 1 },
    { file: "public/icons/icon-512.png", size: 512, scale: 1 },
    { file: "public/icons/icon-maskable-512.png", size: 512, scale: 0.75 },
    { file: "app/icon.png", size: 192, scale: 1 },
    { file: "app/apple-icon.png", size: 180, scale: 0.9 },
  ];
  for (const { file, size, scale } of targets) {
    const image = new ImageResponse(<Icon size={size} scale={scale} />, {
      width: size,
      height: size,
      fonts: [{ name: "Unbounded", data: font, weight: 900, style: "normal" }],
    });
    const out = path.join(webRoot, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await image.arrayBuffer()));
    console.log(`✅ ${file}`);
  }

  // favicon.ico — браузеры запрашивают его сами. ICO-файл с PNG внутри (48×48).
  const favicon = new ImageResponse(<Icon size={48} scale={1.1} />, {
    width: 48,
    height: 48,
    fonts: [{ name: "Unbounded", data: font, weight: 900, style: "normal" }],
  });
  const png = Buffer.from(await favicon.arrayBuffer());
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // зарезервировано
  header.writeUInt16LE(1, 2); // тип: иконка
  header.writeUInt16LE(1, 4); // одна картинка
  header.writeUInt8(48, 6); // ширина
  header.writeUInt8(48, 7); // высота
  header.writeUInt16LE(1, 10); // плоскости
  header.writeUInt16LE(32, 12); // бит на пиксель
  header.writeUInt32LE(png.length, 14); // размер картинки
  header.writeUInt32LE(22, 18); // где начинается картинка
  fs.writeFileSync(path.join(webRoot, "app/favicon.ico"), Buffer.concat([header, png]));
  console.log("✅ app/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
