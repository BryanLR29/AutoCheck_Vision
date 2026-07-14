
import cv2
import numpy as np
import easyocr
import re
import time
from datetime import datetime, timedelta
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, firestore
import urllib.request
import urllib.error


# CONFIGURACIÓN
cred = credentials.Certificate("autocheck-esp32-cam-firebase-adminsdk-74itm-a8b6949ea7.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

ESP32_URL         = "http://192.168.137.185/cam-hi.jpg"
CAMARA_ID         = "ESP32_CAM_01"
MINUTOS_DUPLICADO = 5
CONFIANZA_MINIMA  = 0.40


# MODELOS
print("[INFO] Cargando modelo YOLOv8...")
model = YOLO("models/best.pt")

print("[INFO] Inicializando EasyOCR...")
reader = easyocr.Reader(["es", "en"], gpu=False)

registro_local: dict[str, datetime] = {}


# OCR — NOM-001-SCT-2-2016: placas mexicanas no usan I, O, Q
LETRA_A_NUMERO = str.maketrans("OIZSBEQG", "01258360")
SOLO_LETRAS    = re.compile(r'[^A-HJ-NP-Z]')   # Excluye I, O, Q
SOLO_NUMEROS   = re.compile(r'[^0-9]')

def limpiar_letras(s: str) -> str:
    """Convierte dígitos que parecen letras; excluye I, O, Q (NOM)."""
    s = s.translate(str.maketrans("0125836", "DLZSBEG"))
    return SOLO_LETRAS.sub('', s)

def limpiar_numeros(s: str) -> str:
    s = s.translate(LETRA_A_NUMERO)
    return SOLO_NUMEROS.sub('', s)

# NOM-001-SCT-2-2016: sustituir I->T, O->D, Q->G en posiciones de letras
_NOM_LETRAS = str.maketrans("IOQ", "TDG")

def _aplicar_nom(texto: str) -> str:
    """Reemplaza I/O/Q por letras válidas solo en posiciones de letras."""
    resultado = []
    for ch in texto:
        if ch.isalpha():
            resultado.append(ch.translate(_NOM_LETRAS))
        else:
            resultado.append(ch)
    return ''.join(resultado)


def corregir_placa(texto: str) -> str:
    texto = re.sub(r'[^A-Z0-9\-]', '', texto.upper())

    # Fix: I al inicio casi siempre es T en placas mexicanas
    if re.match(r'^I[A-Z]{2}', texto):
        texto = 'T' + texto[1:]

    # Si el texto ya viene con guiones y es válido, devolverlo directo
    # (preserva formatos como AAA-00-00 que son ambiguos sin guiones)
    texto_limpio_nom = _aplicar_nom(texto)
    if es_placa_valida(texto_limpio_nom):
        return texto_limpio_nom

    puro = texto.replace('-', '')
    correcciones = []

    # ── 7 caracteres ──────────────────────────────────────────

    if len(puro) == 7:
        # G000-AAA  (gubernamental: G + 3 dígitos + 3 letras)
        if puro[0] in 'G6':  # 6 se confunde con G
            n1 = limpiar_numeros(puro[1:4])
            l1 = limpiar_letras(puro[4:7])
            if len(n1)==3 and len(l1)==3:
                correcciones.append(f"G{n1}-{l1}")

        # AA-0000-A (camión nuevo: 2 letras + 4 dígitos + 1 letra)
        l1 = limpiar_letras(puro[0:2])
        n1 = limpiar_numeros(puro[2:6])
        l2 = limpiar_letras(puro[6:7])
        if len(l1)==2 and len(n1)==4 and len(l2)==1:
            correcciones.append(f"{l1}-{n1}-{l2}")

        # AAA-000-A (particular nuevo: 3 letras + 3 dígitos + 1 letra)
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:6])
        l2 = limpiar_letras(puro[6:7])
        if len(l1)==3 and len(n1)==3 and len(l2)==1:
            correcciones.append(f"{l1}-{n1}-{l2}")

        # AAA-0000  (3 letras + 4 dígitos)
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:7])
        if len(l1)==3 and len(n1)==4:
            correcciones.append(f"{l1}-{n1}")

        # AAA-00-00 (3 letras + 2 dígitos + 2 dígitos)
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:5])
        n2 = limpiar_numeros(puro[5:7])
        if len(l1)==3 and len(n1)==2 and len(n2)==2:
            correcciones.append(f"{l1}-{n1}-{n2}")

        # 00-AAA-00 (2 dígitos + 3 letras + 2 dígitos)
        n1 = limpiar_numeros(puro[0:2])
        l1 = limpiar_letras(puro[2:5])
        n2 = limpiar_numeros(puro[5:7])
        if len(n1)==2 and len(l1)==3 and len(n2)==2:
            correcciones.append(f"{n1}-{l1}-{n2}")

    # ── 6 caracteres ──────────────────────────────────────────

    if len(puro) == 6:
        # Y000AA   (motocicleta: Y + 3 dígitos + 2 letras)
        if puro[0] in 'Y':
            n1 = limpiar_numeros(puro[1:4])
            l1 = limpiar_letras(puro[4:6])
            if len(n1)==3 and len(l1)==2:
                correcciones.append(f"Y{n1}{l1}")

        # AA-0000  (camión: 2 letras + 4 dígitos)
        l1 = limpiar_letras(puro[0:2])
        n1 = limpiar_numeros(puro[2:6])
        if len(l1)==2 and len(n1)==4:
            correcciones.append(f"{l1}-{n1}")

        # 000-AAA  (3 dígitos + 3 letras)
        n1 = limpiar_numeros(puro[0:3])
        l1 = limpiar_letras(puro[3:6])
        if len(n1)==3 and len(l1)==3:
            correcciones.append(f"{n1}-{l1}")

        # AAA-000  (particular clásico: 3 letras + 3 dígitos)
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:6])
        if len(l1)==3 and len(n1)==3:
            correcciones.append(f"{l1}-{n1}")

        # A00-AAA  (CDMX: 1 letra + 2 dígitos + 3 letras)
        l1 = limpiar_letras(puro[0:1])
        n1 = limpiar_numeros(puro[1:3])
        l2 = limpiar_letras(puro[3:6])
        if len(l1)==1 and len(n1)==2 and len(l2)==3:
            correcciones.append(f"{l1}{n1}-{l2}")

    for c in correcciones:
        if es_placa_valida(c):
            return c

    return texto


# VALIDACIÓN

# L = [A-HJ-NP-Z]  (letras válidas en placas MX, sin I/O/Q)
_L = r'[A-HJ-NP-Z]'
PATRONES_PLACA = re.compile(
    rf'^{_L}{{3}}-\d{{3}}-{_L}$|'       # AAA-000-A  particular nuevo
    rf'^{_L}{{3}}-\d{{4}}$|'             # AAA-0000
    rf'^{_L}{{3}}-\d{{2}}-\d{{2}}$|'     # AAA-00-00
    rf'^{_L}{{3}}-\d{{3}}$|'             # AAA-000    particular clásico
    rf'^{_L}\d{{2}}-{_L}{{3}}$|'         # A00-AAA    CDMX
    rf'^{_L}{{2}}-\d{{4}}-{_L}$|'        # AA-0000-A  camión nuevo
    rf'^{_L}{{2}}-\d{{4}}$|'             # AA-0000    camión
    rf'^Y\d{{3}}{_L}{{2}}$|'             # Y000AA     motocicleta
    rf'^\d{{2}}-{_L}{{3}}-\d{{2}}$|'     # 00-AAA-00
    rf'^\d{{3}}-{_L}{{3}}$|'             # 000-AAA
    rf'^G\d{{3}}-{_L}{{3}}$'             # G000-AAA   gubernamental
)

def es_placa_valida(texto: str) -> bool:
    return bool(PATRONES_PLACA.match(texto))


# DUPLICADOS

def es_duplicado(placa: str) -> bool:
    if placa not in registro_local:
        return False
    return (datetime.now() - registro_local[placa]) < timedelta(minutes=MINUTOS_DUPLICADO)


# FIRESTORE

def guardar_en_firestore(placa: str, confianza: float):
    doc = {
        "placa":      placa,
        "confianza":  round(confianza * 100, 2),
        "fecha_hora": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "camara":     CAMARA_ID,
    }
    db.collection("detecciones").add(doc)
    print(f"[FIRESTORE] Guardado: {doc}")

# PREPROCESAMIENTO

def variantes_preprocesamiento(roi: np.ndarray) -> list:
    base = cv2.resize(roi, (400, 120), interpolation=cv2.INTER_CUBIC)
    gris = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

    v1 = clahe.apply(gris)
    v2 = cv2.adaptiveThreshold(gris, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    _, v3 = cv2.threshold(gris, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel_sharp = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    v4 = clahe.apply(cv2.filter2D(gris, -1, kernel_sharp))

    return [v1, v2, v3, v4]


# OCR

ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"

def extraer_subcadena_placa(texto: str) -> str:
    """Extrae la subcadena que más se parece a una placa mexicana.
    Usa [A-Z] (no [A-HJ-NP-Z]) porque el OCR puede leer I/O/Q;
    corregir_placa() se encarga de limpiarlos después.
    Patrones ordenados de más largo/específico a más corto."""
    patron = re.compile(
        # ── 8 chars (con guiones internos) ─────────────────
        r'[A-Z]{3}-\d{2}-\d{2}|'           # AAA-00-00
        r'[A-Z]{2}-\d{4}-[A-Z]|'           # AA-0000-A  camión nuevo
        # ── 7 chars ───────────────────────────────────────
        r'[A-Z]{3}-\d{3}-[A-Z]|'           # AAA-000-A  con guiones
        r'[A-Z]{3}\d{3}[A-Z]|'             # AAA000A    sin guiones
        r'[A-Z]{2}\d{4}[A-Z]|'             # AA0000A    camión nuevo sin guiones
        r'G\d{3}-[A-Z]{3}|'               # G000-AAA   gubernamental
        r'G\d{3}[A-Z]{3}|'                # G000AAA    gubernamental sin guión
        r'[A-Z]{3}-\d{4}|'                # AAA-0000
        r'[A-Z]{3}\d{4}|'                 # AAA0000
        r'\d{2}-[A-Z]{3}-\d{2}|'          # 00-AAA-00
        r'\d{2}[A-Z]{3}\d{2}|'            # 00AAA00
        # ── 6 chars ───────────────────────────────────────
        r'Y\d{3}[A-Z]{2}|'                # Y000AA     motocicleta
        r'[A-Z]{2}-\d{4}|'                # AA-0000    camión
        r'[A-Z]{2}\d{4}(?![A-Z0-9])|'     # AA0000     camión sin guión
        r'[A-Z]\d{2}-[A-Z]{3}|'           # A00-AAA    CDMX
        r'[A-Z]\d{2}[A-Z]{3}|'            # A00AAA     CDMX sin guión
        r'[A-Z]{3}-\d{3}(?!-?[A-Z0-9])|'  # AAA-000    solo si NO sigue más
        r'\d{3}-[A-Z]{3}|'                # 000-AAA
        r'[A-Z]{3}\d{3}(?![A-Z0-9])|'     # AAA000     solo si NO sigue más
        r'\d{3}[A-Z]{3}'                  # 000AAA
    )
    match = patron.search(texto)
    return match.group(0) if match else texto

def ocr_mejor_resultado(variantes: list) -> tuple:
    candidatos = []

    for idx, img in enumerate(variantes):
        try:
            resultados = reader.readtext(img, detail=1, allowlist=ALLOWLIST)
            if not resultados:
                continue

            textos   = [r[1] for r in resultados]
            confs    = [r[2] for r in resultados]
            conf_prom = sum(confs) / len(confs)
            texto_completo = "".join(textos).upper().replace(" ", "")

            texto_extraido = extraer_subcadena_placa(texto_completo)
            if texto_extraido != texto_completo:
                conf_prom = min(conf_prom + 0.2, 1.0)
                texto_completo = texto_extraido

            print(f"  [VAR {idx+1}] '{texto_completo}' conf={conf_prom:.2f}")
            candidatos.append((texto_completo, conf_prom))

        except Exception as e:
            print(f"  [VAR {idx+1}] Error: {e}")

    if candidatos:
        return max(candidatos, key=lambda x: x[1])
    return "", -1.0


# PIPELINE
def detectar_y_leer(img: np.ndarray) -> np.ndarray:
    resultados = model(img, conf=CONFIANZA_MINIMA, iou=0.4, verbose=False)

    for resultado in resultados:
        for box in resultado.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            confianza_yolo  = float(box.conf[0])

            h, w = img.shape[:2]
            pad  = 5
            x1 = max(0, x1-pad); y1 = max(0, y1-pad)
            x2 = min(w, x2+pad); y2 = min(h, y2+pad)

            roi_completo = img[y1:y2, x1:x2]
            if roi_completo.size == 0:
                continue

            alto_roi = roi_completo.shape[0]
            corte    = int(alto_roi * 0.35)
            roi      = roi_completo[corte:, :]
            if roi.shape[0] < 20:
                roi = roi_completo

            print(f"\n[YOLO] Placa detectada | Confianza: {confianza_yolo:.2f}")

            variantes           = variantes_preprocesamiento(roi)
            texto_raw, conf_ocr = ocr_mejor_resultado(variantes)

            if not texto_raw:
                print("[SKIP] OCR sin resultado")
                continue

            texto_corregido = corregir_placa(texto_raw)
            print(f"[OCR]  Raw: '{texto_raw}' → Corregido: '{texto_corregido}'")

            if not es_placa_valida(texto_corregido):
                print(f"[SKIP] '{texto_corregido}' no es formato válido")
                continue

            if es_duplicado(texto_corregido):
                print(f"[SKIP] '{texto_corregido}' detectada recientemente")
                continue

            registro_local[texto_corregido] = datetime.now()
            guardar_en_firestore(texto_corregido, confianza_yolo)

            cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(img, texto_corregido, (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    return img


# LOOP PRINCIPAL

print(f"\n[INFO] AutoCheck v2 iniciado")
print(f"[INFO] Conectando a ESP32-CAM: {ESP32_URL}\n")

while True:
    try:
   
        #frame = cv2.imread("fotoscoches/foto6.jpg")
        req   = urllib.request.urlopen(ESP32_URL, timeout=5)
        arr   = np.asarray(bytearray(req.read()), dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("[WARN] Frame vacío, reintentando...")
            time.sleep(1)
            continue

        frame_procesado = detectar_y_leer(frame)
        cv2.imshow("AutoCheck v2 — ESP32-CAM", frame_procesado)

        if cv2.waitKey(1) & 0xFF == 27:
            print("[INFO] Cerrando...")
            break

    except urllib.error.URLError:
        print(f"[ERROR] ESP32-CAM no responde en {ESP32_URL} — reintentando en 2s...")
        time.sleep(2)

    except KeyboardInterrupt:
        print("[INFO] Interrumpido por el usuario")
        break

    except Exception as e:
        print(f"[ERROR] {e}")
        time.sleep(1)

cv2.destroyAllWindows()


