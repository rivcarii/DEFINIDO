// Captura PNG de cada correo de muestra en escritorio (680 px) y celular (375 px), con los logos incrustados.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const SAL = path.join(__dirname, "salida");
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Codigo.gs"), "utf8");
const img = n => (gs.match(new RegExp("var " + n + " = \"([^\"]*)\"")) || [])[1] || "";
const CID = { logoNiRed: img("LOGO_BASE64"), logoMiredB: img("LOGO_MIRED_B_BASE64"), logoSiauB: img("LOGO_SIAU_B_BASE64"),
              logoSiauC: img("LOGO_SIAU_BASE64"), medallaSiau: img("LOGO_SIAU_MEDALLA_BASE64"), mascotaSiau: img("MASCOTA_BASE64") };
(async () => {
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const lista = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(SAL).filter(f => /^muestra_.*\.html$/.test(f));
  for (const [sufijo, ancho] of [["", 680], ["_movil", 375]]) {
    const p = await b.newPage({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: ancho < 500 ? 2 : 1 });
    for (const f of lista) {
      let h = fs.readFileSync(path.join(SAL, path.basename(f)), "utf8");
      Object.keys(CID).forEach(k => { h = h.split("cid:" + k).join("data:image/png;base64," + CID[k]); });
      await p.setContent('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0">' + h + "</body>");
      await p.screenshot({ path: path.join(SAL, "correo_" + path.basename(f).replace(".html", sufijo + ".png")), fullPage: true });
    }
    await p.close();
  }
  await b.close();
})();
