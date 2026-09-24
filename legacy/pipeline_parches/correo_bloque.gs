// Tipografía de los correos: Volkswagen Serial si el equipo del lector la tiene instalada;
// si no, cae a Barlow / Segoe UI / Arial (los clientes de correo no descargan fuentes con licencia).
var FF = "'Volkswagen Serial','VW Serial',Barlow,'Segoe UI',Helvetica,Arial,sans-serif";
var FT = "'Volkswagen Serial Black','VW Serial Black','Volkswagen Serial','VW Serial','Barlow Semi Condensed','Arial Black',Arial,sans-serif";

function _progreso(estado) {
  var idx = _idxEtapa(estado), out = [];
  ETAPAS.forEach(function (et, i) {
    var on = i <= idx, col = on ? "#006081" : "#DCE5E9", tx = on ? "#00475F" : "#94A3AB";
    out.push('<td align="center" style="width:' + (i === 1 ? "38%" : "31%") + ';">' +
      '<div style="width:24px;height:24px;line-height:24px;border-radius:50%;background:' + col +
      ';color:#fff;font-family:' + FF + ';font-weight:700;font-size:11px;margin:0 auto;">' + (on && i < idx ? "&#10003;" : (i + 1)) + '</div>' +
      '<div style="font-family:' + FF + ';font-weight:' + (i === idx ? "700" : "400") + ';font-size:11px;color:' + tx +
      ';margin-top:6px;">' + et + '</div></td>');
    if (i < 2) out.push('<td style="padding:0 4px;"><div style="height:2px;background:' +
      (i < idx ? "#006081" : "#DCE5E9") + ';margin-top:12px;"></div></td>');
  });
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;"><tr>' + out.join("") + '</tr></table>';
}

function _plantilla(o) {
  var dato = function (k, v) {
    return (v || v === 0) ? '<tr><td style="padding:7px 14px 7px 16px;color:#6B7F89;font-family:' + FF + ';font-size:12px;white-space:nowrap;border-bottom:1px solid #EEF2F4;">' + k +
      '</td><td style="padding:7px 16px 7px 0;color:#13212A;font-family:' + FF + ';font-weight:600;font-size:12.5px;border-bottom:1px solid #EEF2F4;">' + v + '</td></tr>' : "";
  };
  var caja = function (t, c, borde) {
    return c ? '<div style="margin-top:18px;"><div style="font-family:' + FT + ';font-weight:900;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#00475F;margin-bottom:7px;">' + t +
      '</div><div style="font-family:' + FF + ';font-size:13.5px;line-height:1.65;color:#2B3A42;background:#F6F9FA;border-left:3px solid ' + borde +
      ';padding:12px 15px;border-radius:0 8px 8px 0;white-space:pre-wrap;">' + c + '</div></div>' : "";
  };
  var acento = o.interno ? "#B98A00" : "#006081";
  return '' +
  '<div style="background:#EDF2F4;padding:28px 12px;font-family:' + FF + ';">' +
   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #DDE6EA;box-shadow:0 8px 24px rgba(10,40,55,.08);">' +
     '<tr><td style="padding:22px 28px 16px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
       '<td><img src="cid:logoNiRed" width="124" alt="MiRed IPS" style="display:block;border:0;"/></td>' +
       '<td align="right" style="font-family:' + FF + ';font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#6B7F89;">' +
         (o.interno ? "Comunicación interna" : "Atención al usuario") + '</td></tr></table></td></tr>' +
     '<tr><td style="font-size:0;line-height:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
       '<td style="height:4px;background:' + acento + ';width:70%;"></td><td style="height:4px;background:#E20A31;width:10%;"></td>' +
       '<td style="height:4px;background:#FEDC00;width:10%;"></td><td style="height:4px;background:#009C4D;width:10%;"></td></tr></table></td></tr>' +
     (o.interno ? '<tr><td style="background:#FBF3DC;padding:9px 28px;font-family:' + FF + ';font-weight:700;font-size:11px;color:#8A6400;letter-spacing:.05em;">SOLICITUD INTERNA DE GESTIÓN · no reenviar al usuario</td></tr>' : '') +
     '<tr><td style="padding:26px 28px 8px 28px;">' +
      '<div style="font-family:' + FT + ';font-weight:900;font-size:21px;line-height:1.25;color:#00475F;margin-bottom:10px;">' + o.titulo + '</div>' +
      '<div style="font-family:' + FF + ';font-size:12px;color:#6B7F89;">Radicado&nbsp; <span style="display:inline-block;background:#E3EFF4;color:#00475F;font-family:Consolas,\'SF Mono\',monospace;font-weight:700;font-size:12.5px;padding:3px 9px;border-radius:6px;">' + o.codigo +
        '</span>' + (o.tipo ? ' &nbsp;·&nbsp; <b style="color:#2B3A42;">' + o.tipo + '</b>' : '') + '</div>' +
      (o.sinProgreso ? "" : _progreso(o.estado)) +
      '<div style="font-family:' + FF + ';font-size:14px;line-height:1.65;color:#2B3A42;margin:18px 0 16px;">' + o.mensaje + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F9FA;border-radius:10px;border:1px solid #E6EDF0;">' +
        dato("Estado", o.estado) + dato("Sede", o.sede) + dato("Servicio", o.servicio) +
        dato("Fecha de radicación", o.fechaRadicacion) + dato("Fecha límite de respuesta", o.fechaMax) +
        (o.interno ? dato("Días transcurridos", o.dias) + dato("Solicitante", o.solicitante) + dato("Documento", o.documento) +
                     dato("Contacto", o.contacto) + dato("Área responsable", o.responsable) : "") +
      '</table>' +
      caja("Descripción de la PQRS", o.descripcion, "#94A3AB") +
      caja("Indicaciones del SIAU", o.gestion, "#B98A00") +
      caja("Respuesta de la institución", o.respuesta, "#006081") +
     '</td></tr>' +
     '<tr><td style="padding:22px 28px 24px 28px;">' +
      '<div style="border-top:1px solid #E6EDF0;padding-top:16px;font-family:' + FF + ';font-size:11px;line-height:1.7;color:#8398A3;">' +
      (o.interno
        ? '<b style="color:#4C626D;">Cómo responder:</b> responda a este mismo correo con la gestión realizada; el SIAU redactará la respuesta al usuario.<br/>'
        : 'Oficina de Atención al Usuario (SIAU) · MiRed Barranquilla IPS S.A.S.<br/>' +
          (_param(3) || "siau@miredips.org") + (_param(4) ? ' &nbsp;·&nbsp; ' + _param(4) : '') + (_param(5) ? ' &nbsp;·&nbsp; WhatsApp ' + _param(5) : '') + '<br/>') +
      MARCA_SISTEMA + '.' +
      '</div>' +
     '</td></tr></table></td></tr></table></div>';
}
