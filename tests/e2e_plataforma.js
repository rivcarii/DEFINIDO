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
    // v8.5 · la mascota del ingreso no se distorsiona y las 4 letras orbitan (cada una con su propia órbita)
    if (w >= 1001) {
      const m = await p.evaluate(() => { const i = document.getElementById("mascotaHero"), r = i.getBoundingClientRect(); return { nat: i.naturalWidth / i.naturalHeight, vis: r.width / r.height, orb: document.querySelectorAll(".orb").length, anim: getComputedStyle(document.querySelector(".orb.o1")).animationName }; });
      if (Math.abs(m.nat - m.vis) > 0.02) errores.push(w + " la mascota del ingreso se deforma: natural " + m.nat + " vs visible " + m.vis);
      if (m.orb !== 4 || m.anim !== "orbitar") errores.push(w + " las órbitas P-Q-R-S no están animadas");
    }
    // v9.3 · el ingreso cabe en una pantalla: sin desplazarse en escritorio y con el botón visible en celular y tableta
    const ing = await p.evaluate(() => ({ alto: document.documentElement.scrollHeight, vp: window.innerHeight, boton: document.getElementById("btnAcceso").getBoundingClientRect().bottom }));
    if (w >= 1366 && ing.alto > ing.vp + 1) errores.push(w + " el ingreso obliga a desplazarse: " + ing.alto + " > " + ing.vp);
    if (ing.boton > ing.vp) errores.push(w + " el botón Ingresar queda fuera de la pantalla: " + Math.round(ing.boton) + " > " + ing.vp);
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
    // v8 · vista de prioritarias con el comando de identificación
    await irA("prioritarias"); await p.waitForSelector("#prioLista .pr-card", { timeout: 10000 }).catch(() => errores.push(w + " sin tarjetas de prioritarias"));
    await p.click("#btnIdentificar"); await p.waitForSelector("#prioAviso .aviso", { timeout: 10000 }).catch(() => errores.push(w + " el comando Identificar no respondió"));
    await p.waitForTimeout(400); await desb("prioritarias");
    if (!/Riesgo vital · menor de edad/.test(await p.textContent("#prioLista"))) errores.push(w + " no aparece el caso de riesgo vital en menor de edad");
    if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_prioritarias.png`, fullPage: true });
    await irA("bandeja"); await p.click('#etapas button[data-e="todas"]'); await p.waitForSelector("#listaBandeja .fila", { timeout: 8000 }); await p.waitForTimeout(400);
    await desb("bandeja"); await p.screenshot({ path: CAP + `z_${w}_bandeja.png` });
    await p.click("#listaBandeja .fila"); await p.waitForSelector(".det-head .cod", { timeout: 8000 }); await p.waitForTimeout(400);
    await desb("detalle"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_detalle.png`, fullPage: true });
    await irA("correo"); await p.waitForSelector("#segCorreo button", { timeout: 10000 }); await p.waitForTimeout(400);
    await desb("correo"); await p.screenshot({ path: CAP + `z_${w}_correo.png`, fullPage: true });
    const inst = await p.$$eval("#listaCorreos .hilo", els => els.length);
    if (inst) { await p.click("#listaCorreos .hilo"); await p.waitForSelector("#vistaHilo .msg", { timeout: 8000 }); await p.waitForTimeout(400);
      if (!(await p.$("#x_cat"))) errores.push(w + " sin selector de categoría para EPS");
      if (!(await p.$("#vistaHilo .analisis"))) errores.push(w + " el hilo de la EPS no muestra el análisis detallado");
      else if (!/Qué hacer/.test(await p.textContent("#vistaHilo .analisis"))) errores.push(w + " el análisis no trae las acciones sugeridas");
      await desb("hilo eps"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_hilo_eps.png`, fullPage: true }); }
    await irA("radicar"); await p.selectOption("#r_tipoPqrs", { index: 5 });
    await p.fill("#r_descripcion", "Quiero felicitar al médico pero la recepcionista fue grosera, me gritó y hubo mucha demora. Pésima atención.");
    await p.waitForSelector("#usarSug", { timeout: 6000 }).catch(() => errores.push(w + " sin sugerencia de tipo"));
    await desb("radicar"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_radicar.png` });
    // v8.2 · el radicado aparece al instante y el acuse llega en un segundo paso
    await p.fill("#r_correo", "e2e.usuario@correo.com"); await p.click("#btnRadicar");
    await p.waitForSelector("#radExito:not([hidden]) .cod", { timeout: 15000 }).catch(() => errores.push(w + " no se mostró el radicado"));
    if (!/^SIAU-\d{4}-\d{2}-\d{4,}$/.test((await p.textContent("#radExito .cod")).trim())) errores.push(w + " radicado con formato inesperado");
    await p.waitForFunction(() => /enviado a e2e\.usuario@correo\.com/.test((document.getElementById("radAcuse") || {}).textContent || ""), null, { timeout: 15000 })
      .catch(() => errores.push(w + " el acuse en segundo plano no se completó"));
    await desb("radicado");
    await irA("tablero"); await p.waitForSelector("#gMesTipo", { timeout: 8000 }); await p.waitForTimeout(1200); await desb("tablero");
    if (await p.$eval("#bloqueExcel", e => e.hidden)) errores.push(w + " el administrador no ve «Exportar a Excel»");
    else {
      const [descarga] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.click("#btnExportarExcel")]);
      if (!descarga || !/^Consolidado_PQRS_.*\.xlsx$/.test(descarga.suggestedFilename())) errores.push(w + " no se descargó el Excel del tablero");
      await p.waitForFunction(() => /Excel listo/.test(document.getElementById("toasts").textContent), null, { timeout: 15000 }).catch(() => errores.push(w + " sin aviso de Excel listo"));
    }
    await irA("usuarios"); await p.waitForSelector("#usrLista .usr", { timeout: 8000 }); await p.waitForTimeout(300);
    await p.waitForSelector("#audLista .aud-fila:not(.aud-cab)", { timeout: 8000 }).catch(() => errores.push(w + " la auditoría de accesos no muestra eventos"));
    if (!/Ingreso correcto/.test(await p.textContent("#audLista"))) errores.push(w + " la auditoría no registra el ingreso del administrador");
    await desb("usuarios"); await p.screenshot({ path: CAP + `z_${w}_usuarios.png`, fullPage: true });
    await p.click("#btnNuevoUsr"); await p.waitForSelector("#u_sedes", { timeout: 5000 }); await p.waitForTimeout(300);
    await desb("modal usuario"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_usuario_nuevo.png` });
    await p.keyboard.press("Escape");
    await irA("config"); await p.waitForSelector("#tablaEntidades .cfg-fila[data-ent]", { timeout: 8000 }); await p.waitForTimeout(300);
    await p.waitForSelector("#qrImagen svg", { timeout: 8000 }).catch(() => errores.push(w + " sin código QR del formulario"));
    if (!(await p.$("#aj_pushTema")) || (await p.$("#aj_acuseInstitucional"))) errores.push(w + " configuración de push ausente o con el acuse automático a EPS todavía visible");
    else { await p.fill("#aj_pushTema", ""); await p.click("#btnGenerarPush"); if (!/^pqrs-miredips-[a-z2-9]{14}$/.test(await p.inputValue("#aj_pushTema"))) errores.push(w + " el generador del tema del push no funcionó"); }
    await p.click("#btnRespaldarAhora"); await p.waitForFunction(() => /Respaldo guardado en Drive/.test((document.getElementById("respAviso") || {}).textContent || ""), null, { timeout: 15000 })
      .catch(() => errores.push(w + " el respaldo ahora no respondió"));
    await p.click("#btnDiagnostico"); await p.waitForSelector("#diagCuerpo .dg", { timeout: 8000 }).catch(() => errores.push(w + " sin diagnóstico"));
    await desb("config"); if (w === 1366) await p.screenshot({ path: CAP + `z_${w}_config.png`, fullPage: true });
    // técnico
    if (w >= 1366) {   // barra lateral fija al desplazarse
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
      const top = await p.evaluate(() => document.getElementById("lateral").getBoundingClientRect().top);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
      const top0 = await p.evaluate(() => document.getElementById("lateral").getBoundingClientRect().top);
      if (Math.abs(top - top0) > 1) errores.push(w + " la barra lateral se desplaza: top=" + top + " (en reposo " + top0 + ")");
      await p.evaluate(() => window.scrollTo(0, 0));
    }
    if (w === 1366) {   // afiche del QR: todo cabe en la hoja A4
      const html = await p.evaluate(() => htmlAficheQR("https://forms.gle/PQRSMiRedIPS"));
      const q = await b.newPage({ viewport: { width: 794, height: 1123 } });
      await q.setContent(html); await q.waitForTimeout(300);
      const fuera = await q.evaluate(() => { const h = document.querySelector(".hoja").getBoundingClientRect(); let n = 0; document.querySelectorAll(".hoja *:not(.aro)").forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.bottom > h.bottom + 1 || r.right > h.right + 1)) n++; }); return n; });
      if (fuera) errores.push("el afiche del QR se sale de la hoja A4 (" + fuera + " elementos)");
      await q.screenshot({ path: CAP + "z_afiche_qr.png" }); await q.close();
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
    if (!(await p.$eval("#bloqueExcel", e => e.hidden))) errores.push(w + " el técnico ve el botón de exportar a Excel");
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
