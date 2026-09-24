// Ensambla apps-script/Index.html a partir de frontend/*.html (en orden alfabético).
// Uso:  node tools/ensamblar.mjs          → escribe apps-script/Index.html
//       node tools/ensamblar.mjs --check  → falla si Index.html no coincide con frontend/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(R, "frontend");
const partes = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
const html = partes.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("");
const destino = path.join(R, "apps-script", "Index.html");

if (process.argv.includes("--check")) {
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, "utf8") : "";
  if (actual !== html) {
    console.error("apps-script/Index.html no coincide con frontend/. Ejecuta: npm run ensamblar");
    process.exit(1);
  }
  console.log("Index.html al día (" + partes.length + " partes).");
} else {
  fs.writeFileSync(destino, html);
  console.log("Index.html ensamblado: " + partes.join(" + ") + " (" + html.length + " caracteres)");
}
