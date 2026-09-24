"""Migra el histórico 2026 al consolidado de la plataforma (versión 8).

Une en un solo libro, con la estructura de 57 columnas de Consolidado_PQRS:
  UNA SOLA ESTRUCTURA DE RADICADO: SIAU-AAAA-MM-NNNN para todo.
  1. HISTÓRICO CONSOLIDADO DE OPINIONES DEL USUARIO 2026 · hoja «QUEJAS SUGERENCIAS RECLAMO»
     → conserva su radicado SIAU (…, SIAU-2026-09-3514).
  2. El mismo libro · hoja «FELICITACIONES» (antes no se codificaban).
  3. Respuestas del formulario QR (pqrs.xlsx) de 2026 que NO están en el histórico:
       quejas, reclamos, sugerencias y felicitaciones.
  Lo que no tenía radicado (2 y 3, y el caso del histórico sin código) recibe un radicado SIAU nuevo
  a partir del siguiente al último del histórico (3515…), en orden cronológico; AAAA-MM es su mes real.
Las fórmulas de términos, semáforo, días y oportunidad se escriben igual que las escribe la plataforma
(se generan con el propio Codigo.gs), junto con las hojas Festivos, Categorias_Correo y Entidades_Correo.

El libro de salida contiene datos personales y de salud: NO se sube al repositorio (Ley 1581 de 2012).
Uso:
  python3 tools/migrar_historico.py --historico HISTORICO.xlsx --formulario pqrs.xlsx --salida CARPETA
Requiere: pip install openpyxl
"""
import argparse, collections, datetime as dt, json, pathlib, re, subprocess, sys, unicodedata
import openpyxl
from openpyxl.styles import Font, PatternFill

R = pathlib.Path(__file__).resolve().parents[1]
HOY = dt.datetime.now()

# ----------------------------------------------------------------------------- columnas (mapa C de Codigo.gs)
C = dict(CODIGO=1, CANAL=2, FECHA_PQRS=3, FECHA_RECEPCION=4, FECHA_RADICACION=5, MARCA=6, TIPO_SOLICITANTE=7, TIPO_DOC_SOL=8,
         NUM_DOC_SOL=9, NOMBRE_SOL=10, TELEFONO=11, CORREO=12, DIRECCION=13, TIPO_DOC_AFI=14, NUM_DOC_AFI=15, NOMBRE_AFI=16,
         EDAD=17, SEXO=18, POBLACION=19, EPS=20, REGIMEN=21, SEDE=22, SERVICIO=23, SERVICIO_ESP=24, MODALIDAD=25,
         DEPARTAMENTO=26, TIPO_PQRS=27, CLASIF_INTERNA=28, TIPOLOGIA=29, DESCRIPCION=30, ENTIDAD=31, TERMINO=32, TIPO_DIA=33,
         FECHA_MAX=34, SEMAFORO=35, DIAS=36, ESTADO=37, RESPONSABLE=38, CORREO_RESP=39, FECHA_ENVIO_AREA=40, REDIRECCIONES=41,
         RTA_AREA=42, FECHA_RTA_AREA=43, RTA_USUARIO=44, FECHA_RTA_USUARIO=45, OPORTUNIDAD=46, NOTIF_RECEPCION=47,
         NOTIF_AREA=48, NOTIF_GESTION=49, NOTIF_CIERRE=50, OBSERVACIONES=51, ID_CORREO=52, REGISTRADO_POR=53,
         NIVEL_RIESGO=54, POBLACION_PRIORIZADA=55, AUTORIZACION_DATOS=56, AREA_SUGERIDA=57)
NCOL = 57
ENC_V8 = {54: "NIVEL DE RIESGO (CIRCULARES SUPERSALUD)", 55: "POBLACIÓN PRIORIZADA", 56: "AUTORIZACIÓN TRATAMIENTO DE DATOS", 57: "ÁREA SUGERIDA"}

# ----------------------------------------------------------------------------- normalización
def norm(s):
    s = "" if s is None else str(s)
    s = unicodedata.normalize("NFD", s.strip().lower())
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")

def compacto(s):
    return re.sub(r"[^a-z0-9ñ]", "", norm(s))

def texto(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = str(v).strip()
    return "" if s.upper() in ("NONE", "NAN") else s

def numero_doc(v):
    s = texto(v)
    s = re.sub(r"\.0$", "", s)
    return re.sub(r"[^\dA-Za-z]", "", s) if re.search(r"\d", s) else s

SEDES = ["C. ADELITA DE CHAR", "C. BOSQUE DE MARIA", "C. CIUDADELA 20 DE JULIO", "C. LA MANGA", "C. LA PLAYA", "C. LUZ CHINITA",
         "C. MURILLO", "C. NAZARETH", "C. NUEVO BARRANQUILLA", "C. SALUD METROPOLITANO", "C. SIMON BOLIVAR", "C. SUROCCIDENTE",
         "HOSPITAL GENERAL DE BARRANQUILLA", "P. BARLOVENTO", "P. BUENA ESPERANZA", "P. CARLOS MEISSEL", "P. CARRIZAL",
         "P. EL FERRY", "P. ESMERALDA LIPAYA", "P. GALAN", "P. JUAN MINA", "P. JULIO MONTES", "P. LA 21", "P. LA PRADERA",
         "P. LA SIERRITA", "P. LA VILLA", "P. LAS FLORES", "P. LAS MALVINAS", "P. LAS NIEVES", "P. LAS PALMAS", "P. NUEVA ERA",
         "P. NUEVA VIDA", "P. REBOLO", "P. ROSOUR", "P. SAN CAMILO", "P. SAN JOSE", "P. SAN SALVADOR", "P. SANTO DOMINGO",
         "P. UNIVERSAL", "P. VILLA NUEVA", "P. VILLA SAN PABLO"]
ALIAS_SEDES = {"metropolitano": "saludmetropolitano", "saludmetropolitana": "saludmetropolitano",
               "universitariodistritaladelitadechar": "adelitadechar", "manga": "lamanga", "bosquesdemaria": "bosquedemaria",
               "ciudadela": "ciudadela20dejulio", "elferry1demayo": "elferry", "ferry": "elferry", "carlosmeiselii": "carlosmeissel",
               "carlosmeisel": "carlosmeissel", "villasdesanpablo": "villasanpablo", "villasanpablo": "villasanpablo",
               "centroderecuperacionnutricionalrosour": "rosour", "sierrita": "lasierrita", "hospitalgeneraldebarranquilla": "hospitalgeneraldebarranquilla",
               "hospitalbq": "hospitalgeneraldebarranquilla", "suroccidente": "suroccidente", "suroccidental": "suroccidente"}

def nucleo_sede(v):
    n = norm(v)
    n = re.sub(r"^(c|p)\.\s*", "", n)
    n = re.sub(r"^(camino|paso)\s+", "", n)
    n = n.replace("1º", "1").replace("1°", "1")
    n = re.sub(r"[^a-z0-9ñ]", "", n)
    return ALIAS_SEDES.get(n, n)

NUCLEOS = {nucleo_sede(s): s for s in SEDES}
sedes_sin_mapa = collections.Counter()

def sede(v):
    s = texto(v)
    if not s or norm(s) in ("sede", "no especifica", "nd", "none"):
        return ""
    n = nucleo_sede(s)
    if n in NUCLEOS:
        return NUCLEOS[n]
    sedes_sin_mapa[s] += 1
    return s.upper()

TIPOS = {"queja": "QUEJA", "reclamo": "RECLAMO", "sugerencia": "SUGERENCIA", "felicitacion": "FELICITACION", "peticion": "PETICIÓN",
         "denuncia": "DENUNCIA", "tutela": "TUTELA", "solicitud": "SOLICITUD"}

def tipo(v):
    n = norm(v)
    for k, t in TIPOS.items():
        if n.startswith(k):
            return t
    return texto(v).upper()

DOCS = {"cc": "CEDULA DE CIUDADANIA", "cedula de ciudadania": "CEDULA DE CIUDADANIA", "ti": "TARJETA DE IDENTIDAD", "t.i": "TARJETA DE IDENTIDAD",
        "tarjeta de identidad": "TARJETA DE IDENTIDAD", "rc": "REGISTRO CIVIL", "registro civil": "REGISTRO CIVIL", "ce": "CEDULA DE EXTRANJERIA",
        "cedula extranjeria": "CEDULA DE EXTRANJERIA", "pt": "PERMISO POR PROTECCION TEMPORAL", "ppt": "PERMISO POR PROTECCION TEMPORAL",
        "tp": "PERMISO POR PROTECCION TEMPORAL", "permiso de proteccion temporal": "PERMISO POR PROTECCION TEMPORAL",
        "pe": "PERMISO ESPECIAL DE PERMANENCIA", "permiso especial de permanencia": "PERMISO ESPECIAL DE PERMANENCIA",
        "pasaporte": "PASAPORTE", "pa": "PASAPORTE", "sc": "SALVACONDUCTO", "certificado de nacido vivo": "CERTIFICADO DE NACIDO VIVO",
        "msi": "MENOR SIN IDENTIFICACIÓN", "adulto sin identificacion": "ADULTO SIN IDENTIFICACIÓN"}

def tipo_doc(v):
    n = norm(v)
    if not n or n in ("none", "nd", "no especifica"):
        return ""
    return DOCS.get(n, texto(v).upper())

def sexo(v):
    n = norm(v)
    if n.startswith("fem") or n == "f":
        return "FEMENINO"
    if n.startswith("mas") or n == "m":
        return "MASCULINO"
    return "" if n in ("", "none", "nd", "no especifica") else ("OTRO" if n == "otro" else "")

EPS = [("mutual", "MUTUAL SER EPS"), ("coosalud", "COOSALUD EPS"), ("nueva eps", "NUEVA EPS"), ("n-eps", "NUEVA EPS"), ("proteger", "PROTEGER EPS"),
       ("cajacopi", "PROTEGER EPS"), ("sura", "EPS SURA"), ("sanitas", "EPS SANITAS"), ("salud total", "SALUD TOTAL EPS"), ("famisanar", "FAMISANAR EPS"),
       ("familiar", "EPS FAMILIAR DE COLOMBIA"), ("secretaria", "SECRETARÍA DISTRITAL DE SALUD DE BARRANQUILLA"), ("gobernacion", "GOBERNACIÓN DEL ATLÁNTICO"),
       ("particular", "PARTICULAR"), ("venta de contado", "PARTICULAR"), ("soat", "SOAT"), ("adres", "ADRES")]

def eps(v):
    n = norm(v)
    if not n or n in ("none", "nd", "no aplica", "no especifica", "no registra", "no tiene", "otros"):
        return ""
    for k, e in EPS:
        if k in n:
            return e
    return texto(v).upper()

def regimen(v):
    n = norm(v)
    return {"subsidiado": "SUBSIDIADO", "contributivo": "CONTRIBUTIVO", "particular": "PARTICULAR", "vinculado": "OTRO", "otros": "OTRO"}.get(n, "")

def poblacion(v):
    n = norm(v)
    if not n or n in ("no aplica", "none", "no especifica", "ninguna"):
        return "No aplica"
    for k, p in [("migrante", "Migrante"), ("discapacidad", "Discapacidad"), ("victima", "Víctima del conflicto"), ("etni", "Étnica"),
                 ("lgbt", "LGBTIQ+"), ("gestante", "Gestante"), ("adulto mayor", "Adulto mayor"), ("menor", "Menor de edad")]:
        if k in n:
            return p
    return "Otro"

def solicitante(v):
    n = norm(v)
    if "colaborador" in n or "empleado" in n:
        return "COLABORADOR"
    if "cuidador" in n or "acompan" in n or "familiar" in n:
        return "FAMILIAR"
    return "USUARIO" if n else ""

CANALES = {"presencial": "Presencial", "qr": "QR - Formulario", "correo": "Correo electrónico", "plataforma eps": "Plataforma EPS",
           "telefonico": "Telefónico", "buzon": "Buzón de sugerencias"}

def canal(v):
    n = norm(v)
    for k, c in CANALES.items():
        if n.startswith(k):
            return c
    return texto(v) or "Presencial"

def servicio(v):
    s = texto(v).upper()
    return {"LABORATORIO": "LABORATORIO CLINICO", "HOSPITALIZACIÓN PEDIATRIA": "HOSPITALIZACIÓN PEDIATRÍA",
            "HOSPITALIZACIÓN ADULTOS": "HOSPITALIZACIÓN ADULTOS", "CUIDADO INTENSIVO NEONATAL": "CUIDADO INTENSIVO NEONATAL"}.get(s, s)

def correo(v):
    s = texto(v).strip()
    return s.lower() if re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", s) else ""

def edad(v):
    s = texto(v)
    m = re.search(r"\d{1,3}", s)
    return int(m.group()) if m and int(m.group()) < 120 else ""

MESES = {m: i + 1 for i, m in enumerate(["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"])}

def fecha(v, mes=None, anio=2026):
    """Fecha sin hora; corrige errores de digitación frecuentes del histórico (0206 → 2026, 16/062026…)."""
    estimada = False
    d = None
    if isinstance(v, dt.datetime):
        d = v
        if d.year < 2000 or d.year == 2027 and d.month > HOY.month:
            try:
                d = d.replace(year=2026)
            except ValueError:
                d = None
    elif isinstance(v, (int, float)) and 40000 < v < 50000:
        d = dt.datetime(1899, 12, 30) + dt.timedelta(days=int(v))
    elif v:
        s = str(v).strip()
        m = re.match(r"^(\d{1,2})\D+(\d{1,2})\D+(\d{4})", s) or re.match(r"^(\d{1,2})/(\d{2})(\d{4})$", s)
        if m:
            dd, mm, yy = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if yy == 2027:
                yy = 2026
            try:
                d = dt.datetime(yy, mm, dd)
            except ValueError:
                d = None
    if d is not None and not (dt.datetime(2025, 11, 1) <= d <= HOY + dt.timedelta(days=2)):
        d = None
    if d is None and mes:
        n = MESES.get(norm(mes))
        if n:
            d, estimada = dt.datetime(anio if n <= 10 else anio, n, 1), True
    if d is None:
        return None, False
    return dt.datetime(d.year, d.month, d.day), estimada

# ----------------------------------------------------------------------------- datos de Codigo.gs
def datos_backend():
    js = r"""
    const { crear, Hoja } = require(process.argv[1] + "/tests/harness.js");
    const G = crear({ "Config": new Hoja("Config") });
    const fest = []; for (let y = 2025; y <= 2031; y++) fest.push(...G._festivosColombia_(y));
    const f = G._formulasFila_(5);
    console.log(JSON.stringify({ catCols: G.CAT_COLS, cats: G.CATEGORIAS_BASE, entCols: G.ENT_COLS, ents: G.ENTIDADES_BASE,
      fest, formulas: f.bloque, oportunidad: f.oportunidad, resp: G.RESP_COLS_V8,
      dir: G.DIRECTORIO_BASE.map(d => [d[0].source, d[1], d[2]]) }));
    """
    out = subprocess.run(["node", "-e", js, str(R)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)

def formulas_fila(base, r):
    return [re.sub(r"(\$[A-Z]{1,2})5(?!\d)", lambda m: m.group(1) + str(r), f) for f in base]

# ----------------------------------------------------------------------------- lectura
def leer_historico(ruta):
    wb = openpyxl.load_workbook(ruta, data_only=True)
    qsr = [r for r in wb["QUEJAS SUGERENCIAS RECLAMO "].iter_rows(min_row=6, values_only=True) if any(v not in (None, "") for v in r[:21])]
    fel = [r for r in wb["FELICITACIONES "].iter_rows(min_row=6, values_only=True) if (r[0] or r[1] or r[18]) and texto(r[18])]
    return qsr, fel

def leer_formulario(ruta):
    wb = openpyxl.load_workbook(ruta, data_only=True)
    ws = wb["Respuestas de formulario 1"]
    enc = [texto(c.value) for c in ws[1]]
    filas = [r for r in ws.iter_rows(min_row=2, values_only=True) if isinstance(r[0], dt.datetime)]
    return enc, filas

# ----------------------------------------------------------------------------- construcción
def fila_vacia():
    return [""] * NCOL

def poner(f, col, v):
    f[C[col] - 1] = "" if v is None else v

def estado_de(rta, fecha_rta, solicitud, oport):
    """Cerrada solo si hay fecha de respuesta o una respuesta con oportunidad calificada (OPORTUNO/VENCIDO).
    Una respuesta redactada sin fecha ni calificación es un borrador: el caso sigue en gestión."""
    op = norm(oport)
    if fecha_rta or (texto(rta) and op in ("oportuno", "vencido")):
        return "Respondida - Cerrada"
    if texto(rta) or texto(solicitud) or op == "pendiente":
        return "En gestión"
    return "Recibida"

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--historico", required=True)
    ap.add_argument("--formulario", required=True)
    ap.add_argument("--plantilla", default=str(R / "plantilla_libro" / "PQRS_BaseDatos_plantilla.xlsx"))
    ap.add_argument("--salida", default=str(R / "migracion_salida"))
    a = ap.parse_args()
    salida = pathlib.Path(a.salida); salida.mkdir(parents=True, exist_ok=True)

    B = datos_backend()
    qsr, fel = leer_historico(a.historico)
    enc_form, form = leer_formulario(a.formulario)
    registros = []   # (fecha_radicacion, marca, serie, fila57, meta)
    informe = collections.OrderedDict()
    revisar = []

    # ---- 1. quejas, sugerencias y reclamos con radicado SIAU
    ids_q, desc_q, tel_q = set(), set(), set()
    for r in qsr:
        f = fila_vacia()
        codigo = texto(r[0]).upper()
        frad, est_rad = fecha(r[25], r[23])
        fing, _ = fecha(r[24], r[23])
        marca = r[25] if isinstance(r[25], dt.datetime) and (r[25].hour or r[25].minute) else frad
        poner(f, "CODIGO", codigo if re.match(r"^SIAU-\d{4}-\d{2}-\d{4,}$", codigo) else "")
        poner(f, "CANAL", canal(r[3])); poner(f, "FECHA_PQRS", fing or frad); poner(f, "FECHA_RECEPCION", fing or frad)
        poner(f, "FECHA_RADICACION", frad); poner(f, "MARCA", marca)
        poner(f, "TIPO_SOLICITANTE", solicitante(r[4])); poner(f, "TIPO_DOC_SOL", tipo_doc(r[5])); poner(f, "NUM_DOC_SOL", numero_doc(r[6]))
        poner(f, "NOMBRE_SOL", texto(r[7]).title() if texto(r[7]).isupper() else texto(r[7])); poner(f, "TIPO_DOC_AFI", tipo_doc(r[8]))
        poner(f, "NUM_DOC_AFI", numero_doc(r[9])); poner(f, "NOMBRE_AFI", texto(r[10]).title() if texto(r[10]).isupper() else texto(r[10]))
        poner(f, "EDAD", edad(r[11])); poner(f, "SEXO", sexo(r[12])); poner(f, "POBLACION", poblacion(r[13])); poner(f, "DIRECCION", texto(r[14]) if norm(r[14]) not in ("nd", "none") else "")
        poner(f, "TELEFONO", numero_doc(r[15]) if re.search(r"\d{7}", texto(r[15])) else ""); poner(f, "CORREO", correo(r[16]))
        poner(f, "REGIMEN", regimen(r[17])); poner(f, "EPS", eps(r[18]))
        ent = norm(r[19])
        poner(f, "ENTIDAD", "SUPERSALUD" if ent.startswith("super") else ("SECRETARIA DE SALUD" if ent.startswith("secret") else "SEDE"))
        poner(f, "DESCRIPCION", texto(r[20])); poner(f, "DEPARTAMENTO", "ATLÁNTICO"); poner(f, "MODALIDAD", "Presencial")
        poner(f, "SEDE", sede(r[1])); poner(f, "TIPO_PQRS", tipo(r[2]) or "QUEJA"); poner(f, "SERVICIO", servicio(r[31])); poner(f, "SERVICIO_ESP", servicio(r[32]))
        frta, _ = fecha(r[28]); farea, _ = fecha(r[33])
        poner(f, "RTA_USUARIO", texto(r[29])); poner(f, "FECHA_RTA_USUARIO", frta)
        poner(f, "FECHA_RTA_AREA", farea)
        poner(f, "ESTADO", estado_de(r[29], frta, r[35], r[34])); poner(f, "REDIRECCIONES", 0)
        obs = []
        if texto(r[34]): obs.append("Oportunidad histórica: " + texto(r[34]))
        if texto(r[36]): obs.append("[Análisis previo: " + texto(r[36]) + "]")
        if texto(r[35]): obs.append("Solicitud al proceso: " + texto(r[35])[:1500])
        if est_rad: obs.append("[Fecha estimada por el mes]")
        if not tipo(r[2]): obs.append("[Tipo por confirmar: el histórico no lo traía]")
        obs.append("Migrado del histórico 2026 (quejas, sugerencias y reclamos)")
        poner(f, "OBSERVACIONES", " · ".join(obs)); poner(f, "REGISTRADO_POR", "Migración histórico 2026")
        poner(f, "AUTORIZACION_DATOS", "No registrada (histórico)")
        registros.append({"f": f, "fecha": frad or dt.datetime(2026, 1, 1), "marca": marca, "serie": "SIAU" if f[0] else "HIS"})
        for v in (r[6], r[9]):
            if numero_doc(v): ids_q.add(numero_doc(v))
        desc_q.add(compacto(r[20])[:30]); tel_q.add(numero_doc(r[15]))
    informe["Quejas, sugerencias y reclamos con radicado SIAU"] = sum(1 for x in registros if x["serie"] == "SIAU")
    informe["Quejas, sugerencias y reclamos sin radicado en el histórico (reciben radicado SIAU nuevo)"] = sum(1 for x in registros if x["serie"] == "HIS")

    # ---- 2. felicitaciones del histórico
    fel_claves = set()
    n_fel = 0
    for r in fel:
        f = fila_vacia()
        frad, est = fecha(r[23], r[21])
        fing, _ = fecha(r[22], r[21])
        poner(f, "CANAL", canal(r[2])); poner(f, "FECHA_PQRS", fing or frad); poner(f, "FECHA_RECEPCION", fing or frad)
        poner(f, "FECHA_RADICACION", frad); poner(f, "MARCA", frad)
        poner(f, "TIPO_SOLICITANTE", solicitante(r[3])); poner(f, "TIPO_DOC_SOL", tipo_doc(r[4])); poner(f, "NUM_DOC_SOL", numero_doc(r[5]))
        poner(f, "NOMBRE_SOL", texto(r[6])); poner(f, "TIPO_DOC_AFI", tipo_doc(r[7])); poner(f, "NUM_DOC_AFI", numero_doc(r[8])); poner(f, "NOMBRE_AFI", texto(r[9]))
        poner(f, "EDAD", edad(r[10])); poner(f, "SEXO", sexo(r[11])); poner(f, "POBLACION", poblacion(r[12])); poner(f, "DIRECCION", texto(r[13]))
        poner(f, "TELEFONO", numero_doc(r[14]) if re.search(r"\d{7}", texto(r[14])) else ""); poner(f, "CORREO", correo(r[15]))
        poner(f, "REGIMEN", regimen(r[16])); poner(f, "EPS", eps(r[17])); poner(f, "DESCRIPCION", texto(r[18])); poner(f, "DEPARTAMENTO", "ATLÁNTICO")
        poner(f, "MODALIDAD", "Presencial"); poner(f, "SEDE", sede(r[0])); poner(f, "TIPO_PQRS", "FELICITACION")
        poner(f, "SERVICIO", servicio(r[24])); poner(f, "SERVICIO_ESP", servicio(r[25])); poner(f, "ESTADO", "Respondida - Cerrada"); poner(f, "REDIRECCIONES", 0)
        poner(f, "OBSERVACIONES", "Migrada del histórico 2026 (felicitaciones)" + (" · [Fecha estimada por el mes]" if est else ""))
        poner(f, "REGISTRADO_POR", "Migración histórico 2026"); poner(f, "AUTORIZACION_DATOS", "No registrada (histórico)")
        registros.append({"f": f, "fecha": frad or dt.datetime(2026, 1, 1), "marca": frad, "serie": "FEL"})
        fel_claves.add((numero_doc(r[5]), frad.date() if frad else None))
        n_fel += 1
    informe["Felicitaciones del histórico (reciben radicado SIAU nuevo)"] = n_fel

    # ---- 3. formulario QR 2026 que no está en el histórico
    ix = {norm(t): i for i, t in enumerate(enc_form)}
    def col(*claves):
        for k in claves:
            for t, i in ix.items():
                if t.startswith(norm(k)):
                    return i
        return None
    I = dict(sol=col("usted es"), tipo=col("su opinion"), tdoc=col("tipo de identificacion"), doc=col("numero de identificacion"), nom=col("nombre del paciente"),
             tel=col("telefono"), dir=col("direccion"), mail=col("correo"), edad=col("edad"), sexo=col("sexo"), eps=col("eps"), reg=col("regimen"),
             serv=col("servicio"), sede=col("sede de la institucion"), desc=col("descripcion de su opinion"), pob=col("poblacion"),
             fres=col("fecha de respuesta"), res=col("resumen de respuesta"), est=col("estado de la pqrs"), obs=col("observaciones"),
             proc=col("solicitud al proceso"), clas=col("clasificacion interna"))
    g = lambda r, k: r[I[k]] if I[k] is not None and I[k] < len(r) else None
    qr_q = qr_f = dup_q = dup_f = 0
    ultima_marca = None
    for r in form:
        marca = r[0]
        if marca.year != 2026:
            continue
        ultima_marca = max(ultima_marca or marca, marca)
        t = tipo(g(r, "tipo"))
        doc = numero_doc(g(r, "doc"))
        fdia = dt.datetime(marca.year, marca.month, marca.day)
        if t == "FELICITACION":
            if (doc, fdia.date()) in fel_claves or (doc, (fdia - dt.timedelta(days=1)).date()) in fel_claves:
                dup_f += 1; continue
        else:
            if doc in ids_q or compacto(g(r, "desc"))[:30] in desc_q or (numero_doc(g(r, "tel")) and numero_doc(g(r, "tel")) in tel_q):
                dup_q += 1; continue
        f = fila_vacia()
        poner(f, "CANAL", "QR - Formulario"); poner(f, "FECHA_PQRS", fdia); poner(f, "FECHA_RECEPCION", fdia); poner(f, "FECHA_RADICACION", fdia); poner(f, "MARCA", marca)
        poner(f, "TIPO_SOLICITANTE", solicitante(g(r, "sol"))); poner(f, "TIPO_DOC_SOL", tipo_doc(g(r, "tdoc"))); poner(f, "NUM_DOC_SOL", doc)
        poner(f, "NOMBRE_SOL", texto(g(r, "nom"))); poner(f, "TELEFONO", numero_doc(g(r, "tel"))); poner(f, "DIRECCION", texto(g(r, "dir")))
        poner(f, "CORREO", correo(g(r, "mail"))); poner(f, "EDAD", edad(g(r, "edad"))); poner(f, "SEXO", sexo(g(r, "sexo")))
        poner(f, "EPS", eps(g(r, "eps"))); poner(f, "REGIMEN", regimen(g(r, "reg"))); poner(f, "SERVICIO", servicio(g(r, "serv")))
        poner(f, "SEDE", sede(g(r, "sede"))); poner(f, "DESCRIPCION", texto(g(r, "desc"))); poner(f, "POBLACION", poblacion(g(r, "pob")))
        poner(f, "DEPARTAMENTO", "ATLÁNTICO"); poner(f, "MODALIDAD", "Presencial"); poner(f, "TIPO_PQRS", t); poner(f, "REDIRECCIONES", 0)
        poner(f, "REGISTRADO_POR", "Formulario QR (migración 2026)"); poner(f, "AUTORIZACION_DATOS", "No registrada (formulario anterior)")
        if t == "FELICITACION":
            poner(f, "ESTADO", "Respondida - Cerrada")
            poner(f, "OBSERVACIONES", "Migrada de las respuestas del formulario QR 2026")
            registros.append({"f": f, "fecha": fdia, "marca": marca, "serie": "FEL"}); qr_f += 1
        else:
            fres, _ = fecha(g(r, "fres"))
            poner(f, "ENTIDAD", "SEDE"); poner(f, "RTA_USUARIO", texto(g(r, "res"))); poner(f, "FECHA_RTA_USUARIO", fres)
            poner(f, "ESTADO", estado_de(g(r, "res"), fres, g(r, "proc"), g(r, "est")))
            obs = ["Gestionada en la hoja de respuestas del formulario QR; sin radicado SIAU en el histórico"]
            if texto(g(r, "est")): obs.append("Oportunidad histórica: " + texto(g(r, "est")))
            if texto(g(r, "obs")): obs.append(texto(g(r, "obs")))
            if texto(g(r, "clas")): obs.append("[Análisis previo: " + texto(g(r, "clas")) + "]")
            if texto(g(r, "proc")): obs.append("Solicitud al proceso: " + texto(g(r, "proc"))[:1500])
            poner(f, "OBSERVACIONES", " · ".join(obs))
            registros.append({"f": f, "fecha": fdia, "marca": marca, "serie": "QR"}); qr_q += 1
    informe["Formulario QR 2026 · quejas, reclamos y sugerencias no tabuladas (reciben radicado SIAU nuevo)"] = qr_q
    informe["Formulario QR 2026 · felicitaciones no tabuladas (reciben radicado SIAU nuevo)"] = qr_f
    informe["Formulario QR 2026 · ya estaban en el histórico (omitidas)"] = dup_q + dup_f

    # ---- orden cronológico y radicado SIAU único para lo que no lo tenía
    registros.sort(key=lambda x: (x["fecha"], x["marca"] if isinstance(x["marca"], dt.datetime) else x["fecha"]))
    siau = sorted(int(x["f"][0].split("-")[-1]) for x in registros if x["serie"] == "SIAU")
    sig = (siau[-1] if siau else 3174) + 1
    primero = sig
    for x in registros:
        f = x["f"]
        if x["serie"] == "SIAU":
            continue
        fr = f[C["FECHA_RADICACION"] - 1] or x["fecha"]
        f[0] = "SIAU-%04d-%02d-%04d" % (fr.year, fr.month, sig); sig += 1
        if x["serie"] in ("QR", "HIS"):
            revisar.append([f[0], f[C["FECHA_RADICACION"] - 1], f[C["TIPO_PQRS"] - 1], f[C["SEDE"] - 1], f[C["ESTADO"] - 1],
                            "Revisar si ya fue gestionada con otro radicado; si es así, anotar el radicado anterior en OBSERVACIONES."])
    informe["Radicados SIAU asignados a lo que no tenía radicado"] = ("SIAU-…-%04d a SIAU-…-%d" % (primero, sig - 1)) if sig > primero else "ninguno"
    informe["Siguiente radicado de la plataforma"] = "SIAU-AAAA-MM-%d" % sig
    informe["Último radicado SIAU migrado"] = "SIAU-…-%04d" % siau[-1] if siau else "—"
    informe["Consecutivos SIAU faltantes en el histórico"] = ", ".join(str(n) for n in range(siau[0], siau[-1] + 1) if n not in set(siau)) or "ninguno"
    informe["Total de registros en el consolidado"] = len(registros)

    # ---- libro de salida a partir de la plantilla
    wb = openpyxl.load_workbook(a.plantilla)
    ws = wb["Consolidado_PQRS"]
    for c, t in ENC_V8.items():
        ws.cell(row=4, column=c, value=t)
        ws.cell(row=4, column=c).font = Font(bold=True, color="FFFFFF"); ws.cell(row=4, column=c).fill = PatternFill("solid", fgColor="006081")
    fin_formulas = 4 + len(registros) + 200
    formato_fecha = "dd/mm/yyyy"
    ws.delete_rows(5, ws.max_row)   # quita las filas de ejemplo con fórmulas desplazadas de la plantilla
    for i, x in enumerate(registros):
        r = 5 + i
        for j, v in enumerate(x["f"]):
            if j + 1 in (C["TERMINO"], C["TIPO_DIA"], C["FECHA_MAX"], C["SEMAFORO"], C["DIAS"], C["OPORTUNIDAD"]):
                continue
            if v == "" or v is None:
                continue
            cel = ws.cell(row=r, column=j + 1, value=v)
            if isinstance(v, dt.datetime):
                cel.number_format = "dd/mm/yyyy hh:mm" if j + 1 == C["MARCA"] else formato_fecha
    for r in range(5, fin_formulas + 1):
        fb = formulas_fila(B["formulas"], r)
        for k, fx in enumerate(fb):
            ws.cell(row=r, column=C["TERMINO"] + k, value=fx)
        ws.cell(row=r, column=C["FECHA_MAX"]).number_format = formato_fecha
        ws.cell(row=r, column=C["OPORTUNIDAD"], value=formulas_fila([B["oportunidad"]], r)[0])
    ws.freeze_panes = "B5"

    cfg = wb["Config"]
    cfg["A9"], cfg["B9"], cfg["C9"], cfg["D9"] = "EPS", 3, "Calendario", "Circular Supersalud 2023151000000010-5 – reclamo de riesgo simple (72 h) si la EPS no indica otro"
    cfg["B11"] = siau[-1] if siau else 3514
    for i, (lab, val) in enumerate([("(sin uso desde v8.1: todos los radicados usan el prefijo de B13)", ""),
                                    ("Importar respuestas del formulario desde (fecha y hora)", ultima_marca),
                                    ("Enlace a la política de tratamiento de datos personales", ""),
                                    ("Enlace público del formulario QR", "")]):
        cfg.cell(row=19 + i, column=1, value=lab)
        if val != "":
            cel = cfg.cell(row=19 + i, column=2, value=val)
            if isinstance(val, dt.datetime):
                cel.number_format = "dd/mm/yyyy hh:mm:ss"
    cfg["B18"] = "Respuestas de formulario 1"
    # listas: sedes, servicios, EPS, canales, tipos, documentos (con lo que aparece en el histórico)
    fila_listas = 43
    cab = {cfg.cell(row=fila_listas, column=c).value: c for c in range(1, 27) if cfg.cell(row=fila_listas, column=c).value}
    def lista(nombre, valores):
        c = cab[nombre]
        for r in range(fila_listas + 1, fila_listas + 200):
            cfg.cell(row=r, column=c, value=None)
        for i, v in enumerate(valores):
            cfg.cell(row=fila_listas + 1 + i, column=c, value=v)
    usados = lambda col: sorted({x["f"][C[col] - 1] for x in registros if x["f"][C[col] - 1]})
    lista("SEDE", SEDES)
    lista("SERVICIO", sorted(set(usados("SERVICIO")) | {cfg.cell(row=r, column=cab["SERVICIO"]).value for r in range(44, 120) if cfg.cell(row=r, column=cab["SERVICIO"]).value}))
    lista("EPS / PRESTADOR", sorted(set(usados("EPS")) | {"NUEVA EPS", "MUTUAL SER EPS", "COOSALUD EPS", "PROTEGER EPS", "SALUD TOTAL EPS", "EPS SANITAS", "EPS SURA",
                                                          "FAMISANAR EPS", "EPS FAMILIAR DE COLOMBIA", "SUPERINTENDENCIA NACIONAL DE SALUD – SUPERSALUD",
                                                          "PERSONERÍA DISTRITAL DE BARRANQUILLA", "DEFENSORÍA DEL PUEBLO", "ICBF – INSTITUTO COLOMBIANO DE BIENESTAR FAMILIAR"}))
    lista("CANAL", ["Presencial", "Buzón de sugerencias", "QR - Formulario", "Correo electrónico", "Telefónico", "Correspondencia física",
                    "Redes sociales", "WhatsApp", "Plataforma EPS"])
    lista("TIPO DE PQRS", ["PETICIÓN", "QUEJA", "RECLAMO", "SUGERENCIA", "FELICITACION", "DENUNCIA", "TUTELA", "SOLICITUD"])
    lista("TIPO DOCUMENTO", sorted(set(DOCS.values())))
    lista("TIPO SOLICITANTE", ["USUARIO", "FAMILIAR", "ACUDIENTE", "COLABORADOR", "OTRO"])
    lista("POBLACIÓN DIFERENCIAL", ["No aplica", "Gestante", "Menor de edad", "Adulto mayor", "Discapacidad", "Víctima del conflicto", "Étnica",
                                    "Indígena", "Afrodescendiente", "Migrante", "LGBTIQ+", "Otro"])
    lista("ESTADO", ["Recibida", "En análisis", "En gestión", "Respondida - Cerrada"])

    def hoja_tabla(nombre, cols, filas):
        if nombre in wb.sheetnames:
            del wb[nombre]
        h = wb.create_sheet(nombre)
        h.append(cols)
        for c in range(1, len(cols) + 1):
            h.cell(row=1, column=c).font = Font(bold=True, color="FFFFFF"); h.cell(row=1, column=c).fill = PatternFill("solid", fgColor="006081")
        for f in filas:
            h.append(f)
        h.freeze_panes = "A2"
        return h
    hf = hoja_tabla("Festivos", ["FECHA", "DESCRIPCIÓN"], [[dt.datetime.strptime(d, "%Y-%m-%d"), n] for d, n in B["fest"]])
    for r in range(2, hf.max_row + 1):
        hf.cell(row=r, column=1).number_format = "dd/mm/yyyy"
    hoja_tabla("Categorias_Correo", B["catCols"], B["cats"])
    hoja_tabla("Entidades_Correo", B["entCols"], B["ents"])
    # Directorio: columnas de reglas en Responsables
    hr = wb["Responsables"]
    for i, t in enumerate(B["resp"]):
        hr.cell(row=4, column=8 + i, value=t).font = Font(bold=True)
    for r in range(5, hr.max_row + 1):
        area = norm(hr.cell(row=r, column=2).value)
        if not area:
            continue
        for patron, servs, palabras in B["dir"]:
            if re.search(patron, area):
                hr.cell(row=r, column=8, value=servs); hr.cell(row=r, column=10, value=palabras)
                break
    # Mapeo del formulario QR actual (sus preguntas tal como aparecen en la hoja de respuestas)
    hm = wb["Mapeo_Formulario"]
    for r in range(5, hm.max_row + 1):
        hm.cell(row=r, column=1, value=None); hm.cell(row=r, column=2, value=None)
    mapa = [("Usted es:", "tipoSolicitante"), ("Su opinión corresponde a:", "tipoPqrs"), ("Tipo de identificación", "tipoDocSolicitante"),
            ("Numero de identificación", "numDocSolicitante"), ("Nombre del paciente", "nombreSolicitante"), ("Teléfono", "telefono"),
            ("Dirección", "direccion"), ("Correo electronico", "correo"), ("Edad", "edad"), ("Sexo", "sexo"), ("EPS", "eps"), ("Régimen", "regimen"),
            ("Servicio a la que va vinculada su opinión", "servicio"), ("Sede de la institución donde consulto", "sede"),
            ("Descripción de su opinión", "descripcion"), ("Población Diferencial (Si aplica)", "poblacion")]
    for i, (q, c) in enumerate(mapa):
        hm.cell(row=5 + i, column=1, value=q); hm.cell(row=5 + i, column=2, value=c)
    # la hoja de respuestas de la plantilla se elimina: al vincular el formulario Google crea la suya
    if "Respuestas de formulario 1" in wb.sheetnames:
        del wb["Respuestas de formulario 1"]
    hv = hoja_tabla("Migración_Revisar", ["RADICADO", "FECHA DE RADICACIÓN", "TIPO", "SEDE", "ESTADO", "QUÉ HACER"], revisar)
    for r in range(2, hv.max_row + 1):
        hv.cell(row=r, column=2).number_format = "dd/mm/yyyy"
    if "LÉEME" in wb.sheetnames:
        le = wb["LÉEME"]
        le["A1"] = "SISTEMA DE GESTIÓN DE PQRS v8 — MiRed Barranquilla IPS"
        le["A2"] = ("Consolidado 2026 migrado el " + HOY.strftime("%d/%m/%Y") + ". Se gestiona desde la plataforma web; esta hoja es el respaldo. "
                    "Radicado único SIAU-AAAA-MM-NNNN para todo. Los casos que no tenían radicado (felicitaciones y respuestas del QR) recibieron uno nuevo en orden cronológico; "
                    "los del QR que no estaban en el histórico se listan en la hoja Migración_Revisar.")

    destino = salida / ("PQRS_Consolidado_v8_2026_" + HOY.strftime("%Y%m%d") + ".xlsx")
    wb.save(destino)

    # ---- informe (sin datos personales)
    por_tipo = collections.Counter(x["f"][C["TIPO_PQRS"] - 1] for x in registros)
    por_mes = collections.Counter(x["f"][C["FECHA_RADICACION"] - 1].strftime("%Y-%m") for x in registros if x["f"][C["FECHA_RADICACION"] - 1])
    por_estado = collections.Counter(x["f"][C["ESTADO"] - 1] for x in registros if x["f"][C["TIPO_PQRS"] - 1] != "FELICITACION")
    lineas = ["# Informe de migración del histórico 2026", "", "Generado el " + HOY.strftime("%d/%m/%Y %H:%M") + " · libro: `" + destino.name + "`", "",
              "| Concepto | Valor |", "|---|---|"]
    lineas += ["| %s | %s |" % (k, v) for k, v in informe.items()]
    lineas += ["", "## Por tipo", "", "| Tipo | Registros |", "|---|---|"] + ["| %s | %d |" % (k, v) for k, v in por_tipo.most_common()]
    lineas += ["", "## Por mes de radicación", "", "| Mes | Registros |", "|---|---|"] + ["| %s | %d |" % (k, por_mes[k]) for k in sorted(por_mes)]
    lineas += ["", "## Estado de las PQRS (sin felicitaciones)", "", "| Estado | Registros |", "|---|---|"] + ["| %s | %d |" % (k, v) for k, v in por_estado.most_common()]
    lineas += ["", "## Sedes que no coincidieron con la lista oficial", ""] + (["- «%s» (%d)" % (k, v) for k, v in sedes_sin_mapa.most_common()] or ["- Ninguna"])
    lineas += ["", "## Corte de la importación del formulario", "",
               "Config B20 = " + (ultima_marca.strftime("%d/%m/%Y %H:%M:%S") if ultima_marca else "—") +
               ". Al vincular el formulario QR al consolidado nuevo solo se importarán las respuestas posteriores a esa hora."]
    (salida / "Informe_Migracion_2026.md").write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print("\n".join(lineas))
    print("\nLibro: " + str(destino))

if __name__ == "__main__":
    main()
