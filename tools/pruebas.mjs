// Corre las pruebas del backend en las dos configuraciones regionales de Google Sheets
// (fórmulas con «,» y con «;») y verifica que Index.html esté ensamblado. Funciona en Windows, macOS y Linux.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const correr = (titulo, args, env = {}) => {
  console.log("\n=== " + titulo + " ===");
  const r = spawnSync(process.execPath, args, { cwd: R, stdio: "inherit", env: { ...process.env, ...env } });
  return r.status === 0;
};
let ok = correr("Index.html al día", ["tools/ensamblar.mjs", "--check"]);
ok = correr("Backend · hoja con separador «,»", ["tests/pruebas_backend.js"]) && ok;
ok = correr("Backend · hoja con separador «;» (configuración regional de Colombia)", ["tests/pruebas_backend.js"], { LOCALE_PC: "1" }) && ok;
ok = correr("Versión 8 · separador «,»", ["tests/pruebas_v8.js"]) && ok;
ok = correr("Versión 8 · separador «;»", ["tests/pruebas_v8.js"], { LOCALE_PC: "1" }) && ok;
console.log(ok ? "\nTODAS LAS PRUEBAS PASARON" : "\nHAY PRUEBAS QUE FALLARON");
process.exit(ok ? 0 : 1);
