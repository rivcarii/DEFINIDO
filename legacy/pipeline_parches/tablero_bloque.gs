function apiDashboard(filtros) {
  filtros = filtros || {};
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var tz = _tz_();
  var hoy = _soloFecha_(new Date());
  var anioActual = parseInt(Utilities.formatDate(hoy, tz, "yyyy"), 10);

  // Filtro por año y mes (mes 0 = todo el año). «anio» vacío = histórico completo.
  var anio = filtros.anio === "" || filtros.anio === undefined ? null : parseInt(filtros.anio, 10);
  var mes = parseInt(filtros.mes, 10) || 0;
  if (filtros.periodo) {            // compatibilidad con la versión anterior
    anio = anioActual;
    if (filtros.periodo === "mes") mes = parseInt(Utilities.formatDate(hoy, tz, "M"), 10);
  }
  var anioTendencia = anio || anioActual;

  var res = {
    anio: anio, mes: mes, anioTendencia: anioTendencia,
    total: 0, enTermino: 0, porVencer: 0, vencidas: 0, cerradas: 0, abiertas: 0,
    felicitaciones: 0, porRevisar: 0, sinArea: 0, aTiempo: 0, fueraTermino: 0,
    sumDias: 0, nDias: 0, sumRespArea: 0, nRespArea: 0,
    porEstado: {}, porTipo: {}, porCanal: {}, porSede: {}, porServicio: {},
    porMes: {}, porMesCerradas: {}, porMesTipo: {}, porResponsable: {}, porSemaforo: {},
    criticas: [], sedes: [], servicios: [], anios: [],
  };
  var mas = function (o, k) { if (!k) return; o[k] = (o[k] || 0) + 1; };
  var sedesSet = {}, serviciosSet = {}, aniosSet = {};
  aniosSet[anioActual] = true;

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1]) return;
    var sede = f[C.SEDE - 1], servicio = f[C.SERVICIO - 1];
    if (sede) sedesSet[sede] = true;
    if (servicio) serviciosSet[servicio] = true;

    var fr = f[C.FECHA_RADICACION - 1];
    var valida = fr instanceof Date && !isNaN(fr.getTime());
    var y = valida ? parseInt(Utilities.formatDate(fr, tz, "yyyy"), 10) : null;
    var m = valida ? parseInt(Utilities.formatDate(fr, tz, "M"), 10) : null;
    if (y) aniosSet[y] = true;
    if (filtros.sede && sede !== filtros.sede) return;
    if (filtros.servicio && servicio !== filtros.servicio) return;

    var estado = f[C.ESTADO - 1] || "Recibida";
    var cerrada = _norm(estado).indexOf("cerrada") !== -1;

    // Tendencia: los 12 meses del año elegido, sin importar el mes seleccionado.
    if (valida && y === anioTendencia) {
      var k = y + "-" + ("0" + m).slice(-2);
      mas(res.porMes, k);
      if (cerrada) mas(res.porMesCerradas, k);
      var pm = res.porMesTipo[k] || (res.porMesTipo[k] = {});
      mas(pm, f[C.TIPO_PQRS - 1] || "Sin clasificar");
    }

    if (anio && (!valida || y !== anio)) return;
    if (mes && (!valida || m !== mes)) return;

    res.total++;
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    var etiquetaSem = _limpiarSimbolo_(sem) || "Sin dato";
    mas(res.porSemaforo, etiquetaSem);
    if (sem.indexOf("🟢") === 0) res.enTermino++;
    else if (sem.indexOf("🟡") === 0) res.porVencer++;
    else if (sem.indexOf("🔴") === 0) res.vencidas++;
    else if (sem.indexOf("✅") === 0) res.cerradas++;
    else if (sem.indexOf("⭐") === 0) res.felicitaciones++;
    else if (sem.indexOf("⚠") === 0) res.porRevisar++;

    if (!cerrada) res.abiertas++;
    mas(res.porEstado, estado);
    mas(res.porTipo, f[C.TIPO_PQRS - 1] || "Sin clasificar");
    mas(res.porCanal, f[C.CANAL - 1]);
    mas(res.porSede, sede);
    mas(res.porServicio, servicio);
    if (f[C.RESPONSABLE - 1]) mas(res.porResponsable, f[C.RESPONSABLE - 1].toString().split(" · ")[0]);
    if (!f[C.CORREO_RESP - 1] && !cerrada && !_esFeli(f[C.TIPO_PQRS - 1])) res.sinArea++;

    var op = (f[C.OPORTUNIDAD - 1] || "").toString();
    if (op === "A tiempo") res.aTiempo++;
    else if (op === "Fuera de término") res.fueraTermino++;
    if (op && typeof f[C.DIAS - 1] === "number") { res.sumDias += Math.round(f[C.DIAS - 1]); res.nDias++; }

    var fEnvio = f[C.FECHA_ENVIO_AREA - 1], fRta = f[C.FECHA_RTA_AREA - 1];
    if (fEnvio instanceof Date && fRta instanceof Date) {
      res.sumRespArea += Math.max(0, Math.round((fRta - fEnvio) / 86400000));
      res.nRespArea++;
    }

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0 || sem.indexOf("⚠") === 0) {
      res.criticas.push({
        codigo: f[C.CODIGO - 1], semaforo: etiquetaSem,
        nivel: sem.indexOf("🔴") === 0 ? "alto" : (sem.indexOf("🟡") === 0 ? "medio" : "dato"),
        tipo: f[C.TIPO_PQRS - 1], sede: sede, servicio: servicio,
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(f[C.FECHA_MAX - 1]), orden: f[C.FECHA_MAX - 1] instanceof Date ? f[C.FECHA_MAX - 1].getTime() : 9e15,
        dias: _dias_(f[C.DIAS - 1]),
      });
    }
  });

  res.promedioDias = res.nDias ? Math.round(res.sumDias / res.nDias * 10) / 10 : 0;
  res.promedioArea = res.nRespArea ? Math.round(res.sumRespArea / res.nRespArea * 10) / 10 : 0;
  res.cumplimiento = (res.aTiempo + res.fueraTermino)
    ? Math.round(res.aTiempo / (res.aTiempo + res.fueraTermino) * 100) : null;
  res.tasaCierre = res.total ? Math.round((res.total - res.abiertas) / res.total * 100) : 0;
  res.criticas.sort(function (a, b) { return a.orden - b.orden; });
  res.criticas = res.criticas.slice(0, 30);
  res.sedes = Object.keys(sedesSet).sort();
  res.servicios = Object.keys(serviciosSet).sort();
  res.anios = Object.keys(aniosSet).map(Number).sort(function (a, b) { return b - a; });
  return res;
}
