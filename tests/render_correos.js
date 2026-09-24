const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const SAL = path.join(__dirname, "salida");
const logo = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Codigo.gs"), "utf8").match(/LOGO_BASE64 = "([^"]+)"/)[1];
(async () => {
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}); const p = await b.newPage({ viewport: { width: 680, height: 900 } });
  const lista = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(SAL).filter(f => /^muestra_.*\.html$/.test(f));
  for (const f of lista) {
    const h = fs.readFileSync(path.join(SAL, path.basename(f)), "utf8").replace(/cid:logoNiRed/g, "data:image/png;base64," + logo);
    await p.setContent('<meta charset="utf-8"><body style="margin:0">' + h + "</body>");
    await p.screenshot({ path: path.join(SAL, "correo_" + path.basename(f).replace(".html", ".png")), fullPage: true });
  }
  await b.close();
})();
