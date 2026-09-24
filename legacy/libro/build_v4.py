# -*- coding: utf-8 -*-
"""Base de datos del sistema PQRS v4 — la gestión ocurre en la plataforma web."""
import openpyxl, os
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter
from datetime import date

TEAL, TEAL_DARK, TEAL_LIGHT = "006081", "004A63", "DCEEF2"
RED_LIGHT, GREEN_LIGHT, YELLOW_LIGHT = "FBD9DE", "D9EAD9", "FFF3CD"
GREY, WHITE, LILA = "F2F2F2", "FFFFFF", "EDE3F7"

f_title = Font(name="Calibri", size=15, bold=True, color=WHITE)
f_sub   = Font(name="Calibri", size=10, italic=True, color=TEAL)
f_head  = Font(name="Calibri", size=9.5, bold=True, color=WHITE)
f_norm  = Font(name="Calibri", size=10)
f_bold  = Font(name="Calibri", size=10, bold=True)
f_note  = Font(name="Calibri", size=9, italic=True, color="666666")
f_warn  = Font(name="Calibri", size=10, bold=True, color="9C6500")

fill_title = PatternFill("solid", fgColor=TEAL)
fill_grp   = {"ident":"0B7A9E","solic":"1A6E8E","afil":"2E7D9B","hecho":"37718A","term":"4A6B7C","gest":"6A4C93","notif":"7E8C93"}
fill_grey, fill_warn = PatternFill("solid", fgColor=GREY), PatternFill("solid", fgColor=YELLOW_LIGHT)
thin = Side(style="thin", color="BFBFBF"); border = Border(left=thin,right=thin,top=thin,bottom=thin)

def titulo(ws, ncol, txt, sub=None):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncol)
    c = ws.cell(row=1, column=1, value=txt); c.font, c.fill = f_title, fill_title
    c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[1].height = 30
    if sub:
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncol)
        c2 = ws.cell(row=2, column=1, value=sub); c2.font = f_sub
        c2.alignment = Alignment(horizontal="left", vertical="center", indent=1)

wb = openpyxl.Workbook(); wb.remove(wb.active)

# ============================ CONFIG ============================
ws = wb.create_sheet("Config")
ws.sheet_view.showGridLines = False
for col, w in zip("ABCDEFGHIJKLMN", [30,10,14,46,3,13,30,3,26,22,16,20,20,22]):
    ws.column_dimensions[col].width = w
titulo(ws, 14, "⚙ CONFIGURACIÓN DEL SISTEMA PQRS", "La plataforma lee estos rangos por posición: no muevas filas ni columnas.")

def barra(row, c1, c2, txt):
    ws.merge_cells(start_row=row, start_column=c1, end_row=row, end_column=c2)
    c = ws.cell(row=row, column=c1, value=txt)
    c.font = Font(name="Calibri", size=10.5, bold=True, color=WHITE)
    c.fill = fill_title; c.alignment = Alignment(horizontal="left", indent=1)

def cab(row, cols, textos):
    for c, t in zip(cols, textos):
        cc = ws.cell(row=row, column=c, value=t)
        cc.font, cc.fill, cc.border = f_head, PatternFill("solid", fgColor="0B7A9E"), border
        cc.alignment = Alignment(horizontal="center", wrap_text=True)

barra(4, 1, 4, "TÉRMINOS LEGALES DE RESPUESTA")
cab(5, [1,2,3,4], ["ENTIDAD","DÍAS","TIPO DE DÍA","NORMA"])
for i,(e,d,t,n) in enumerate([
    ("SEDE",15,"Hábiles","Ley 1755 de 2015 – Derecho de petición"),
    ("SUPER SALUD",1,"Calendario","Circular SuperSalud – Prioritario/Vital (24 h)"),
    ("SECRETARIA DE SALUD",3,"Calendario","Ley 1438 de 2011 – Ente territorial (72 h)")]):
    for j,v in enumerate((e,d,t,n)):
        cc = ws.cell(row=6+i, column=1+j, value=v); cc.border, cc.font = border, f_norm
TERMINOS = "Config!$A$6:$D$8"

barra(10, 1, 2, "PARÁMETROS")
params = [("Base de consecutivo histórico", 3174),
          ("Umbral alerta amarilla (días)", 3),
          ("Prefijo del radicado", "SIAU"),
          ("Correo de la oficina SIAU", "siau@miredips.org"),
          ("Teléfono SIAU", "(605) 322 5919"),
          ("WhatsApp SIAU", "315 405 6834"),
          ("ID del Google Form vinculado", "1R39zYWREJd67vyMcd2l0yTpLtaSPzNCpVHPM3ElAYJ0"),
          ("Nombre de la hoja de respuestas del Form", "")]
for i,(k,v) in enumerate(params):
    a = ws.cell(row=11+i, column=1, value=k); a.font, a.border = f_bold, border
    b = ws.cell(row=11+i, column=2, value=v); b.border = border
    b.alignment = Alignment(horizontal="center")
CELL_BASE, CELL_UMBRAL = "Config!$B$11", "Config!$B$12"

# Festivos
ws.cell(row=4, column=6, value="FESTIVOS").font = Font(name="Calibri", size=10.5, bold=True, color=WHITE)
ws.merge_cells("F4:G4"); ws.cell(row=4, column=6).fill = fill_title
ws.cell(row=4, column=6).alignment = Alignment(horizontal="left", indent=1)
cab(5, [6,7], ["FECHA","DESCRIPCIÓN"])
FEST = [(date(2025,1,1),"Año Nuevo"),(date(2025,1,6),"Reyes"),(date(2025,3,24),"San José"),
(date(2025,4,17),"Jueves Santo"),(date(2025,4,18),"Viernes Santo"),(date(2025,5,1),"Trabajo"),
(date(2025,6,2),"Ascensión"),(date(2025,6,23),"Corpus Christi"),(date(2025,6,30),"Sagrado Corazón"),
(date(2025,7,20),"Independencia"),(date(2025,8,7),"Boyacá"),(date(2025,8,18),"Asunción"),
(date(2025,10,13),"Raza"),(date(2025,11,3),"Todos los Santos"),(date(2025,11,17),"Indep. Cartagena"),
(date(2025,12,8),"Inmaculada"),(date(2025,12,25),"Navidad"),
(date(2026,1,1),"Año Nuevo"),(date(2026,1,12),"Reyes"),(date(2026,3,23),"San José"),
(date(2026,4,2),"Jueves Santo"),(date(2026,4,3),"Viernes Santo"),(date(2026,5,1),"Trabajo"),
(date(2026,6,8),"Corpus Christi"),(date(2026,6,15),"Sagrado Corazón"),(date(2026,6,29),"San Pedro"),
(date(2026,7,20),"Independencia"),(date(2026,8,7),"Boyacá"),(date(2026,8,17),"Asunción"),
(date(2026,10,12),"Raza"),(date(2026,11,2),"Todos los Santos"),(date(2026,11,16),"Indep. Cartagena"),
(date(2026,12,8),"Inmaculada"),(date(2026,12,25),"Navidad")]
F0 = 6
for i,(d,n) in enumerate(FEST):
    c = ws.cell(row=F0+i, column=6, value=d); c.number_format, c.border = "DD/MM/YYYY", border
    ws.cell(row=F0+i, column=7, value=n).border = border
F1 = F0 + len(FEST) - 1
FESTIVOS = f"Config!$F${F0}:$F${F1}"

# Listas
L0 = F1 + 4
barra(L0-1, 1, 12, "LISTAS DESPLEGABLES (la plataforma las carga desde aquí)")
LISTAS = {
 "SEDE": ["Camino Bosque de María","Camino Ciudadela 20 de Julio","Camino La Playa","Camino Luz Chinita",
  "Camino Manga","Camino Metropolitano","Camino Murillo","Camino Nazareth","Camino Nuevo Barranquilla",
  "Camino Simón Bolívar","Camino Sur Occidente","Camino Universitario Distrital Adelita De Char",
  "Centro de Recuperación Nutricional Rosour","Hospital General de Barranquilla","Paso Barlovento",
  "Paso Buena Esperanza","Paso Carlos Meisel II","Paso Carrizal","Paso El Ferry 1º de Mayo",
  "Paso Esmeralda-Lipaya","Paso Galán","Paso Juan Mina","Paso Julio Montes","Paso La 21","Paso La Pradera",
  "Paso La Sierrita","Paso La Villa","Paso Las Flores","Paso Las Malvinas","Paso Las Nieves","Paso Las Palmas",
  "Paso Nueva Era","Paso Nueva Vida","Paso Rebolo","Paso San Camilo","Paso San José","Paso San Salvador",
  "Paso Santo Domingo","Paso Universal","Paso Villas De San Pablo"],
 "SERVICIO": ["ALIMENTACIÓN","CIRUGÍA","CONSULTA EXTERNA","CUIDADO INTENSIVO ADULTOS","CUIDADO INTENSIVO NEONATAL",
  "CUIDADO INTENSIVO PEDIÁTRICO","CUIDADO INTERMEDIO ADULTOS","CUIDADO INTERMEDIO NEONATAL",
  "CUIDADO INTERMEDIO PEDIÁTRICO","DOCENCIA","FARMACIA","HOSPITALIZACIÓN ADULTOS","HOSPITALIZACIÓN GINECOLÓGICA",
  "HOSPITALIZACIÓN PEDIATRÍA","LABORATORIO","ODONTOLOGÍA","RADIOLOGÍA E IMÁGENES DIAGNÓSTICAS","TELEMEDICINA",
  "UNIDAD TRANSFUSIONAL","URGENCIAS","VACUNACIÓN","FACTURACIÓN Y ADMISIONES","AUTORIZACIONES"],
 "EPS / PRESTADOR": ["Cajacopi","Coosalud","Mutual Ser","Nueva EPS","Proteger EPS","Salud Total","Sanitas",
  "Secretaría de Salud","Soat","Sura","Particular","Otros"],
 "CANAL": ["Presencial","Buzón de sugerencias","QR - Formulario","Correo electrónico","Telefónico","Redes sociales"],
 "TIPO DE PQRS": ["Petición","Queja","Reclamo","Sugerencia","Felicitación","Denuncia","Tutela"],
 "TIPO SOLICITANTE": ["Usuario","Paciente","Acudiente","Familiar","Colaborador","Otro"],
 "TIPO DOCUMENTO": ["Cédula de ciudadanía","Tarjeta de Identidad","Cédula de Extranjería","Registro Civil","Pasaporte","Permiso por Protección Temporal","Otro"],
 "ENTIDAD PRESENTADA": ["SEDE","SUPER SALUD","SECRETARIA DE SALUD"],
 "ESTADO": ["Recibida","En análisis","En gestión","Respondida - Cerrada"],
 "SEXO": ["Femenino","Masculino","Otro"],
 "RÉGIMEN": ["Subsidiado","Contributivo","Particular","Especial","Otro"],
 "POBLACIÓN DIFERENCIAL": ["No aplica","Gestante","Discapacidad","Víctima del conflicto","Indígena","Afrodescendiente","Adulto mayor","Menor de edad","Migrante","Otro"],
 "MODALIDAD DE ATENCIÓN": ["Presencial","Telemedicina","Domiciliaria","Extramural"],
 "TIPOLOGÍA": ["T1 Oportunidad en citas","T2 Entrega de medicamentos","T3 Programación de cirugías",
  "T4 Trato del personal","T5 Autorizaciones y trámites","T6 Infraestructura y aseo","T7 Facturación","T8 Otra"],
}
cols = list(LISTAS.keys())
for i, k in enumerate(cols):
    c = ws.cell(row=L0, column=1+i, value=k)
    c.font, c.fill, c.border = f_head, PatternFill("solid", fgColor="0B7A9E"), border
    c.alignment = Alignment(horizontal="center", wrap_text=True)
    for j, v in enumerate(LISTAS[k]):
        ws.cell(row=L0+1+j, column=1+i, value=v).font = f_norm
LD = L0 + 1
def rng(nombre):
    i = cols.index(nombre) + 1
    L = get_column_letter(i)
    return f"Config!${L}${LD}:${L}${LD+len(LISTAS[nombre])-1}"
ws.freeze_panes = "A4"
print("Config OK · festivos %d-%d · listas fila %d" % (F0, F1, LD))

# ============================ RESPONSABLES ============================
ws = wb.create_sheet("Responsables")
ws.sheet_view.showGridLines = False
for col, w in zip("ABCDEFG", [8,34,28,26,34,18,10]):
    ws.column_dimensions[col].width = w
titulo(ws, 7, "📇 RESPONSABLES DE GESTIÓN", "Se administra desde la plataforma (módulo Responsables). El correo es al que llega la notificación.")
HEAD_RESP = 4
for i, h in enumerate(["ID","ÁREA / SERVICIO","NOMBRE","CARGO","CORREO","TELÉFONO","ACTIVO"]):
    c = ws.cell(row=HEAD_RESP, column=1+i, value=h)
    c.font, c.fill, c.border = f_head, PatternFill("solid", fgColor="0B7A9E"), border
    c.alignment = Alignment(horizontal="center")
base_resp = [("SIAU – Oficina de Atención al Usuario","(nombre)","Líder de Atención al Usuario","siau@miredips.org","(605) 322 5919"),
             ("CALIDAD – Subgerencia","(nombre)","Subgerente de Calidad","",""),
             ("CALIDAD – Profesional","(nombre)","Profesional de Calidad","",""),
             ("CALIDAD – Profesional","(nombre)","Profesional de Calidad","",""),
             ("GERENCIA","(nombre)","Gerente","","")]
r = HEAD_RESP + 1
for i,(area,nom,cargo,correo,tel) in enumerate(base_resp, start=1):
    for j, v in enumerate((i, area, nom, cargo, correo, tel, "SI")):
        c = ws.cell(row=r, column=1+j, value=v); c.border, c.font = border, f_norm
        if j == 4 and not v:
            c.fill, c.value = fill_warn, ""
    r += 1
for k, serv in enumerate(LISTAS["SERVICIO"], start=len(base_resp)+1):
    for j, v in enumerate((k, serv, "", "Coordinador/a", "", "", "SI")):
        c = ws.cell(row=r, column=1+j, value=v); c.border, c.font = border, f_norm
        if j in (2, 4) and not v: c.fill = fill_warn
    r += 1
RESP_FIN = r - 1
ws.freeze_panes = "A5"
print("Responsables OK (filas 5-%d)" % RESP_FIN)

# ============================ CONSOLIDADO ============================
ws = wb.create_sheet("Consolidado_PQRS")
ws.sheet_view.showGridLines = False
GRUPOS = [
 ("IDENTIFICACIÓN Y FECHAS","ident",["CÓDIGO DE RADICACIÓN","CANAL DE RECEPCIÓN","FECHA DE LA PQRS",
    "FECHA DE RECEPCIÓN","FECHA DE RADICACIÓN","MARCA TEMPORAL"]),
 ("SOLICITANTE","solic",["TIPO SOLICITANTE","TIPO DOC SOLICITANTE","N° DOC SOLICITANTE","NOMBRE SOLICITANTE",
    "TELÉFONO","CORREO ELECTRÓNICO","DIRECCIÓN"]),
 ("AFILIADO / PACIENTE","afil",["TIPO DOC AFILIADO","N° DOC AFILIADO","NOMBRE AFILIADO","EDAD","SEXO",
    "POBLACIÓN DIFERENCIAL","EPS / PRESTADOR","RÉGIMEN"]),
 ("HECHO","hecho",["SEDE","SERVICIO DONDE OCURRE","SERVICIO ESPECÍFICO","MODALIDAD DE ATENCIÓN","DEPARTAMENTO",
    "TIPO DE PQRS","CLASIFICACIÓN INTERNA","TIPOLOGÍA","DESCRIPCIÓN"]),
 ("TÉRMINOS","term",["ENTIDAD PRESENTADA","TÉRMINO (días)","TIPO DE DÍA","FECHA MÁXIMA DE RESPUESTA",
    "SEMÁFORO","DÍAS TRANSCURRIDOS"]),
 ("GESTIÓN","gest",["ESTADO","RESPONSABLE ASIGNADO","CORREO RESPONSABLE","FECHA ENVÍO AL ÁREA",
    "REDIRECCIONAMIENTOS","RESPUESTA DEL RESPONSABLE","FECHA RESPUESTA DEL RESPONSABLE",
    "RESPUESTA ENVIADA AL USUARIO","FECHA DE RESPUESTA AL USUARIO","ESTADO DE OPORTUNIDAD"]),
 ("NOTIFICACIONES Y CONTROL","notif",["FECHA NOTIF. RECEPCIÓN","FECHA NOTIF. AL ÁREA","FECHA NOTIF. EN GESTIÓN",
    "FECHA NOTIF. CIERRE","OBSERVACIONES","ID CORREO","REGISTRADO POR"]),
]
HEADERS, GRUPO_DE = [], []
for nombre, clave, cols_g in GRUPOS:
    HEADERS += cols_g; GRUPO_DE += [(nombre, clave)] * len(cols_g)
N = len(HEADERS)
assert N == 53, N

anchos = [19,17,14,15,15,16, 15,17,16,26,14,26,26, 16,16,26,7,11,18,18,13,
          22,22,20,18,14, 13,20,24,42, 17,9,11,17,18,12,
          17,26,26,16,15,44,17,44,17,16, 15,15,15,15,26,16,20]
for i, w in enumerate(anchos, 1):
    ws.column_dimensions[get_column_letter(i)].width = w

titulo(ws, N, "🗂 CONSOLIDADO DE PQRS — base de datos del sistema",
  "La gestión se hace en la plataforma web. Esta hoja es el respaldo: evita editarla a mano.")

# fila 3 = banda de grupos · fila 4 = encabezados
i = 1
while i <= N:
    nombre, clave = GRUPO_DE[i-1]
    j = i
    while j < N and GRUPO_DE[j][0] == nombre: j += 1
    ws.merge_cells(start_row=3, start_column=i, end_row=3, end_column=j)
    c = ws.cell(row=3, column=i, value=nombre)
    c.font = Font(name="Calibri", size=9.5, bold=True, color=WHITE)
    c.fill = PatternFill("solid", fgColor=fill_grp[clave])
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = border
    i = j + 1
ws.row_dimensions[3].height = 18

for i, h in enumerate(HEADERS, 1):
    c = ws.cell(row=4, column=i, value=h)
    c.font = f_head
    c.fill = PatternFill("solid", fgColor=fill_grp[GRUPO_DE[i-1][1]])
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = border
ws.row_dimensions[4].height = 40

D0, NF = 5, 400
D1 = D0 + NF - 1
FELI = lambda r: f'LEFT(UPPER(TRIM($AA{r})),8)="FELICITA"'
for r in range(D0, D1+1):
    ws.cell(row=r, column=32, value=(f'=IF($AA{r}="","",IF({FELI(r)},"N/A",'
        f'IF($AE{r}="","",IFERROR(VLOOKUP(UPPER(TRIM($AE{r})),{TERMINOS},2,FALSE),"⚠"))))'))
    ws.cell(row=r, column=33, value=(f'=IF($AA{r}="","",IF({FELI(r)},"N/A",'
        f'IF($AE{r}="","",IFERROR(VLOOKUP(UPPER(TRIM($AE{r})),{TERMINOS},3,FALSE),""))))'))
    ws.cell(row=r, column=34, value=(f'=IF(OR($E{r}="",NOT(ISNUMBER($E{r})),$AF{r}="",$AF{r}="N/A",'
        f'NOT(ISNUMBER($AF{r}))),"",IF($AG{r}="Hábiles",WORKDAY($E{r},$AF{r},{FESTIVOS}),$E{r}+$AF{r}))'))
    ws.cell(row=r, column=34).number_format = "DD/MM/YYYY"
    ws.cell(row=r, column=35, value=(
        f'=IF($E{r}="","",IF({FELI(r)},"⭐ Felicitación",'
        f'IF(NOT(ISNUMBER($E{r})),"⚠ Revisar fecha",'
        f'IF(UPPER(TRIM($AK{r}))="RESPONDIDA - CERRADA","✅ Cerrada",'
        f'IF($AE{r}="","⚠ Falta entidad",'
        f'IF($AH{r}="","⚠ Revisar término",'
        f'IF(TODAY()>$AH{r},"🔴 Vencida",'
        f'IF($AH{r}-TODAY()<={CELL_UMBRAL},"🟡 Próxima a vencer","🟢 En término"))))))))'))
    ws.cell(row=r, column=36, value=(f'=IF(OR($E{r}="",NOT(ISNUMBER($E{r}))),"",'
        f'IF(ISNUMBER($AS{r}),$AS{r}-$E{r},TODAY()-$E{r}))'))
    ws.cell(row=r, column=46, value=(f'=IF(OR($AS{r}="",NOT(ISNUMBER($AS{r})),$AH{r}=""),"",'
        f'IF($AS{r}<=$AH{r},"A tiempo","Fuera de término"))'))
    for c_idx in (3,4,5,40,43,45):
        ws.cell(row=r, column=c_idx).number_format = "DD/MM/YYYY"
    for c_idx in (6,47,48,49,50):
        ws.cell(row=r, column=c_idx).number_format = "DD/MM/YYYY HH:MM"
    for c in range(1, N+1):
        ws.cell(row=r, column=c).border = border
    ws.cell(row=r, column=1).font = Font(name="Consolas", size=9.5, bold=True, color=TEAL_DARK)

def dv(formula1, cols, fecha=False):
    if fecha:
        d = DataValidation(type="date", operator="between", formula1="DATE(2015,1,1)",
                           formula2="DATE(2040,12,31)", allow_blank=True, showErrorMessage=True)
        d.errorTitle, d.error = "Fecha no válida", "Usa el formato DD/MM/AAAA."
    else:
        d = DataValidation(type="list", formula1=formula1, allow_blank=True,
                           showDropDown=False, showErrorMessage=True)
        d.errorTitle, d.error = "Valor no válido", "Selecciona una opción de la lista."
    ws.add_data_validation(d)
    for cl in cols: d.add(f"{cl}{D0}:{cl}{D1}")

dv(f"={rng('CANAL')}", ["B"]); dv(None, ["C","D","E","AQ","AS"], fecha=True)
dv(f"={rng('TIPO SOLICITANTE')}", ["G"]); dv(f"={rng('TIPO DOCUMENTO')}", ["H","N"])
dv(f"={rng('SEXO')}", ["R"]); dv(f"={rng('POBLACIÓN DIFERENCIAL')}", ["S"])
dv(f"={rng('EPS / PRESTADOR')}", ["T"]); dv(f"={rng('RÉGIMEN')}", ["U"])
dv(f"={rng('SEDE')}", ["V"]); dv(f"={rng('SERVICIO')}", ["W"])
dv(f"={rng('MODALIDAD DE ATENCIÓN')}", ["Y"]); dv(f"={rng('TIPO DE PQRS')}", ["AA"])
dv(f"={rng('TIPOLOGÍA')}", ["AC"]); dv(f"={rng('ENTIDAD PRESENTADA')}", ["AE"])
dv(f"={rng('ESTADO')}", ["AK"])

full = f"A{D0}:AJ{D1}"
for txt, color in [("🔴 Vencida",RED_LIGHT),("🟡 Próxima a vencer",YELLOW_LIGHT),
                   ("🟢 En término",GREEN_LIGHT),("✅ Cerrada",GREY),("⭐ Felicitación",TEAL_LIGHT)]:
    ws.conditional_formatting.add(full, FormulaRule(formula=[f'$AI{D0}="{txt}"'],
        fill=PatternFill("solid", fgColor=color)))
ws.conditional_formatting.add(full, FormulaRule(formula=[f'LEFT($AI{D0},1)="⚠"'],
    fill=PatternFill("solid", fgColor="FFE0B2")))
ws.freeze_panes = f"C{D0}"
print("Consolidado OK (%d columnas, filas %d-%d)" % (N, D0, D1))

# ============================ TRAZABILIDAD ============================
ws = wb.create_sheet("Trazabilidad")
ws.sheet_view.showGridLines = False
for col, w in zip("ABCDE", [20,20,30,80,30]):
    ws.column_dimensions[col].width = w
titulo(ws, 5, "🧭 TRAZABILIDAD", "Cada acción de la plataforma queda registrada aquí. No editar.")
for i, h in enumerate(["FECHA Y HORA","RADICADO","ACCIÓN","DETALLE","USUARIO"]):
    c = ws.cell(row=4, column=1+i, value=h)
    c.font, c.fill, c.border = f_head, PatternFill("solid", fgColor="0B7A9E"), border
    c.alignment = Alignment(horizontal="center")
ws.freeze_panes = "A5"
print("Trazabilidad OK")

# ============================ MAPEO FORMULARIO ============================
ws = wb.create_sheet("Mapeo_Formulario")
ws.sheet_view.showGridLines = False
for col, w in zip("ABCD", [52,34,6,40]):
    ws.column_dimensions[col].width = w
titulo(ws, 4, "🔗 MAPEO DEL GOOGLE FORM EXISTENTE",
  "Se configura desde la plataforma (Configuración ▸ Vincular formulario). Aquí queda el resultado.")
for i, h in enumerate(["PREGUNTA DEL FORMULARIO (título exacto)","CAMPO DEL SISTEMA"]):
    c = ws.cell(row=4, column=1+i, value=h)
    c.font, c.fill, c.border = f_head, PatternFill("solid", fgColor="0B7A9E"), border
    c.alignment = Alignment(horizontal="center")
MAPEO_PRECARGADO = [
 ("Usted es:", "tipoSolicitante"),
 ("Su opinión corresponde a:", "tipoPqrs"),
 ("Tipo de identificación", "tipoDocSolicitante"),
 ("Numero de identificación", "numDocSolicitante"),
 ("Nombre del paciente", "nombreSolicitante"),
 ("Teléfono", "telefono"),
 ("Dirección", "direccion"),
 ("Correo electronico", "correo"),
 ("Edad", "edad"),
 ("Sexo", "sexo"),
 ("EPS", "eps"),
 ("Régimen", "regimen"),
 ("Servicio a la que va vinculada su opinión", "servicio"),
 ("Sede de la institución donde consulto", "sede"),
 ("Descripción de su opinión", "descripcion"),
 ("Población Diferencial (Si aplica)", "poblacion"),
]
for i, (preg, campo) in enumerate(MAPEO_PRECARGADO):
    a = ws.cell(row=5+i, column=1, value=preg); a.border, a.font = border, f_norm
    b = ws.cell(row=5+i, column=2, value=campo); b.border = border
    b.font = Font(name="Consolas", size=9.5, color=TEAL_DARK)

ws.cell(row=4, column=4, value="CAMPOS DISPONIBLES").font = f_bold
CAMPOS = ["(no importar)","canal","fechaPqrs","fechaRecepcion","tipoSolicitante","tipoDocSolicitante",
 "numDocSolicitante","nombreSolicitante","telefono","correo","direccion","tipoDocAfiliado","numDocAfiliado",
 "nombreAfiliado","edad","sexo","poblacion","eps","regimen","sede","servicio","servicioEspecifico",
 "modalidad","tipoPqrs","descripcion","entidad","observaciones"]
for i, c_ in enumerate(CAMPOS):
    ws.cell(row=5+i, column=4, value=c_).font = Font(name="Consolas", size=9.5)
ws.freeze_panes = "A5"
print("Mapeo_Formulario OK")

# ============================ LÉEME ============================
ws = wb.create_sheet("LÉEME")
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 4; ws.column_dimensions["B"].width = 112
titulo(ws, 2, "SISTEMA PQRS v4 — MiRed Barranquilla IPS S.A.S.",
  "Todo se opera desde la plataforma web. Este libro es la base de datos.")
TXT = [
 ("Cómo funciona", f_bold),
 ("La plataforma web es el único sitio donde se trabaja: radicar, analizar, direccionar al área, registrar la "
  "respuesta del responsable, responder al usuario y ver el tablero. Este libro guarda los datos y sirve de respaldo "
  "y de fuente para los informes.", f_norm),
 ("", f_norm),
 ("Hojas", f_bold),
 ("• Consolidado_PQRS — una fila por PQRS, con las tres fechas separadas: la de la PQRS (la que trae el documento "
  "del usuario), la de recepción en el SIAU y la de radicación en el sistema, que es desde la que corre el término legal.", f_norm),
 ("• Trazabilidad — bitácora de cada acción: quién, cuándo y qué hizo con cada radicado.", f_norm),
 ("• Responsables — áreas, nombres y correos. Se administra desde la plataforma.", f_norm),
 ("• Mapeo_Formulario — equivalencia entre las preguntas de tu Google Form y los campos del sistema. Ya viene cargada con las 16 preguntas del formulario «OPINIONES DEL USUARIO PQRS CODIGO QR».", f_norm),
 ("• Config — términos legales, festivos, listas y parámetros.", f_norm),
 ("", f_norm),
 ("El flujo de una PQRS", f_bold),
 ("1. Se radica (presencial en la plataforma, por el formulario del QR o por correo) → el usuario recibe el acuse.", f_norm),
 ("2. El SIAU la analiza, la clasifica y elige el área responsable → sale el correo al área y, al mismo tiempo, "
  "el aviso al usuario de que su PQRS está en gestión.", f_norm),
 ("3. Si se envió al área equivocada, se redirecciona desde la plataforma: se notifica a la nueva área y queda "
  "el registro del cambio.", f_norm),
 ("4. El área responde por correo interno; el SIAU pega esa respuesta en la plataforma.", f_norm),
 ("5. El SIAU ajusta el texto para el usuario y cierra: sale el correo de respuesta final.", f_norm),
]
r = 4
for t, f in TXT:
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    c = ws.cell(row=r, column=1, value=t); c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")
    if len(t) > 95: ws.row_dimensions[r].height = 30
    r += 1

wb._sheets = [wb[n] for n in ["LÉEME","Consolidado_PQRS","Trazabilidad","Responsables","Mapeo_Formulario","Config"]]
wb.active = 0
os.makedirs("/mnt/user-data/outputs", exist_ok=True)
OUT = "/mnt/user-data/outputs/PQRS_BaseDatos_v4.xlsx"
wb.save(OUT); print("GUARDADO:", OUT)
