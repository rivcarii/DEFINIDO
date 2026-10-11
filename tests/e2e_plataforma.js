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
    await p.route(/script\.google\.com\/(a\/[^/]+\/)?macros\//, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><meta charset=\"utf-8\"><title>Evidencias</title><p id=\"ok\">módulo de prueba</p>" }));   // el módulo propio (otro proyecto) se simula
    p.on("pageerror", e => errores.push(w + " pageerror: " + e.message));
    p.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errores.push(w + " console: " + m.text()); });
    const desb = async (v) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) errores.push(w + " desborde " + v + ": " + o + "px"); };
    await p.goto(url);
    await p.waitForSelector("#formAcceso #a_usuario", { timeout: 20000 });
    await desb("acceso"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_acceso.png` });
    // v8.5 · la medalla del ingreso (centro de las órbitas) no se distorsiona y las 4 letras orbitan (cada una con su propia órbita)
    if (w >= 1001) {
      const m = await p.evaluate(() => { const i = document.getElementById("medallaHero"), r = i.getBoundingClientRect(); return { nat: i.naturalWidth / i.naturalHeight, vis: r.width / r.height, orb: document.querySelectorAll(".orb").length, anim: getComputedStyle(document.querySelector(".orb.o1")).animationName }; });
      if (Math.abs(m.nat - m.vis) > 0.02) errores.push(w + " la medalla del ingreso se deforma: natural " + m.nat + " vs visible " + m.vis);
      const fl = await p.evaluate(() => { const i = document.getElementById("medallaHero"), c = getComputedStyle(i), o = getComputedStyle(document.querySelector(".orb i"));
        return { bg: c.backgroundColor, radio: c.borderRadius, sombra: c.boxShadow, brillo: o.backgroundImage, pill: !!document.querySelector(".hero-pill"), leyenda: !!document.querySelector(".hero-leyenda") }; });
      if (fl.bg !== "rgba(0, 0, 0, 0)" || fl.sombra !== "none") errores.push(w + " la medalla del ingreso tiene fondo o sombra: " + JSON.stringify(fl));
      if (fl.brillo !== "none") errores.push(w + " los planetas no son planos (2D): " + fl.brillo);
      if (fl.pill || fl.leyenda) errores.push(w + " siguen el rótulo «La mejora comienza contigo» o la leyenda de tipos");
      if (m.orb !== 4 || m.anim !== "orbitar") errores.push(w + " las órbitas P-Q-R-S no están animadas");
    }
    // v9.3 · el ingreso cabe en una pantalla: sin desplazarse en escritorio y con el botón visible en celular y tableta
    const ing = await p.evaluate(() => ({ alto: document.documentElement.scrollHeight, vp: window.innerHeight, boton: document.getElementById("btnAcceso").getBoundingClientRect().bottom }));
    if (w >= 1366 && ing.alto > ing.vp + 1) errores.push(w + " el ingreso obliga a desplazarse: " + ing.alto + " > " + ing.vp);
    if (ing.boton > ing.vp) errores.push(w + " el botón Ingresar queda fuera de la pantalla: " + Math.round(ing.boton) + " > " + ing.vp);
    const entrar = async (u) => {
      await p.fill("#a_usuario", u); await p.fill("#a_clave", "Demo2026"); await p.click("#btnAcceso");
      try { await p.waitForSelector("#v-hub:not([hidden]) .hub-card, #v-inicio:not([hidden]) .hero", { timeout: 15000 }); }
      catch (e) { await p.screenshot({ path: CAP + "z_fallo_" + w + ".png" }); console.log(JSON.stringify(await p.evaluate(() => ({ app: document.getElementById("app").hidden, acc: document.getElementById("acceso").hidden, aviso: document.getElementById("accAviso").textContent, arr: document.getElementById("arranque").hidden, rect: document.querySelector("#v-inicio .hero") && JSON.stringify(document.querySelector("#v-inicio .hero").getBoundingClientRect()) })))); console.log(errores.join("\n")); throw e; } if (await p.$eval("#v-inicio", e => !e.hidden)) await p.waitForSelector("#meses .mes", { timeout: 15000 }); await p.waitForTimeout(900);
    };
    await entrar("siau.admin");

    // v9.5 · el logo y la cuenta quedan fijos en la barra lateral; solo el menú se desplaza
    if (w >= 1001) {
      await p.setViewportSize({ width: w, height: 520 }); await p.waitForTimeout(300);
      const lat = async () => p.evaluate(() => { const l = document.getElementById("lateral"), m = document.getElementById("menu"), u = document.querySelector(".lat-usuario").getBoundingClientRect(), k = document.querySelector(".lat-marca").getBoundingClientRect();
        return { lscroll: l.scrollHeight - l.clientHeight, mscroll: m.scrollHeight - m.clientHeight, uBottom: Math.round(u.bottom), uTop: Math.round(u.top), kTop: Math.round(k.top), alto: innerHeight }; });
      const a1 = await lat(); await p.evaluate(() => { document.getElementById("menu").scrollTop = 9999; }); await p.waitForTimeout(150); const a2 = await lat();
      if (a1.lscroll > 1) errores.push(w + " la barra lateral entera se desplaza (debe desplazarse solo el menú): " + JSON.stringify(a1));
      if (a1.mscroll <= 0) errores.push(w + " con poca altura el menú no se desplaza por sí solo: " + JSON.stringify(a1));
      if (a1.uBottom > a1.alto || a2.uTop !== a1.uTop || a2.kTop !== a1.kTop) errores.push(w + " la cuenta o el logo se mueven con el menú: " + JSON.stringify([a1, a2]));
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(200);
    }
    // v9.9 · Inicio general: el administrador entra a Módulos; PQRS se abre dentro y Seguimiento SIAU redirige a otra pestaña
    {
      if (await p.$eval("#v-hub", e => e.hidden)) errores.push(w + " el administrador no aterriza en Módulos");
      const tarjetas = await p.$$eval("#hubCuerpo .hub-card", els => els.map(e => e.dataset.modulo));
      if (tarjetas.join() !== "pqrs,seguimiento,proximo") errores.push(w + " tarjetas de módulos inesperadas: " + tarjetas);
      await p.waitForSelector('#hubCuerpo [data-hub-enlaces="seguimiento"] button', { timeout: 8000 }).catch(() => errores.push(w + " la tarjeta de Seguimiento SIAU no trae sus botones"));
      if ((await p.$$('#hubCuerpo [data-hub-enlaces="seguimiento"] button')).length !== 2) errores.push(w + " Seguimiento SIAU debe ofrecer visor y administrador");
      await p.waitForFunction(() => /vencidas/.test((document.querySelector('[data-hub-dato="pqrs"]') || {}).textContent || ""), null, { timeout: 8000 }).catch(() => errores.push(w + " la tarjeta de PQRS no muestra sus cifras"));
      const alt = await p.$$eval("#hubCuerpo .hub-card", els => els.map(e => Math.round(e.getBoundingClientRect().height)));
      await p.waitForTimeout(400); await desb("modulos"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_modulos.png`, fullPage: true });
      // el módulo propio se ejecuta DENTRO de la plataforma, en un marco aislado
      await p.click('#hubCuerpo [data-hub-enlaces="seguimiento"] button[data-vista="visor"]');
      await p.waitForSelector("#v-modulo:not([hidden]) #modFrame", { timeout: 8000 }).catch(() => errores.push(w + " el módulo no se abre dentro de la plataforma"));
      const marco = await p.$eval("#modFrame", e => ({ src: e.getAttribute("src"), sb: e.getAttribute("sandbox"), ref: e.getAttribute("referrerpolicy") })).catch(() => ({}));
      const DOM = /^https:\/\/script\.google\.com\/a\/miredips\.org\/macros\/s\/[^/]+\/exec$/, COM = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/;
      if (!DOM.test(marco.src || "")) errores.push(w + " el marco debe usar la dirección de dominio tal cual (la que abre en la pestaña): " + marco.src);
      if (!/allow-scripts/.test(marco.sb || "") || /allow-top-navigation/.test(marco.sb || "") || marco.ref !== "no-referrer") errores.push(w + " el marco no está aislado como se espera: " + JSON.stringify(marco));
      if ((await p.getAttribute("#btnModPestana", "href")) !== marco.src) errores.push(w + " «Otra pestaña» no abre la misma dirección que el marco");
      const dentro = await (await p.$("#modFrame")).contentFrame(); await dentro.waitForSelector("#ok", { timeout: 6000 }).catch(() => errores.push(w + " el contenido del módulo no se ejecutó dentro del marco"));
      if (!/Dirección en uso: …\/s\/AKfycbxkOj/.test(await p.textContent("#modDireccion"))) errores.push(w + " el módulo no muestra qué dirección está usando");
      // v9.10.1 · diagnóstico automático: el servidor le pregunta a Google y la pantalla lo cuenta (aquí «Google» responde público)
      await p.waitForFunction(() => /Google no pide iniciar sesión/.test((document.getElementById("modDiag") || {}).textContent || ""), null, { timeout: 8000 }).catch(() => errores.push(w + " el módulo no muestra el diagnóstico de acceso"));
      if (/El servidor (está en la versión|es anterior)/.test(await p.textContent("#modDiag"))) errores.push(w + " avisa versión desactualizada con servidor y pantalla iguales");
      if ((await p.$$("#modTabs button")).length !== 2) errores.push(w + " faltan las pestañas Visor y Administrador del módulo");
      // otra forma de la dirección (común) para probar si la de dominio no abre
      if (await p.$eval("#btnModAlterna", e => e.hidden)) errores.push(w + " falta el botón para probar la otra forma de la dirección");
      else {
        await p.click("#btnModAlterna"); await p.waitForTimeout(200);
        if (!COM.test(await p.getAttribute("#modFrame", "src"))) errores.push(w + " «otra forma de la dirección» no cambia el marco a la forma común");
        if ((await p.getAttribute("#btnModPestana", "href")) !== marco.src) errores.push(w + " «Otra pestaña» no debe cambiar al probar la otra forma");
        await p.click("#btnModAlterna"); await p.waitForTimeout(200);
        if ((await p.getAttribute("#modFrame", "src")) !== marco.src) errores.push(w + " no vuelve a la dirección original");
      }
      await p.click("#btnModProbar"); await p.waitForFunction(() => /Google no pide iniciar sesión/.test(document.getElementById("modDiag").textContent), null, { timeout: 8000 }).catch(() => errores.push(w + " «Comprobar acceso» no responde"));
      await p.click('#modTabs button[data-mod-vista="admin"]'); await p.waitForTimeout(300);
      if (!/\/a\/miredips\.org\/.*\?pagina=admin$/.test(await p.getAttribute("#modFrame", "src"))) errores.push(w + " la pestaña Administrador no cambia el marco (con la dirección de dominio)");
      await desb("modulo"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_modulo_abierto.png` });
      // el texto del diagnóstico para cada respuesta de Google (inicio de sesión, no existe, prohíbe marcos)
      const textos = await p.evaluate(() => {
        var R = function(v, t, extra){ return textoSondeo(Object.assign({ veredicto: v, bloqueaMarco: false, resultados: [{ pagina: "visor", tipo: t, http: 302, destino: "accounts.google.com" }] }, extra || {})); };
        return { login: R("login", "login"), noexiste: R("no_encontrada", "no_encontrada"), bloquea: R("publica", "publica", { bloqueaMarco: true }), sinR: R("sin_respuesta", "sin_respuesta") };
      });
      if (textos.login.tipo !== "err" || !/no es pública/.test(textos.login.html) || !/Cualquier persona/.test(textos.login.html)) errores.push(w + " el aviso de «Google pide iniciar sesión» no explica qué hacer");
      if (textos.noexiste.tipo !== "err" || !/archivada/.test(textos.noexiste.html) || textos.bloquea.tipo !== "err" || !/ALLOWALL/.test(textos.bloquea.html) || textos.sinR.tipo !== "info") errores.push(w + " avisos del diagnóstico incompletos");
      // nunca en silencio: si el servidor no entrega la dirección (servidor desactualizado), la pantalla lo dice y «Otra pestaña» no queda muerto sin explicación
      await p.evaluate(() => { window.__seg = MOD_DATOS.seguimiento; MOD_DATOS.seguimiento = { ok: true, visor: "", admin: "" }; abrirModulo("seguimiento", "visor"); });
      await p.waitForSelector("#modFallo:not([hidden])", { timeout: 4000 }).catch(() => errores.push(w + " sin dirección del módulo la pantalla queda muda"));
      if (!/No llegó la dirección/.test(await p.textContent("#modFallo")) || !/El servidor es anterior a la 9\.10\.1/.test(await p.textContent("#modDiag")) || (await p.$("#modFrame"))) errores.push(w + " el aviso de servidor desactualizado no aparece");
      await p.evaluate(() => { MOD_DATOS.seguimiento = window.__seg; });
      // servidor 9.9 (sin visorEmbed): el marco igual abre con visor/admin
      await p.evaluate(() => { var o = Object.assign({}, window.__seg); delete o.version; delete o.visorAlt; delete o.adminAlt; MOD_DATOS.seguimiento = o; abrirModulo("seguimiento", "visor"); });
      await p.waitForSelector("#modFrame", { timeout: 4000 }).catch(() => errores.push(w + " con un servidor anterior el marco no abre"));
      if (!/es anterior a la 9\.10\.1/.test(await p.textContent("#modDiag")) || !(await p.$eval("#btnModAlterna", e => e.hidden))) errores.push(w + " con un servidor anterior no se avisa la versión o muestra la forma alternativa");
      await p.evaluate(() => { MOD_DATOS.seguimiento = window.__seg; });
      // versiones: se comparan como números (9.10 es MAYOR que 9.9), y un servidor más nuevo que la pantalla no salta el diagnóstico
      { const cv = await p.evaluate(() => [cmpVersion("9.9", "9.10"), cmpVersion("9.10.2", "9.10.1"), cmpVersion("9.10.1", "9.10.1"), cmpVersion("9.10", "9.10.1")]);
        if (JSON.stringify(cv) !== "[-1,1,0,-1]") errores.push(w + " la comparación de versiones no es numérica: " + JSON.stringify(cv)); }
      await p.evaluate(() => { var o = Object.assign({}, window.__seg); o.version = "9.10.9"; MOD_DATOS.seguimiento = o; abrirModulo("seguimiento", "visor"); });
      await p.waitForFunction(() => /Google no pide iniciar sesión/.test(document.getElementById("modDiag").textContent), null, { timeout: 8000 }).catch(() => errores.push(w + " con un servidor más nuevo no se hace el diagnóstico"));
      if (!/es anterior al servidor/.test(await p.textContent("#modDireccion")) || /Pega el Codigo\.gs/.test(await p.textContent("#modDiag"))) errores.push(w + " con un servidor más nuevo se da el consejo equivocado");
      if (!/Dirección comprobada: …\/s\/AKfycbxkOj/.test(await p.textContent("#modDiag"))) errores.push(w + " el diagnóstico no dice qué dirección comprobó");
      if (await p.$eval("#modDiag .aviso", e => e.classList.contains("ok"))) errores.push(w + " el servidor no puede saber si el marco cargó: no se celebra en verde");
      // la respuesta tardía de una pregunta anterior no pisa a la actual
      await p.evaluate(() => { var o = Object.assign({}, window.__seg); MOD_DATOS.seguimiento = o; window.__srv = srvSilencioso; var lento = true;
        srvSilencioso = function(fn){ if(fn !== "apiProbarSeguimiento") return window.__srv.apply(null, arguments); var viejo = lento; lento = false;
          return new Promise(function(res){ setTimeout(function(){ res({ ok: true, veredicto: viejo ? "login" : "publica", bloqueaMarco: false, resultados: [{ pagina: "visor", tipo: viejo ? "login" : "publica", http: viejo ? 302 : 200 }], direccion: "x" }); }, viejo ? 700 : 50); }); };
        abrirModulo("seguimiento", "visor"); sondearModulo("seguimiento"); });
      await p.waitForTimeout(1300);
      if (/no es público|Google pide iniciar sesión/.test(await p.textContent("#modDiag"))) errores.push(w + " una respuesta tardía de una pregunta anterior pisó el diagnóstico actual");
      await p.evaluate(() => { srvSilencioso = window.__srv; MOD_DATOS.seguimiento = window.__seg; });
      await p.click("#btnModVolver"); await p.waitForSelector("#v-hub:not([hidden])", { timeout: 5000 }).catch(() => errores.push(w + " «Módulos» no vuelve al inicio general"));
      await p.click('#hubCuerpo [data-hub-ir="inicio"]'); await p.waitForSelector("#v-inicio:not([hidden]) .hero", { timeout: 10000 }).catch(() => errores.push(w + " «Abrir PQRS» no abre el inicio de PQRS"));
      // configuración de la dirección: solo acepta direcciones /exec de Apps Script
      await p.evaluate(() => ver("config")); await p.waitForSelector("#segUrl", { timeout: 6000 }); await p.waitForFunction(() => document.getElementById("segUrl").value.length > 20, null, { timeout: 6000 });   // espera a que llegue la dirección guardada
      await p.fill("#segUrl", "https://ejemplo.com/exec"); await p.click("#btnSegGuardar");
      await p.waitForSelector("#segAviso .aviso.err", { timeout: 5000 }).catch(() => errores.push(w + " Módulos externos acepta una dirección que no es de Apps Script"));
      await p.click("#btnSegProbar"); await p.waitForFunction(() => /Google no pide iniciar sesión/.test(document.getElementById("segAviso").textContent), null, { timeout: 8000 }).catch(() => errores.push(w + " Configuración ▸ «Comprobar acceso» no responde"));
      await p.evaluate(() => ver("inicio")); await p.waitForSelector("#v-inicio:not([hidden]) .hero", { timeout: 10000 }); await p.waitForSelector("#meses .mes", { timeout: 15000 }); await p.waitForTimeout(500);
    }
    // v9.3 · Riverino: botón, búsqueda, «Llévame», recorrido de bienvenida y consejos de primera vez
    await p.waitForSelector("#riverino", { timeout: 6000 }).catch(() => errores.push(w + " no aparece el botón de Riverino"));
    await p.click("#riverino"); await p.waitForSelector("#rvPanel", { timeout: 4000 }).catch(() => errores.push(w + " Riverino no abre su panel"));
    await desb("riverino");
    await p.fill("#rvQ", "cómo radico una queja"); await p.press("#rvQ", "Enter");
    await p.waitForSelector("#rvRes .rv-res", { timeout: 4000 }).catch(() => errores.push(w + " Riverino no encontró «cómo radicar»"));
    if (!/Radicar/i.test(await p.textContent("#rvRes").catch(() => ""))) errores.push(w + " la respuesta de Riverino no habla de radicar");
    await p.waitForTimeout(500); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_riverino.png` });
    await p.click('#rvRes [data-rv-ir]'); await p.waitForTimeout(600);
    if (await p.$eval("#v-radicar", e => e.hidden)) errores.push(w + " «Llévame» no abrió el apartado");
    await p.click("#riverino"); await p.fill("#rvQ", "zzzxxyy"); await p.press("#rvQ", "Enter");
    if (!/No encontré/.test(await p.textContent("#rvRes").catch(() => ""))) errores.push(w + " Riverino no responde a lo que no entiende");
    for (const [q, tit] of [["cómo radico", /radicar/i], ["dónde descargo el excel", /Tablero/i], ["quiero cambiar mi clave", /contraseña/i], ["que es el semaforo", /semáforo/i]]) {
      await p.fill("#rvQ", q); await p.press("#rvQ", "Enter");
      if (!tit.test(await p.textContent("#rvRes h4").catch(() => ""))) errores.push(w + " Riverino no entiende «" + q + "»");
    }
    await p.click("#rvTour"); await p.waitForSelector("#rvTour2", { timeout: 4000 }).catch(() => errores.push(w + " el recorrido de bienvenida no abre"));
    let nPasos = 0; while (await p.$("#rvSig") && nPasos < 20) { const ult = /Terminar/.test(await p.textContent("#rvSig")); if (nPasos === 2 && w === 1366) await p.screenshot({ path: CAP + `z_${w}_recorrido.png` }); await p.click("#rvSig"); nPasos++; await p.waitForTimeout(150); if (ult) break; }
    if (nPasos < 6) errores.push(w + " el recorrido es muy corto: " + nPasos + " pasos");
    if (await p.$("#rvTour2")) errores.push(w + " el recorrido no se cerró al terminar");
    const gu = await p.evaluate(() => JSON.parse(localStorage.getItem("pqrs_guia_siau.admin") || "null"));
    if (!gu || !gu.tour || !gu.activa) errores.push(w + " no se guardó que el recorrido ya se vio");
    if (await p.evaluate(() => /(clave|password|token)/i.test(localStorage.getItem("pqrs_guia_siau.admin") || ""))) errores.push(w + " la guía guarda datos sensibles");
    await p.evaluate(() => ver("bandeja")); await p.waitForSelector(".rv-tip", { timeout: 4000 }).catch(() => errores.push(w + " no aparece el consejo de primera vez"));
    await p.click('.rv-tip [data-rv="ok"]'); await p.evaluate(() => ver("inicio")); await p.evaluate(() => ver("bandeja")); await p.waitForTimeout(300);
    if (await p.$(".rv-tip")) errores.push(w + " el consejo se repite después de «Entendido»");
    await p.evaluate(() => ver("inicio")); await p.waitForTimeout(300);

    // v8.7 · temas, fondo sin franja blanca, pantalla de inicio y aviso de carga
    for (const t of ["oscuro", "mono", "calido", "claro"]) {
      await p.click("#btnPerfil"); await p.click('#menuPerfil .temas button[data-tema="' + t + '"]'); await p.waitForTimeout(250);
      const r = await p.evaluate(() => ({ t: document.documentElement.dataset.tema, g: localStorage.getItem("pqrs_tema"), bg: getComputedStyle(document.body).backgroundColor, ground: getComputedStyle(document.documentElement).getPropertyValue("--ground").trim(),
        cabeza: document.querySelector("html").scrollHeight >= innerHeight }));
      if (r.t !== t || r.g !== t) errores.push(w + " el tema " + t + " no se aplicó o no se guardó: " + JSON.stringify(r));
      if (!(await p.evaluate(() => !document.getElementById("splash") || document.getElementById("splash").hidden))) errores.push(w + " la pantalla de inicio sigue cubriendo la aplicación");
      await p.keyboard.press("Escape"); await p.evaluate(() => { const m = document.getElementById("menuPerfil"); if (m) m.hidden = true; });
    }
    if (!(await p.evaluate(() => document.documentElement.dataset.so && document.documentElement.dataset.form))) errores.push(w + " el dispositivo no se detectó (data-so / data-form)");
    if (!(await p.evaluate(() => /::before/.test("") || getComputedStyle(document.documentElement, "::before").position === "fixed"))) errores.push(w + " el fondo no es fijo: puede quedar una franja blanca");
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
    if (!(await p.waitForSelector("#npsCard .nps", { timeout: 6000 }).catch(() => null))) errores.push(w + " el tablero no muestra la tarjeta de satisfacción (NPS)");
    if (await p.$eval("#bloqueExcel", e => e.hidden)) errores.push(w + " el administrador no ve «Exportar a Excel»");
    else {
      const [descarga] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.click("#btnExportarExcel")]);
      if (!descarga || !/^Consolidado_PQRS_.*\.xlsx$/.test(descarga.suggestedFilename())) errores.push(w + " no se descargó el Excel del tablero");
      await p.waitForFunction(() => /Consolidado listo/.test(document.getElementById("toasts").textContent), null, { timeout: 15000 }).catch(() => errores.push(w + " sin aviso de Excel listo"));
    }
    await irA("usuarios"); await p.waitForSelector("#usrLista .ufila:not(.cab)", { timeout: 8000 }); await p.waitForTimeout(300);
    if (!/github\.io\/DEFINIDO\/portal\//.test(await p.textContent("#enlaceActual").catch(() => ""))) errores.push(w + " el enlace de ingreso para los técnicos no es el del portal de GitHub");
    await p.waitForSelector("#audLista .aud-fila:not(.aud-cab)", { timeout: 8000 }).catch(() => errores.push(w + " la auditoría de accesos no muestra eventos"));
    if (!/Ingreso correcto/.test(await p.textContent("#audLista"))) errores.push(w + " la auditoría no registra el ingreso del administrador");
    if (await p.locator("#usrLista .usr").count()) errores.push(w + " los usuarios siguen en tarjetas: deben verse como lista");
    if (w >= 1366 && !(await p.locator("#usrLista .ufila.cab").isVisible())) errores.push(w + " la lista de usuarios no muestra su encabezado de columnas");
    await desb("usuarios"); await p.screenshot({ path: CAP + `z_${w}_usuarios.png`, fullPage: true });
    await p.click("#btnNuevoUsr"); await p.waitForSelector("#u_sedes", { timeout: 5000 });
    if (!(await p.$("#u_telefono"))) errores.push(w + " el formulario de usuario no pide el WhatsApp"); await p.waitForTimeout(300);
    await desb("modal usuario"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_usuario_nuevo.png` });
    await p.keyboard.press("Escape");
    // v8.6 · directorio de áreas: explicación visible y botón Guardar siempre a la vista, con contador de cambios
    await irA("responsables"); await p.waitForSelector("#respLista .resp-fila[data-i]", { timeout: 8000 }); await p.waitForTimeout(400);
    if (!(await p.locator(".dir-guia").isVisible())) errores.push(w + " el directorio no explica qué es");
    const guardar = await p.evaluate(() => { const r = document.getElementById("btnGuardarResp").getBoundingClientRect(); return { abajo: r.bottom, vp: innerHeight, vis: r.width > 0 }; });
    if (!guardar.vis || guardar.abajo > guardar.vp + 1) errores.push(w + " el botón Guardar del directorio no está a la vista sin desplazarse (" + Math.round(guardar.abajo) + " > " + guardar.vp + ")");
    await p.fill('#respLista .resp-fila[data-i] input[data-k="cargo"]', "Cargo de prueba");
    if (!/1 cambio sin guardar/.test(await p.textContent("#respEstado"))) errores.push(w + " el directorio no cuenta los cambios pendientes");
    await desb("responsables"); await p.screenshot({ path: CAP + `z_${w}_directorio.png` });
    await irA("config"); await p.waitForSelector("#tablaEntidades .cfg-fila[data-ent]", { timeout: 8000 }); await p.waitForTimeout(300);
    await p.waitForSelector("#qrImagen svg", { timeout: 8000 }).catch(() => errores.push(w + " sin código QR del formulario"));
    if (!(await p.$("#aj_pushTema")) || (await p.$("#aj_acuseInstitucional"))) errores.push(w + " configuración de push ausente o con el acuse automático a EPS todavía visible");
    else { await p.fill("#aj_pushTema", ""); await p.click("#btnGenerarPush"); if (!/^pqrs-miredips-[a-z2-9]{14}$/.test(await p.inputValue("#aj_pushTema"))) errores.push(w + " el generador del tema del push no funcionó"); }
    await p.click("#btnRespaldarAhora"); await p.waitForFunction(() => /Respaldo guardado en Drive/.test((document.getElementById("respAviso") || {}).textContent || ""), null, { timeout: 15000 })
      .catch(() => errores.push(w + " el respaldo ahora no respondió"));
    if (!(await p.$("#btnGuardarWa")) || (await p.getAttribute("#wa_token", "type")) !== "password") errores.push(w + " falta la configuración de WhatsApp (o el token no está oculto)");
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
    if (visibles.includes("usuarios") || visibles.includes("correo") || visibles.includes("hub")) errores.push(w + " técnico ve módulos de administración: " + visibles);
    if (await p.$eval("#v-hub", e => !e.hidden)) errores.push(w + " el técnico aterrizó en Módulos en lugar de PQRS");
    { const rr = await p.evaluate(() => srv("apiSeguimiento").then(r => JSON.stringify(r), e => "rechazado"));
      if (/script\.google\.com/.test(rr)) errores.push(w + " el técnico pudo pedir el enlace de Seguimiento SIAU por la API: " + rr); }
    await desb("inicio técnico"); if (w === 1366 || w === 390) await p.screenshot({ path: CAP + `z_${w}_inicio_tecnico.png`, fullPage: true });
    // v8.7.3 · el técnico descarga solo indicadores (sin datos de casos); el consolidado completo es del administrador
    await irA("tablero"); await p.waitForSelector("#gMesTipo", { timeout: 8000 });
    if (await p.isVisible("#btnExportarExcel") || !(await p.isVisible("#btnExportarIndicadores"))) errores.push(w + " el técnico debe ver solo el botón de indicadores en el tablero");
    const [desc] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }).catch(() => null), p.click("#btnExportarIndicadores")]);
    if (!desc || !/^Indicadores_PQRS_.*\.xlsx$/.test(desc.suggestedFilename())) errores.push(w + " el técnico no pudo descargar el Excel de indicadores");
    await irA("bandeja"); await p.click('#etapas button[data-e="todas"]'); await p.waitForSelector("#listaBandeja .fila", { timeout: 8000 });
    const sedes = await p.$$eval("#listaBandeja .fila .med b", els => els.map(e => e.textContent));
    if (sedes.some(t => !/Camino La Playa|Camino Luz Chinita/.test(t))) errores.push(w + " el técnico ve sedes ajenas");
    if (!visibles.includes("radicar")) errores.push(w + " el técnico no ve Radicar");
    if (await p.isVisible("#btnExportarExcel")) errores.push(w + " el técnico ve el botón del consolidado completo");
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
