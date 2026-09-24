
/** Fechas clave de un radicado para las notificaciones (hechos, recepción, radicación, vencimiento). */
function _fechasDe_(codigo) {
  if (!codigo) return {};
  try {
    var fila = _filaDe(codigo);
    if (fila < 0) return {};
    var f = _h(CFG.HOJA_DATOS).getRange(fila, 1, 1, CFG.NCOL).getValues()[0];
    return { hechos: _fmt(f[C.FECHA_PQRS - 1]), recepcion: _fmt(f[C.FECHA_RECEPCION - 1]), radicacion: _fmt(f[C.FECHA_RADICACION - 1]),
             max: _esFeli(f[C.TIPO_PQRS - 1]) ? "" : _fmt(f[C.FECHA_MAX - 1]) };
  } catch (e) { return {}; }
}
