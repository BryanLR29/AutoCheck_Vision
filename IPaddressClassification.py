
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

ESP32_URL         = "http://192.168.100.18/cam-hi.jpg"
CAMARA_ID         = "ESP32_CAM_01"
MINUTOS_DUPLICADO = 5
CONFIANZA_MINIMA  = 0.40


# MODELOS
print("[INFO] Cargando modelo YOLOv8...")
model = YOLO("models/best.pt")

print("[INFO] Inicializando EasyOCR...")
reader = easyocr.Reader(["es", "en"], gpu=False)

registro_local: dict[str, datetime] = {}


# OCR
LETRA_A_NUMERO = str.maketrans("OIZSBEQG", "01258360")
SOLO_LETRAS    = re.compile(r'[^A-Z]')
SOLO_NUMEROS   = re.compile(r'[^0-9]')

def limpiar_letras(s: str) -> str:
    s = s.translate(str.maketrans("0125836", "OIZSBEQ"))
    return SOLO_LETRAS.sub('', s)

def limpiar_numeros(s: str) -> str:
    s = s.translate(LETRA_A_NUMERO)
    return SOLO_NUMEROS.sub('', s)

def corregir_placa(texto: str) -> str:
    texto = re.sub(r'[^A-Z0-9\-]', '', texto.upper())

    # Fix: I al inicio casi siempre es T en placas mexicanas
    if re.match(r'^I[A-Z]{2}', texto):
        texto = 'T' + texto[1:]

    puro = texto.replace('-', '')
    correcciones = []

    if len(puro) == 7:
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:6])
        l2 = limpiar_letras(puro[6:7])
        if len(l1)==3 and len(n1)==3 and len(l2)==1:
            correcciones.append(f"{l1}-{n1}-{l2}")

    if len(puro) == 7:
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:7])
        if len(l1)==3 and len(n1)==4:
            correcciones.append(f"{l1}-{n1}")

    if len(puro) == 6:
        n1 = limpiar_numeros(puro[0:3])
        l1 = limpiar_letras(puro[3:6])
        if len(n1)==3 and len(l1)==3:
            correcciones.append(f"{n1}-{l1}")

    if len(puro) == 7:
        n1 = limpiar_numeros(puro[0:2])
        l1 = limpiar_letras(puro[2:5])
        n2 = limpiar_numeros(puro[5:7])
        if len(n1)==2 and len(l1)==3 and len(n2)==2:
            correcciones.append(f"{n1}-{l1}-{n2}")

    if len(puro) == 6:
        l1 = limpiar_letras(puro[0:3])
        n1 = limpiar_numeros(puro[3:6])
        if len(l1)==3 and len(n1)==3:
            correcciones.append(f"{l1}-{n1}")

    for c in correcciones:
        if es_placa_valida(c):
            return c

    return texto


# VALIDACIÓN

PATRONES_PLACA = re.compile(
    r'^[A-Z]{3}-\d{4}$|'
    r'^[A-Z]{3}-\d{3}-[A-Z]$|'
    r'^[A-Z]{3}-\d{3}$|'
    r'^\d{3}-[A-Z]{3}$|'
    r'^\d{2}-[A-Z]{3}-\d{2}$|'
    r'^[A-Z]{3}\d{2,4}$|'
    r'^\d{3}[A-Z]{3}$|'
    r'^G\d{3}-[A-Z]{3}$'
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
    patron = re.compile(
        r'[A-Z]{3}-\d{3}-[A-Z]|'
        r'[A-Z]{3}-\d{4}|'
        r'[A-Z]{3}-\d{3}|'
        r'\d{3}-[A-Z]{3}|'
        r'\d{2}-[A-Z]{3}-\d{2}|'
        r'[A-Z]{3}\d{4}|'
        r'[A-Z]{3}\d{3}'
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


