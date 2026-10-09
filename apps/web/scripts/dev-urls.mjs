// Печатает адреса сайта разработки перед запуском `next dev`.
// Next.js сам показывает только один «Network»-адрес, и это часто адрес VPN, который с телефона не открыть.
// Здесь — все адреса домашней сети (192.168.x.x, 10.x.x.x, 172.16–31.x.x).
import os from "node:os";

const port = process.env.PORT ?? "3000";
const isHomeNetwork = (ip) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);

const lan = Object.values(os.networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal && isHomeNetwork(net.address))
  .map((net) => `http://${net.address}:${port}`);

console.log("\n  🔥 GAZ Game — сайт разработки");
console.log(`  Компьютер:  http://localhost:${port}`);
for (const url of lan) console.log(`  Телефон:    ${url}   (тот же Wi-Fi)`);
if (lan.length === 0) console.log("  Телефон:    адрес домашней сети не найден — проверь Wi-Fi");
console.log(`  Контент:    http://localhost:${port}/dev/content\n`);
