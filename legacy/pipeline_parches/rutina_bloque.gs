function rutinaDiaria() {
  var d = apiDashboard();
  if (!d.vencidas && !d.porVencer && !d.porRevisar) return;
  var resp = apiResponsables();
  var destino = "";
  resp.forEach(function (r) {
    if (!destino && _norm(r.area).indexOf("calidad") !== -1 && _correoOk(r.correo)) destino = r.correo;
  });
  if (!destino) resp.forEach(function (r) { if (!destino && _correoOk(r.correo)) destino = r.correo; });
  if (!destino) { Logger.log("Sin correo de escalamiento en Responsables."); return; }

  var td = 'style="padding:8px 10px;border-bottom:1px solid #EEF2F4;font-family:' + FF + ';font-size:12px;color:#2B3A42;"';
  var filas = d.criticas.map(function (v) {
    var col = v.nivel === "alto" ? "#AB1130" : (v.nivel === "medio" ? "#8E5B00" : "#6B7F89");
    return '<tr><td style="padding:8px 10px;border-bottom:1px solid #EEF2F4;font-family:Consolas,monospace;font-weight:700;font-size:12px;color:#00475F;">' + v.codigo +
      '</td><td ' + td + '>' + (v.sede || "") + " / " + (v.servicio || "") +
      '</td><td ' + td + '>' + v.responsable +
      '</td><td ' + td + '><span style="color:' + col + ';">&#9679;</span> ' + v.semaforo +
      '</td><td ' + td + '>' + (v.fechaMax || "") + '</td><td ' + td + '>' + v.dias + '</td></tr>';
  }).join("");
  var th = 'align="left" style="padding:8px 10px;font-family:' + FF + ';font-weight:700;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#6B7F89;"';
  var kpi = function (n, t, c) {
    return '<td style="padding:12px 14px;background:#F6F9FA;border-radius:10px;"><div style="font-family:' + FT + ';font-weight:900;font-size:24px;color:' + c + ';">' + n +
      '</div><div style="font-family:' + FF + ';font-size:11px;color:#6B7F89;">' + t + '</div></td><td style="width:8px;"></td>';
  };

  var html = '<div style="background:#EDF2F4;padding:28px 12px;font-family:' + FF + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #DDE6EA;">' +
    '<tr><td style="padding:22px 28px 16px;"><img src="cid:logoNiRed" width="124" alt="MiRed IPS" style="display:block;border:0;"/></td></tr>' +
    '<tr><td style="height:4px;background:#006081;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:24px 28px;">' +
    '<div style="font-family:' + FT + ';font-weight:900;font-size:20px;color:#00475F;">Control diario de PQRS</div>' +
    '<div style="font-family:' + FF + ';font-size:12px;color:#6B7F89;margin:4px 0 18px;">Corte al ' + _fmt(new Date()) + '</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr>' +
      kpi(d.vencidas, "Vencidas", "#AB1130") + kpi(d.porVencer, "Por vencer", "#8E5B00") +
      kpi(d.porRevisar, "Datos por corregir", "#4C626D") + kpi(d.sinArea, "Sin área asignada", "#006081") +
    '</tr></table>' +
    '<table width="100%" style="border-collapse:collapse;"><tr style="background:#F6F9FA;">' +
    '<th ' + th + '>Radicado</th><th ' + th + '>Sede / Servicio</th><th ' + th + '>Responsable</th>' +
    '<th ' + th + '>Estado</th><th ' + th + '>Vence</th><th ' + th + '>Días</th></tr>' +
    filas + '</table>' +
    '<div style="border-top:1px solid #E6EDF0;margin-top:20px;padding-top:14px;font-family:' + FF + ';font-size:11px;color:#8398A3;">' + MARCA_SISTEMA + '.</div>' +
    '</td></tr></table></td></tr></table></div>';

  _enviar(destino, "Control PQRS – " + d.vencidas + " vencidas, " + d.porVencer + " por vencer (" + _fmt(new Date()) + ")",
    "Vencidas: " + d.vencidas + " · Por vencer: " + d.porVencer, html);
}
