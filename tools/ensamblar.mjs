// Ensambla apps-script/Index.html a partir de frontend/*.html (en orden alfabético).
// Las marcas <!-- VENDOR nombre --> se reemplazan por frontend/vendor/nombre.js dentro de <script>
// (librería de QR y las imágenes incrustadas): así la plataforma no depende de CDN para eso.
// Uso:  node tools/ensamblar.mjs          → escribe apps-script/Index.html
//       node tools/ensamblar.mjs --check  → falla si Index.html no coincide con frontend/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(R, "frontend");
const partes = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
let html = partes.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("");
html = html.replace(/<!-- VENDOR ([\w.-]+) -->/g, (m, nombre) => {
  const js = fs.readFileSync(path.join(dir, "vendor", nombre + ".js"), "utf8");
  if (js.includes("</script")) throw new Error(nombre + ".js no puede contener «</script»");
  return "<script>\n" + js + "\n</script>";
});
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
