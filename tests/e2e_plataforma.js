const { chromium } = require("playwright");
const path = require("path");
const CAP = path.join(__dirname, "salida", "capturas") + "/";
require("fs").mkdirSync(CAP, { recursive: true });
(async () => {
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const url = "file://" + path.resolve(__dirname, "salida", "Vista_Previa_Plataforma.html");
  const errores = [];
  for (const w of [1600, 1366, 820, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
    p.on("pageerror", e => errores.push(w + " pageerror: " + e.message));
    p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errores.push(w + " console: " + m.text()); });
    const desb = async (v) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) errores.push(w + " desborde " + v + ": " + o + "px"); };
    await p.goto(url);
    await p.waitForSelector("#formAcceso #a_usuario", { timeout: 20000 });
    await desb("acceso"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_acceso.png` });
    const entrar = async (u) => {
      await p.fill("#a_usuario", u); await p.fill("#a_clave", "Demo2026"); await p.click("#btnAcceso");
      try { await p.waitForSelector("#v-inicio:not([hidden]) .hero", { timeout: 15000 }); }
      catch (e) { await p.screenshot({ path: CAP + "z_fallo_" + w + ".png" }); console.log(JSON.stringify(await p.evaluate(() => ({ app: document.getElementById("app").hidden, acc: document.getElementById("acceso").hidden, aviso: document.getElementById("accAviso").textContent, arr: document.getElementById("arranque").hidden, rect: document.querySelector("#v-inicio .hero") && JSON.stringify(document.querySelector("#v-inicio .hero").getBoundingClientRect()) })))); console.log(errores.join("\n")); throw e; } await p.waitForSelector("#meses .mes", { timeout: 15000 }); await p.waitForTimeout(900);
    };
    await entrar("siau.admin");
    await desb("inicio"); await p.screenshot({ path: CAP + `z_${w}_inicio.png`, fullPage: true });
    const irA = async (v) => {
      if (w <= 1000) { await p.click("#btnMenu"); await p.waitForTimeout(300); }
      await p.click('#menu button[data-v="' + v + '"]'); await p.waitForTimeout(500);
    };
    await irA("bandeja"); await p.click('#etapas button[data-e="todas"]'); await p.waitForSelector("#listaBandeja .fila", { timeout: 8000 }); await p.waitForTimeout(400);
    await desb("bandeja"); await p.screenshot({ path: CAP + `z_${w}_bandeja.png` });
    await p.click("#listaBandeja .fila"); await p.waitForSelector(".det-head .cod", { timeout: 8000 }); await p.waitForTimeout(400);
    await desb("detalle"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_detalle.png`, fullPage: true });
    await irA("correo"); await p.waitForSelector("#segCorreo button", { timeout: 10000 }); await p.waitForTimeout(400);
    await desb("correo"); await p.screenshot({ path: CAP + `z_${w}_correo.png`, fullPage: true });
    const inst = await p.$$eval("#listaCorreos .hilo", els => els.length);
    if (inst) { await p.click("#listaCorreos .hilo"); await p.waitForSelector("#vistaHilo .msg", { timeout: 8000 }); await p.waitForTimeout(400);
      if (!(await p.$("#x_cat"))) errores.push(w + " sin selector de categoría para EPS");
      await desb("hilo eps"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_hilo_eps.png`, fullPage: true }); }
    await irA("radicar"); await p.selectOption("#r_tipoPqrs", { index: 5 });
    await p.fill("#r_descripcion", "Quiero felicitar al médico pero la recepcionista fue grosera, me gritó y hubo mucha demora. Pésima atención.");
    await p.waitForSelector("#usarSug", { timeout: 6000 }).catch(() => errores.push(w + " sin sugerencia de tipo"));
    await desb("radicar"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_radicar.png` });
    await irA("tablero"); await p.waitForSelector("#gMesTipo", { timeout: 8000 }); await p.waitForTimeout(1200); await desb("tablero");
    await irA("usuarios"); await p.waitForSelector("#usrLista .usr", { timeout: 8000 }); await p.waitForTimeout(300);
    await desb("usuarios"); await p.screenshot({ path: CAP + `z_${w}_usuarios.png`, fullPage: true });
    await p.click("#btnNuevoUsr"); await p.waitForSelector("#u_sedes", { timeout: 5000 }); await p.waitForTimeout(300);
    await desb("modal usuario"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_usuario_nuevo.png` });
    await p.keyboard.press("Escape");
    await irA("config"); await p.waitForSelector("#tablaEntidades .cfg-fila[data-ent]", { timeout: 8000 }); await p.waitForTimeout(300);
    await desb("config"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_config.png`, fullPage: true });
    // técnico
    if (w >= 1366) {   // barra lateral fija al desplazarse
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
      const top = await p.evaluate(() => document.getElementById("lateral").getBoundingClientRect().top);
      if (Math.abs(top) > 1) errores.push(w + " la barra lateral se desplaza: top=" + top);
      await p.evaluate(() => window.scrollTo(0, 0));
    }
    await p.click("#btnPerfil"); await p.click("#btnSalir");
    await p.waitForSelector("#formAcceso #a_usuario", { timeout: 15000 });
    if (!/Cerraste sesión/.test(await p.textContent("#accAviso"))) errores.push(w + " sin mensaje al cerrar sesión");
    if (!(await p.$eval("#app", e => e.hidden))) errores.push(w + " la app sigue visible tras cerrar sesión");
    if ((await p.textContent("#detalleCuerpo")).trim()) errores.push(w + " quedaron datos del usuario anterior");
    await entrar("tecnico.playa");
    const visibles = await p.$$eval('#menu button[data-v]', els => els.filter(e => !e.hidden).map(e => e.dataset.v));
    if (visibles.includes("usuarios") || visibles.includes("correo")) errores.push(w + " técnico ve módulos de administración: " + visibles);
    await desb("inicio técnico"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_inicio_tecnico.png`, fullPage: true });
    await irA("bandeja"); await p.click('#etapas button[data-e="todas"]'); await p.waitForSelector("#listaBandeja .fila", { timeout: 8000 });
    const sedes = await p.$$eval("#listaBandeja .fila .med b", els => els.map(e => e.textContent));
    if (sedes.some(t => !/Camino La Playa|Camino Luz Chinita/.test(t))) errores.push(w + " el técnico ve sedes ajenas");
    if (!visibles.includes("radicar")) errores.push(w + " el técnico no ve Radicar");
    await p.click("#listaBandeja .fila"); await p.waitForSelector(".det-head .cod", { timeout: 8000 }); await p.waitForTimeout(300);
    if (!/Seguimiento de la gestión/.test(await p.textContent("#detalleCuerpo")) || (await p.$("#btnEnviarArea"))) errores.push(w + " el técnico ve acciones de gestión");
    if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_detalle_tecnico.png`, fullPage: w === 390 });
    await irA("bandeja"); await p.click('#etapas button[data-e="todas"]'); await p.waitForSelector("#listaBandeja .fila", { timeout: 8000 });
    if (w === 1366) {
      await p.waitForFunction(() => /Prioridad|Nueva PQRS/.test(document.getElementById("toasts").textContent), null, { timeout: 20000 }).catch(() => errores.push("sin aviso en segundo plano"));
      await p.screenshot({ path: CAP + `z_${w}_toast.png` });
    }
    await p.close();
  }
  console.log(errores.length ? errores.join("\n") : "SIN ERRORES");
  if (errores.length) process.exitCode = 1;
  await b.close();
})();
