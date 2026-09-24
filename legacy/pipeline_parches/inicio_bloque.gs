function apiResumenHoy() {
  var h = _h(CFG.HOJA_DATOS);
  var n = CFG.FILA_FIN - CFG.FILA_DATOS + 1;
  var datos = h.getRange(CFG.FILA_DATOS, 1, n, CFG.NCOL).getValues();
  var tz = _tz_();
  var hoy = _soloFecha_(new Date());
  var enOchoDias = new Date(hoy.getTime() + 8 * 86400000);
  var mesHoy = Utilities.formatDate(hoy, tz, "yyyy-MM");
  var mesAnt = Utilities.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15), tz, "yyyy-MM");

  var r = { sinDireccionar: 0, enGestion: 0, porResponder: 0, vencidas: 0, porVencer: 0, porCorregir: 0,
            cerradasMes: 0, radicadasMes: 0, radicadasMesAnterior: 0, radicadasHoy: 0, abiertas: 0,
            aTiempoMes: 0, cerradasConTerminoMes: 0,
            total: 0, correosPendientes: 0, correo: null, formPendientes: 0, urgentes: [], recientes: [] };

  datos.forEach(function (f) {
    if (!f[C.CODIGO - 1]) return;
    r.total++;
    var fr = f[C.FECHA_RADICACION - 1];
    if (fr instanceof Date && !isNaN(fr.getTime())) {
      var mk = Utilities.formatDate(fr, tz, "yyyy-MM");
      if (mk === mesHoy) r.radicadasMes++;
      else if (mk === mesAnt) r.radicadasMesAnterior++;
      if (Utilities.formatDate(fr, tz, "yyyy-MM-dd") === Utilities.formatDate(hoy, tz, "yyyy-MM-dd")) r.radicadasHoy++;
    }
    var est = _norm(f[C.ESTADO - 1]);
    var cerrada = est.indexOf("cerrada") !== -1;
    var conArea = !!f[C.CORREO_RESP - 1];
    var conRta = !!(f[C.RTA_AREA - 1] || "").toString().trim();
    var sem = (f[C.SEMAFORO - 1] || "").toString();
    var fMax = f[C.FECHA_MAX - 1];

    if (cerrada) {
      var fc = f[C.FECHA_RTA_USUARIO - 1];
      if (fc instanceof Date && Utilities.formatDate(fc, tz, "yyyy-MM") === mesHoy) {
        r.cerradasMes++;
        var op = (f[C.OPORTUNIDAD - 1] || "").toString();
        if (op) { r.cerradasConTerminoMes++; if (op === "A tiempo") r.aTiempoMes++; }
      }
      return;
    }
    r.abiertas++;
    if (!conArea && !_esFeli(f[C.TIPO_PQRS - 1])) r.sinDireccionar++;
    else if (conArea && !conRta) r.enGestion++;
    if (conRta) r.porResponder++;
    if (sem.indexOf("🔴") === 0) r.vencidas++;
    else if (sem.indexOf("🟡") === 0 || (fMax instanceof Date && fMax <= enOchoDias)) r.porVencer++;
    if (sem.indexOf("⚠") === 0) r.porCorregir++;

    if (sem.indexOf("🔴") === 0 || sem.indexOf("🟡") === 0) {
      r.urgentes.push({
        codigo: f[C.CODIGO - 1], semaforo: sem, tipo: f[C.TIPO_PQRS - 1],
        sede: f[C.SEDE - 1], servicio: f[C.SERVICIO - 1],
        responsable: f[C.RESPONSABLE - 1] || "Sin asignar",
        fechaMax: _fmt(fMax), orden: fMax instanceof Date ? fMax.getTime() : 9e15, dias: _dias_(f[C.DIAS - 1]),
      });
    }
  });

  r.urgentes.sort(function (a, b) { return a.orden - b.orden; });
  r.urgentes = r.urgentes.slice(0, 8);
  r.cumplimientoMes = r.cerradasConTerminoMes ? Math.round(r.aTiempoMes / r.cerradasConTerminoMes * 100) : null;

  // Últimas radicadas (cualquier canal), para la columna de actividad reciente.
  for (var i = datos.length - 1; i >= 0 && r.recientes.length < 6; i--) {
    var f = datos[i];
    if (!f[C.CODIGO - 1]) continue;
    r.recientes.push({ codigo: f[C.CODIGO - 1], tipo: f[C.TIPO_PQRS - 1], canal: f[C.CANAL - 1],
                       sede: f[C.SEDE - 1], fecha: _fmt(f[C.FECHA_RADICACION - 1]), semaforo: f[C.SEMAFORO - 1] });
  }

  try { var c = apiCorreos(true); r.correo = c.resumen; r.correosPendientes = c.resumen.relevantes; }
  catch (e) { r.correosPendientes = -1; }
  try { r.formPendientes = apiEstadoFormulario().pendientes || 0; } catch (e) { r.formPendientes = 0; }
  return r;
}
