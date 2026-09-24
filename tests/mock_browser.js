/* ====== VISTA PREVIA: backend real (Codigo_v5.gs) ejecutado en el navegador con datos de ejemplo ====== */
(function(){
var TZ = "America/Bogota";
function partes(date, tz){
  var f = new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  var o={}; f.formatToParts(date).forEach(function(p){ o[p.type]=p.value; }); return o;
}
var Utilities = {
  formatDate:function(d,tz,pat){ var p=partes(d,tz);
    return pat.replace(/yyyy|MM|dd|HH|mm|ss|M|d|H|m|s/g,function(t){ return ({yyyy:p.year,MM:p.month,dd:p.day,HH:p.hour,mm:p.minute,ss:p.second,
      M:String(+p.month),d:String(+p.day),H:String(+p.hour),m:String(+p.minute),s:String(+p.second)})[t]; }); },
  parseDate:function(s,tz){ var a=s.split("-").map(Number), g=Date.UTC(a[0],a[1]-1,a[2]);
    for(var i=0;i<3;i++){ var p=partes(new Date(g),tz); g+=Date.UTC(a[0],a[1]-1,a[2])-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second); }
    return new Date(g); },
  newBlob:function(b,t,n){ return { getBytes:function(){ return b||[]; }, getName:function(){ return n; } }; },
  base64Decode:function(x){ var s=atob(x||""), a=new Uint8Array(s.length); for(var i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a; },
  getUuid:function(){ return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){ var r=Math.random()*16|0; return (c==="x"?r:(r&3|8)).toString(16); }); },
  DigestAlgorithm:{SHA_256:"sha256"}, Charset:{UTF_8:"utf8"},
  computeDigest:function(alg, txt){ /* resumen de demostración (en Google se usa SHA-256 real) */
    var h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], t=String(txt), out=[];
    for(var i=0;i<t.length;i++){ var c=t.charCodeAt(i); for(var j=0;j<8;j++){ h[j]=Math.imul(h[j]^(c+j*131),16777619)>>>0; h[j]=(h[j]<<5|h[j]>>>27)>>>0; } }
    h.forEach(function(x){ out.push((x>>>24)&255,(x>>>16)&255,(x>>>8)&255,x&255); }); return out.map(function(b){ return b>127?b-256:b; }); },
  base64Encode:function(b){ var s=""; for(var i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
};
function Hoja(n){ this.nombre=n; this.d=[]; }
Hoja.prototype = {
  getName:function(){ return this.nombre; },
  getLastRow:function(){ var n=this.d.length; while(n>0 && (!this.d[n-1] || this.d[n-1].every(function(v){ return v===""||v===null||v===undefined; }))) n--; return n; },
  celda:function(r,c){ var f=this.d[r-1]; return f && f[c-1]!==undefined ? f[c-1] : ""; },
  poner:function(r,c,v){ while(this.d.length<r) this.d.push([]); var f=this.d[r-1]; while(f.length<c) f.push(""); f[c-1]=v; },
  getRange:function(r,c,nr,nc){ nr=nr||1; nc=nc||1; var h=this; return {
    getValues:function(){ var o=[]; for(var i=0;i<nr;i++){ var f=[]; for(var j=0;j<nc;j++) f.push(h.celda(r+i,c+j)); o.push(f); } return o; },
    getValue:function(){ return h.celda(r,c); },
    setValues:function(v){ v.forEach(function(f,i){ f.forEach(function(x,j){ h.poner(r+i,c+j,x); }); }); return this; },
    setValue:function(v){ h.poner(r,c,v); return this; },
    setFormulas:function(){ return this; }, getFormula:function(){ return "=IFERROR(VLOOKUP(Categorias_Correo),WORKDAY(Festivos!$A$2:$A$400),IF(OR($E"+r+"=\"\",1),\"\",1))"; },
    getDisplayValues:function(){ var o=[]; for(var i=0;i<nr;i++){ var f=[]; for(var j=0;j<nc;j++) f.push(String(h.celda(r+i,c+j))); o.push(f); } return o; }, setNumberFormat:function(){ return this; }, clearContent:function(){ return this; }, copyTo:function(){ return this; },
    setFontWeight:function(){ return this; }, setBackground:function(){ return this; }, setFontColor:function(){ return this; } }; },
  appendRow:function(v){ this.d.push(v.slice()); },
  getDataRange:function(){ var n=this.getLastRow(); return this.getRange(1,1,n,Math.max.apply(null,this.d.slice(0,n).map(function(f){ return f.length; }).concat([1]))); },
  getFormUrl:function(){ return this.formUrl||null; }, setColumnWidth:function(){}, setFrozenRows:function(){}, hideSheet:function(){},
  getMaxRows:function(){ return Math.max(this.maxRows||1000, this.d.length); }, insertRowsAfter:function(r,n){ this.maxRows=this.getMaxRows()+n; },
  getMaxColumns:function(){ return 60; }, insertColumnsAfter:function(){},
  getLastColumn:function(){ return Math.max.apply(null,[0].concat(this.d.map(function(f){ var n=f.length; while(n>0&&(f[n-1]===""||f[n-1]===null||f[n-1]===undefined)) n--; return n; }))); }
};

var medianoche = function(s){ return Utilities.parseDate(s, TZ, "yyyy-MM-dd"); };
var ymd = function(d){ return Utilities.formatDate(d, TZ, "yyyy-MM-dd"); };
var HOY = medianoche(ymd(new Date()));

/* ---------- libro de ejemplo ---------- */
var cons=new Hoja("Consolidado_PQRS"), traza=new Hoja("Trazabilidad"), resp=new Hoja("Responsables"), cfg=new Hoja("Config"), mapeo=new Hoja("Mapeo_Formulario");
var HEAD=["CÓDIGO DE RADICACIÓN","CANAL","FECHA DE LA PQRS","FECHA DE RECEPCIÓN","FECHA DE RADICACIÓN","MARCA TEMPORAL"];
for(var i=1;i<=53;i++) cons.poner(4,i,HEAD[i-1]||"COL"+i);
cons.poner(4,32,"TÉRMINO (días)"); cons.poner(4,36,"DÍAS TRANSCURRIDOS");
traza.poner(4,1,"FECHA Y HORA"); resp.poner(4,1,"ID");
[[1,"Urgencias","Ana Martínez","Coordinadora","urgencias@miredips.org","3001112233","SI"],
 [2,"Consulta externa","Carlos Pérez","Coordinador","consulta@miredips.org","","SI"],
 [3,"Calidad","Laura Gómez","Líder de calidad","calidad@miredips.org","","SI"],
 [4,"Facturación","","","","","SI"],
 [5,"Farmacia","Jorge Díaz","Regente","farmacia@miredips.org","","SI"],
 [6,"Laboratorio clínico","María Ruiz","Bacterióloga","laboratorio@miredips.org","","SI"],
 [7,"Talento humano","","","","","SI"],
 [8,"Asignación de citas","Paola Díaz","Coordinadora de agendamiento","citas@miredips.org","","SI"]].forEach(function(f,i){ f.forEach(function(v,j){ resp.poner(5+i,j+1,v); }); });
[["SEDE",15,"Hábiles"],["SUPER SALUD",1,"Calendario"],["SECRETARIA DE SALUD",3,"Calendario"]].forEach(function(f,i){ f.forEach(function(v,j){ cfg.poner(6+i,j+1,v); }); });
[3174,3,"SIAU","siau@miredips.org","(605) 385 0000","300 000 0000","","","FEL","","","https://forms.gle/PQRSMiRedIPS"].forEach(function(v,i){ cfg.poner(11+i,2,v); });
var SEDES=["Camino Bosque de María","Camino Ciudadela 20 de Julio","Camino La Playa","Camino Luz Chinita","Paso Soledad"];
var SERV=["Urgencias","Consulta externa","Farmacia","Laboratorio clínico","Imágenes diagnósticas","Hospitalización","Odontología"];
var TIPOS=["Queja","Petición","Reclamo","Sugerencia","Felicitación","Denuncia","Tutela"];
var PESOS=[34,24,18,9,9,3,3];
var LISTAS={"SEDE":SEDES,"SERVICIO":SERV,"EPS / PRESTADOR":["Nueva EPS","Sanitas","Salud Total","Coosalud"],
  "CANAL":["Presencial","Buzón de sugerencias","QR - Formulario","Correo electrónico","Telefónico","Redes sociales"],
  "TIPO DE PQRS":TIPOS,"TIPO SOLICITANTE":["Usuario","Familiar","Acompañante"],"TIPO DOCUMENTO":["CC","TI","CE","RC","PA"],
  "ENTIDAD PRESENTADA":["SEDE MIRED","SUPER SALUD","SECRETARIA DE SALUD"],"ESTADO":["Recibida","En análisis","En gestión","Respondida - Cerrada"],
  "SEXO":["Femenino","Masculino"],"RÉGIMEN":["Contributivo","Subsidiado"],"POBLACIÓN DIFERENCIAL":["Ninguna","Adulto mayor","Discapacidad"],
  "MODALIDAD DE ATENCIÓN":["Intramural","Domiciliaria","Telemedicina"],"TIPOLOGÍA":["Oportunidad en citas","Trato del personal","Entrega de medicamentos","Infraestructura"]};
Object.keys(LISTAS).forEach(function(k,j){ cfg.poner(43,j+1,k); LISTAS[k].forEach(function(v,i){ cfg.poner(44+i,j+1,v); }); });

var semilla=7; function azar(){ semilla=(semilla*9301+49297)%233280; return semilla/233280; }
function elegir(a,p){ if(!p) return a[Math.floor(azar()*a.length)]; var t=p.reduce(function(s,x){return s+x;},0), r=azar()*t;
  for(var i=0;i<a.length;i++){ r-=p[i]; if(r<=0) return a[i]; } return a[a.length-1]; }
var NOMBRES=["María Fernanda Ríos","José Luis Pertuz","Yolanda Barrios","Andrés Charris","Luz Marina Orozco","Carlos Andrés Mejía","Diana Castro","Rafael Ortega","Ana Lucía Pérez","Hernando Polo"];
var DESC={"Queja":"Llevo más de dos horas esperando para ser atendido en {s} y nadie da información.",
  "Petición":"Solicito copia de mi historia clínica y de los resultados de laboratorio de la última atención.",
  "Reclamo":"No me entregaron completo el medicamento formulado; me dijeron que volviera la próxima semana.",
  "Sugerencia":"Sería bueno habilitar más sillas en la sala de espera y un turno preferencial para adultos mayores.",
  "Felicitación":"Quiero felicitar al personal de {s} por la atención tan humana que recibió mi mamá.",
  "Denuncia":"Denuncio un cobro no autorizado por parte de un tercero a la entrada de la sede.",
  "Tutela":"Se notifica fallo de tutela que ordena la entrega del tratamiento en un plazo de 48 horas."};

function sumarHabiles(f,n){ var d=new Date(f.getTime()), k=0;
  while(k<n){ d=new Date(d.getTime()+86400000); var w=new Date(ymd(d)+"T12:00:00").getDay(); if(w!==0&&w!==6) k++; } return d; }
/* Emula las fórmulas del consolidado (término, vencimiento, semáforo, días, oportunidad). */
function recalcular(){
  var hoy = medianoche(ymd(new Date()));
  for(var r=5;r<=cons.d.length;r++){
    if(!cons.celda(r,1)) continue;
    var tipo=cons.celda(r,27), ent=(cons.celda(r,31)||"").toString().toUpperCase().trim(), E=cons.celda(r,5), AS=cons.celda(r,45);
    var feli=tipo.toString().toUpperCase().indexOf("FELICITA")===0;
    var term="", td="", cat=(cons.celda(r,28)||"").toString().toUpperCase().trim();
    var cats=hojas && hojas["Categorias_Correo"], catFila=null;
    if(cats && cat){ for(var q=2;q<=cats.d.length;q++) if(String(cats.celda(q,1)).toUpperCase().trim()===cat){ catFila=q; break; } }
    if(feli){ term="N/A"; td="N/A"; }
    else if(catFila && cats.celda(catFila,4)!==""){ term=Number(cats.celda(catFila,4)); td=cats.celda(catFila,5)||"Calendario"; }
    else if(ent){ var k= ent.indexOf("SUPER")===0?"SUPER SALUD":(ent.indexOf("SECRETAR")===0?"SECRETARIA DE SALUD":(ent.indexOf("SEDE")===0?"SEDE":ent));
      var t={"SEDE":[15,"Hábiles"],"SUPER SALUD":[1,"Calendario"],"SECRETARIA DE SALUD":[3,"Calendario"]}[k];
      if(t){ term=t[0]; td=t[1]; } else term="⚠"; }
    cons.poner(r,32,term); cons.poner(r,33,td);
    var fmax = (E instanceof Date && typeof term==="number") ? (td==="Hábiles"? sumarHabiles(E,term) : new Date(E.getTime()+term*86400000)) : "";
    cons.poner(r,34,fmax);
    var est=(cons.celda(r,37)||"").toString().toUpperCase(), sem;
    if(feli) sem="⭐ Felicitación"; else if(est==="RESPONDIDA - CERRADA") sem="✅ Cerrada"; else if(!ent) sem="⚠ Falta entidad";
    else if(!fmax) sem="⚠ Revisar término"; else if(hoy>fmax) sem="🔴 Vencida"; else if((fmax-hoy)/86400000<=3) sem="🟡 Próxima a vencer"; else sem="🟢 En término";
    cons.poner(r,35,sem);
    cons.poner(r,36, E instanceof Date ? Math.max(0,Math.round(((AS instanceof Date?AS:hoy)-E)/86400000)) : "");
    cons.poner(r,46, (AS instanceof Date && fmax) ? (AS<=fmax?"A tiempo":"Fuera de término") : "");
  }
}

var n=0, consecutivo=3174;
var anioHoy=+Utilities.formatDate(HOY,TZ,"yyyy"), mesHoy=+Utilities.formatDate(HOY,TZ,"M");
for(var y=anioHoy-1;y<=anioHoy;y++) for(var m=1;m<=12;m++){
  if(y===anioHoy && m>mesHoy) break;
  var cuantas = 6 + Math.round(azar()*10) + (m===3||m===8?6:0);
  for(var k=0;k<cuantas;k++){
    var dia = 1+Math.floor(azar()*27);
    if(y===anioHoy && m===mesHoy) dia = Math.min(dia, +Utilities.formatDate(HOY,TZ,"d"));
    var f = medianoche(y+"-"+("0"+m).slice(-2)+"-"+("0"+dia).slice(-2));
    var edadDias=(HOY-f)/86400000;
    var tipo=elegir(TIPOS,PESOS), sede=elegir(SEDES,[30,22,20,16,12]), serv=elegir(SERV,[26,24,14,12,9,8,7]);
    var canal=elegir(["QR - Formulario","Presencial","Correo electrónico","Buzón de sugerencias","Telefónico"],[40,25,20,10,5]);
    var r=5+n; n++; consecutivo++;
    var cerrada = edadDias>25 ? azar()<0.93 : (edadDias>8 ? azar()<0.55 : azar()<0.12);
    var conArea = cerrada || azar()<0.6, conRta = cerrada || (conArea && azar()<0.4);
    var cod="SIAU-"+y+"-"+("0"+m).slice(-2)+"-"+consecutivo;
    var vals={1:cod,2:canal,3:f,4:f,5:f,6:new Date(f.getTime()+9*3600000+k*600000),7:"Usuario",8:"CC",9:String(1000000+Math.floor(azar()*90000000)),
      10:elegir(NOMBRES),11:"300"+Math.floor(1000000+azar()*8999999),12:azar()<0.8?"usuario"+n+"@correo.com":"",
      20:elegir(LISTAS["EPS / PRESTADOR"]),22:sede,23:serv,27:tipo,30:DESC[tipo].replace("{s}",serv.toLowerCase()),
      31:tipo==="Felicitación"?"":(tipo==="Tutela"?"SECRETARIA DE SALUD":(azar()<0.06?"SUPER SALUD":"SEDE MIRED")),
      37:cerrada?"Respondida - Cerrada":(conArea?"En gestión":"Recibida"),41:0,53:canal==="QR - Formulario"?"Formulario QR":"siau@miredips.org"};
    if(conArea){ var a=elegir([1,2,5,6]); var rr=resp.getRange(4+a,1,1,7).getValues()[0]; vals[38]=rr[1]+" · "+rr[2]; vals[39]=rr[4]; vals[40]=new Date(f.getTime()+86400000); }
    if(conRta){ vals[42]="Se revisó el caso con el equipo y se tomaron las medidas correspondientes."; vals[43]=new Date(f.getTime()+(3+Math.floor(azar()*6))*86400000); }
    if(cerrada){ vals[44]="Reciba un cordial saludo. Revisamos su caso y…"; vals[45]=medianoche(ymd(new Date(f.getTime()+(4+Math.floor(azar()*16))*86400000))); vals[50]=vals[45]; }
    vals[47]=vals[12]?f:"";
    Object.keys(vals).forEach(function(c){ cons.poner(r,+c,vals[c]); });
    traza.appendRow([vals[6], cod, "Radicación", "Canal "+canal, vals[53]]);
    if(conArea) traza.appendRow([vals[40], cod, "Enviada al área", vals[38], "siau@miredips.org"]);
  }
}
for(var rr2=5+n; rr2<=404; rr2++) cons.poner(rr2,53,"");
recalcular();
var fecha=function(h){ return new Date(Date.now()-h*3600000); };
var ultCod=cons.celda(4+n,1), penCod=cons.celda(4+n-3,1);

/* ---------- correo de ejemplo: conversaciones con adjuntos ---------- */
function bytesDe(txt){ var u=unescape(encodeURIComponent(txt)), a=new Uint8Array(u.length); for(var i=0;i<u.length;i++) a[i]=u.charCodeAt(i); return a; }
var SVG_ORDEN='<svg xmlns="http://www.w3.org/2000/svg" width="620" height="800" viewBox="0 0 620 800"><rect width="620" height="800" fill="#fff"/><rect x="0" y="0" width="620" height="90" fill="#006081"/>'+
  '<text x="30" y="55" font-family="Arial" font-size="28" fill="#fff" font-weight="bold">ORDEN MÉDICA</text><text x="30" y="140" font-family="Arial" font-size="18" fill="#10222C">Paciente: Luisa Fernanda Gómez</text>'+
  '<text x="30" y="175" font-family="Arial" font-size="18" fill="#10222C">CC 1.045.678.901</text><text x="30" y="230" font-family="Arial" font-size="18" fill="#10222C">Servicio: Consulta de ortopedia y traumatología</text>'+
  '<text x="30" y="265" font-family="Arial" font-size="18" fill="#10222C">Diagnóstico: M17.1 Gonartrosis</text><line x1="30" y1="700" x2="260" y2="700" stroke="#10222C"/><text x="30" y="725" font-family="Arial" font-size="14" fill="#465C68">Firma del médico tratante</text></svg>';
var PDF_MIN="%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 400 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"+
  "4 0 obj<</Length 60>>stream\nBT /F1 18 Tf 40 120 Td (Autorizacion EPS No. 88213) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
function Att(nombre,tipo,contenido){ var b=bytesDe(contenido); return { getName:function(){return nombre;}, getContentType:function(){return tipo;}, getSize:function(){return b.length;},
  getBytes:function(){return b;}, copyBlob:function(){ return { getBytes:function(){return b;}, getName:function(){return nombre;} }; } }; }
var HMAP={}, sec=0, MARCA_TXT="Mensaje generado por el Sistema de PQRS de MiRed IPS.";
function M(id,de,asunto,cuerpo,h,adj){ var m={ hilo:null, getId:function(){return id;}, getFrom:function(){return de;}, getSubject:function(){return asunto;},
  getPlainBody:function(){return cuerpo;}, getDate:function(){ return typeof h==="number"?fecha(h):h; }, getAttachments:function(){ return adj||[]; },
  getThread:function(){ return m.hilo.t; },
  reply:function(body,op){ m.hilo.msgs.push(M("r"+(++sec),"SIAU MiRed <siau@miredips.org>","Re: "+asunto,body+"\n\n"+MARCA_TXT,new Date(), [])); console.log("[correo simulado] respuesta a "+de+(op&&op.cc?" cc "+op.cc:"")); },
  forward:function(dest,op){ m.hilo.msgs.push(M("f"+(++sec),"SIAU MiRed <siau@miredips.org>","Fwd: "+asunto,"Reenviado a "+dest+"\n\n"+MARCA_TXT,new Date(), [])); console.log("[correo simulado] reenvío a "+dest); } };
  return m; }
function Hilo(id,msgs){ var h={id:id,msgs:msgs,etq:[]}; h.t={ getId:function(){return id;}, getMessages:function(){return h.msgs;}, getLabels:function(){return h.etq;},
  getFirstMessageSubject:function(){ return h.msgs[0].getSubject(); }, addLabel:function(l){ h.etq.push({getName:function(){return l.getName();}}); } };
  msgs.forEach(function(x){ x.hilo=h; }); HMAP[id]=h; return h; }
Hilo("t1",[M("m1","Rosa Villalba <rosa.villalba@gmail.com>","Queja por demora en la entrega de medicamentos","Buenas tardes. Quiero presentar una queja: fui tres veces a la farmacia de la sede Camino La Playa y no me entregan la insulina. Solicito que me den una solución.",3,
  [Att("formula_medica.svg","image/svg+xml",SVG_ORDEN.replace("ORDEN MÉDICA","FÓRMULA MÉDICA"))])]);
Hilo("t2",[M("m2a","SIAU MiRed <siau@miredips.org>","[SOLICITUD INTERNA · PQRS "+penCod+"] Queja – Urgencias",MARCA_TXT,30),
  M("m2","Ana Martínez <urgencias@miredips.org>","RE: [SOLICITUD INTERNA · PQRS "+penCod+"] Queja – Urgencias","Buenas tardes.\n\nSe revisó el caso con el médico de turno: la demora se debió a una emergencia vital. Se reforzó el triage en el horario de la tarde y se llamó a la usuaria para ofrecer disculpas.\n\nAna Martínez\nCoordinadora de Urgencias\n\nEl lun, 21 sept 2026 a las 10:02, SIAU escribió:\n> La Oficina de Atención al Usuario le remite esta PQRS…",5)]);
Hilo("t3",[M("m3","SIAU MiRed <siau@miredips.org>","Radicación de su PQRS – "+ultCod,MARCA_TXT,6)]);
Hilo("t4",[M("m4","Mail Delivery Subsystem <mailer-daemon@googlemail.com>","Delivery Status Notification (Failure)","No se ha podido entregar el mensaje a usuarioo@correo.con: la dirección no existe.",8)]);
Hilo("t5",[M("m5","Héctor Molina <hmolina@hotmail.com>","Re: Radicación de su PQRS – "+ultCod,"Gracias por la información. Quisiera saber si puedo acercarme a la sede para ampliar la queja.\n\nOn Mon, SIAU wrote:\n> Confirmamos la radicación…",2)]);
Hilo("t6",[M("m6","Proveedor Papelería <ventas@papeleria.co>","Cotización de insumos de oficina","Adjuntamos la cotización solicitada.",26)]);
Hilo("t7",[M("m7","Luisa Fernanda Gómez <luisa.gomez@gmail.com>","Solicitud de cita con ortopedia","Buenos días. Quiero agendar una cita con ortopedia en la sede Camino La Playa. Mi cédula es 1.045.678.901, soy de Nueva EPS y mi celular es 300 123 4567. Adjunto la orden médica y la autorización.",4,
  [Att("orden_medica.svg","image/svg+xml",SVG_ORDEN), Att("autorizacion_eps.pdf","application/pdf",PDF_MIN)])]);
Hilo("t8",[M("m8","Carlos Arrieta <carrieta@gmail.com>","Reprogramar cita de control","Buenas, necesito reprogramar mi cita de control de medicina interna del jueves porque estaré de viaje.",9)]);
Hilo("e1",[M("e1m","Radicación PQRD Nueva EPS <pqrd@nuevaeps.com.co>","PQRD 2026-88412 RIESGO VITAL · usuaria sin entrega de insulina","Buen día. Se traslada PQRD clasificada como RIESGO VITAL: usuaria Carmen Ortiz, CC 32.654.118, diabética insulinodependiente, sin entrega de insulina glargina en la sede Camino La Playa desde hace 5 días. Solicitamos gestión inmediata y respuesta dentro de las 24 horas.",1.5,
  [Att("traslado_pqrd.pdf","application/pdf",PDF_MIN)])]);
Hilo("e2",[M("e2m","Gestión Mutual Ser <casos@affinitybpo.com.co>","Remisión de caso usuario Mutual Ser","Remitimos el caso de un afiliado que manifiesta inconvenientes con la autorización de un examen. Agradecemos su gestión.",2.2)]);
Hilo("e3",[M("e3m","Sanitas PQR <pqr@epssanitas.com>","Derecho de petición afiliado Luis Mercado","En ejercicio del derecho de petición, el afiliado solicita copia de su historia clínica y del resultado de la resonancia realizada en agosto.",5)]);
Hilo("e4",[M("e4m","Superintendencia Nacional de Salud <pqrd@supersalud.gov.co>","PQRD-26-0445512 Riesgo priorizado","Se traslada PQRD de riesgo priorizado por demora en asignación de consulta con ortopedia.",0.4)]);
Hilo("t9",[M("m10","Julio César Vega <jcvega@gmail.com>","Sugerencia para la sala de espera","Buen día, sugiero instalar un televisor con los turnos en la sede Camino Luz Chinita.",12)]);
var GmailApp={ getUserLabelByName:function(){ return null; }, createLabel:function(nm){ return {getName:function(){return nm;}}; }, getAliases:function(){ return []; },
  search:function(){ return Object.keys(HMAP).map(function(k){ return HMAP[k].t; }); },
  getThreadById:function(id){ return HMAP[id] ? HMAP[id].t : null; },
  getMessageById:function(id){ for(var k in HMAP){ var ms=HMAP[k].msgs; for(var j=0;j<ms.length;j++) if(ms[j].getId()===id) return ms[j]; } throw new Error("Correo no encontrado"); },
  sendEmail:function(para,asunto){ console.log("[correo simulado] a "+para+": "+asunto); } };
var DriveApp=(function(){ var carpetas={}; function mk(n){ return { getUrl:function(){ return "https://drive.google.com/drive/folders/demo"; },
  getFoldersByName:function(m){ var k=n+"/"+m; return { hasNext:function(){ return !!carpetas[k]; }, next:function(){ return carpetas[k]; } }; },
  createFolder:function(m){ return (carpetas[n+"/"+m]=mk(n+"/"+m)); },
  createFile:function(){ var f={ setName:function(){ return f; }, getUrl:function(){ return "https://drive.google.com/file/d/demo"; } }; return f; } }; }
  return mk(""); })();
var hojas={"Consolidado_PQRS":cons,"Trazabilidad":traza,"Responsables":resp,"Config":cfg,"Mapeo_Formulario":mapeo};
var respForm=new Hoja("Respuestas de formulario 1"); respForm.formUrl="https://docs.google.com/forms/d/x/edit"; respForm.poner(1,1,"Marca temporal"); hojas[respForm.getName()]=respForm;
var ss={ getSheetByName:function(nm){ return hojas[nm]||null; }, getSheets:function(){ return Object.keys(hojas).map(function(k){ return hojas[k]; }); },
  getSpreadsheetTimeZone:function(){ return TZ; }, insertSheet:function(nm){ return (hojas[nm]=new Hoja(nm)); } };
var props={};
var entorno={
  SpreadsheetApp:{ getActiveSpreadsheet:function(){ return ss; }, flush:function(){ recalcular(); }, getUi:function(){ throw new Error("sin UI"); } },
  Session:{ getScriptTimeZone:function(){ return TZ; }, getActiveUser:function(){ return {getEmail:function(){ return "siau@miredips.org"; }}; },
            getEffectiveUser:function(){ return {getEmail:function(){ return "siau@miredips.org"; }}; } },
  Utilities:Utilities, Logger:{ log:function(){} },
  PropertiesService:{ getScriptProperties:function(){ return { getProperty:function(k){ return props[k]||null; }, setProperty:function(k,v){ props[k]=String(v); } }; } },
  LockService:{ getScriptLock:function(){ return { tryLock:function(){ return true; }, waitLock:function(){}, releaseLock:function(){} }; } },
  ScriptApp:{ getProjectTriggers:function(){ return ["alEnviarFormulario","procesarCorreoEntrante","revisarAlertas","rutinaDiaria"].map(function(n){ return { getHandlerFunction:function(){ return n; } }; }); }, getService:function(){ return {getUrl:function(){return "https://script.google.com/macros/s/AKfycb…/exec";}}; } },
  CacheService:(function(){ var m={}; var c={ get:function(k){ return k in m ? m[k] : null; }, put:function(k,v){ m[k]=String(v); }, remove:function(k){ delete m[k]; } }; return { getScriptCache:function(){ return c; } }; })(),
  UrlFetchApp:{ fetch:function(u,op){ console.log("[Google Chat simulado] "+JSON.parse(op.payload).text); return {}; } },
  GmailApp:GmailApp, DriveApp:DriveApp, HtmlService:{}, FormApp:{}
};
var nombres=Object.keys(entorno);
var fuente=document.getElementById("codigo-backend").textContent.replace(/^const /gm,"var ");
var API=new Function(nombres.join(","), fuente + "\nreturn this;".replace("this","{"+__LISTA__+"}")).apply(null, nombres.map(function(k){ return entorno[k]; }));

props.AJUSTES = JSON.stringify({ desde:1, autoInstitucional:true, autoUsuarios:true, acuseInstitucional:true, citasAuto:false, avisosSede:true, chatModo:"todas",
  webhookChat:"https://chat.googleapis.com/v1/spaces/DEMO/messages", avisarA:"" });
(function(){
  var hu = API._hojaUsuarios_();
  [["siau.admin","Diana Rivera","siau@miredips.org","Administrador","TODAS","SI","SI"],
   ["tecnico.playa","Paola Mendoza","","Técnico","Camino La Playa; Camino Luz Chinita","NO","SI"],
   ["consulta","Andrea Gómez","","Consulta","TODAS","NO","NO"]].forEach(function(u){
    var sal = Utilities.getUuid();
    hu.appendRow([u[0],u[1],u[2],u[3],u[4],u[5],u[6],"SI",API._hash_("Demo2026",sal),sal,new Date(),"","NO"]);
  });
  try { API.procesarCorreoEntrante(); } catch(e){ console.error(e); }
  recalcular();
  /* v8: casos de demostración de la priorización, una felicitación y el directorio con reglas */
  try {
    API.appBootstrap_();
    var hoyTxt = Utilities.formatDate(HOY, TZ, "yyyy-MM-dd");
    API.apiRadicar_({ canal:"Presencial", fechaRecepcion:hoyTxt, fechaRadicacion:hoyTxt, tipoPqrs:"Queja", sede:"Camino La Playa", servicio:"Urgencias", edad:3,
      nombreSolicitante:"Marelys Fontalvo", correo:"marelys.f@correo.com", entidad:"SEDE MIRED",
      descripcion:"Mi hija de 3 años convulsionó en la sala de espera de urgencias y llevamos cinco horas sin que la valoren. No le dan la remisión a pediatría y cada vez está peor." });
    API.apiRadicar_({ canal:"Telefónico", fechaRecepcion:hoyTxt, fechaRadicacion:hoyTxt, tipoPqrs:"Reclamo", sede:"Camino Bosque de María", servicio:"Consulta externa",
      nombreSolicitante:"Yuranis Pacheco", correo:"yuranis.p@correo.com", entidad:"SEDE MIRED", poblacion:"Gestante",
      descripcion:"Estoy embarazada de 32 semanas y no me asignan la cita de control prenatal desde hace un mes. Me dicen que no hay agenda." });
    API.apiRadicar_({ canal:"QR - Formulario", fechaRecepcion:hoyTxt, fechaRadicacion:hoyTxt, tipoPqrs:"Felicitación", sede:"Camino Luz Chinita", servicio:"Laboratorio clínico",
      nombreSolicitante:"Ramiro Castro", correo:"ramiro.c@correo.com",
      descripcion:"Quiero felicitar a la bacterióloga del laboratorio por su paciencia y amabilidad con mi mamá, que es adulta mayor." });
    [[1,"URGENCIAS","","urgencias; triage; observacion"],[2,"CONSULTA EXTERNA","","consulta; control; cita medica; prenatal"],[5,"FARMACIA","","medicamento; farmacia; insulina"],
     [6,"LABORATORIO CLINICO","","laboratorio; examenes; bacteriologa"],[8,"ASIGNACIÓN DE CITAS; CALL CENTER","","cita; agenda; agendar"],[7,"","","grosero; maltrato; falta de respeto"]].forEach(function(x){
      resp.poner(4+x[0],8,x[1]); resp.poner(4+x[0],9,x[2]); resp.poner(4+x[0],10,x[3]); });
    recalcular();
  } catch(e){ console.error(e); }
})();
/* google.script.run simulado: llama al backend real con una pequeña demora (para ver los indicadores de carga). */
function corredor(ok, mal){
  var o={ withSuccessHandler:function(f){ return corredor(f, mal); }, withFailureHandler:function(f){ return corredor(ok, f); } };
  Object.keys(API).forEach(function(k){
    o[k]=function(){ var a=arguments; setTimeout(function(){
      try{ var r=API[k].apply(null,a); recalcular(); var copia=JSON.parse(JSON.stringify(r===undefined?null:r)); if(ok) ok(copia); }
      catch(e){ console.error(e); if(mal) mal(e); } }, k==="apiNovedades"?60:320+Math.random()*380); };
  });
  return o;
}
window.google={ script:{ run:corredor(null,null) } };

/* Demostración de avisos en segundo plano: a los 7 s entra una PQRS por el QR y un correo nuevo. */
window.__simularEntrada=function(){
  var r=cons.getLastRow()+1; while(cons.celda(r,1)) r++;
  var fila=5; while(cons.celda(fila,1)) fila++;
  var hoyTxt = Utilities.formatDate(HOY, TZ, "yyyy-MM-dd");
  try { API.apiRadicar_({ canal:"QR - Formulario", fechaRecepcion:hoyTxt, fechaRadicacion:hoyTxt, tipoPqrs:"Queja", sede:"Camino La Playa", servicio:"Urgencias",
    nombreSolicitante:"Paola Andrea Niebles", correo:"paola.niebles@gmail.com", entidad:"SEDE MIRED",
    descripcion:"Mi hijo de 6 años tiene dificultad para respirar y lleva cuatro horas esperando en urgencias sin valoración." });
    API.apiRadicar_({ canal:"QR - Formulario", fechaRecepcion:hoyTxt, fechaRadicacion:hoyTxt, tipoPqrs:"Felicitación", sede:"Camino La Playa", servicio:"Urgencias",
    nombreSolicitante:"Elvia Rúa", correo:"elvia.r@correo.com", descripcion:"Excelente atención de las enfermeras de urgencias, muy humanas y amables." });
  } catch(e){ console.error(e); }
  Hilo("t10",[M("m11","Wilson Ariza <wariza@gmail.com>","Reclamo: no me asignan cita con el especialista","Presento un reclamo porque llevo un mes solicitando la cita con ortopedia y no me la asignan.",0)]);
  recalcular();
};
})();
