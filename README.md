# AutoCheck v2 — Sistema de Detección de Placas Vehiculares Mexicanas

AutoCheck v2 es un sistema inteligente de reconocimiento de matrículas automovilísticas (ALPR) diseñado específicamente para el contexto de las placas en México. El sistema captura flujo de video en tiempo real desde una **ESP32-CAM**, procesa las imágenes para detectar las placas mediante **YOLOv8**, optimiza el texto con técnicas avanzadas de Visión Artificial, realiza la extracción con **EasyOCR** y almacena los registros validados en **Firebase Firestore**.

---

##  Características Principales

* **Detección de Objetos en Tiempo Real:** Integración nativa con YOLOv8 utilizando un modelo personalizado (`best.pt`) optimizado para placas mexicanas.
* **Procesamiento Multivariante de Imagen:** Aplica simultáneamente 4 transformaciones visuales (CLAHE, Umbral Adaptativo, Otsu y Enfoque Laplaciano) para garantizar la máxima lectura del OCR bajo cualquier condición de luz.
* **Corrección Heurística de Sintaxis:** Algoritmo personalizado que mapea errores comunes del OCR (como confundir `O` con `0` o `I` con `T`) basándose en los formatos oficiales de la SCT.
* **Filtro Antiduplicados:** Sistema de persistencia temporal en memoria para evitar registrar la misma placa repetidamente en un intervalo configurable (por defecto, 5 minutos).
* **Conectividad IoT:** Consumo optimizado del búfer de imagen HTTP proveniente de la ESP32-CAM.
* **Persistencia en la Nube:** Sincronización inmediata con Firebase Firestore incluyendo metadatos de confianza, ID de cámara y marcas de tiempo.

---

## 🛠️ Arquitectura del Sistema

El pipeline de procesamiento sigue el siguiente flujo de ejecución:

[ ESP32-CAM ] ──(HTTP Stream)──> [ YOLOv8 (Detección) ] ──> [ Recorte de ROI y Limpieza ]
│
[ Firebase Firestore ] <── (Validación) <── [ Corrección y OCR ] <───┘


1. **Captura:** Se decodifica el stream binario de la cámara web mediante `urllib` y `OpenCV`.
2. **Localización:** YOLOv8 encuadra la placa y se genera un recorte dinámico (ROI) omitiendo los bordes innecesarios.
3. **Preprocesamiento:** Se generan 4 variantes de la imagen mejorando el contraste y binarización.
4. **Extracción (OCR):** Se evalúan las variantes con EasyOCR y se selecciona la cadena con el mayor índice de confianza.
5. **Normalización:** Se limpia la cadena mediante expresiones regulares (Regex) bajo los patrones estándar de México.
6. **Almacenamiento:** Si pasa los filtros, se añade la colección a la base de datos NoSQL de Firestore.

---

## 📦 Requisitos e Instalación
Instalar dependencias
Asegúrate de contar con Python 3.9+ instalado. Instala las librerías necesarias ejecutando:

Bash
pip install opencv-python numpy easyocr ultralytics firebase-admin

⚠️ Nota sobre hardware: Este script está configurado inicialmente para ejecutarse en CPU (gpu=False en EasyOCR). Si dispones de una GPU Nvidia con soporte CUDA, puedes cambiar el parámetro a gpu=True para acelerar drásticamente el procesamiento.

3. Credenciales de Firebase
Debes colocar tu archivo de claves privadas de la cuenta de servicio de Firebase en la raíz del proyecto con el siguiente nombre:
autocheck-esp32-cam-firebase-adminsdk-74itm-a8b6949ea7.json

🔧 Configuración del Script
Dentro del código principal puedes modificar las siguientes variables globales según tus necesidades:

Variable	Descripción	Valor por Defecto
ESP32_URL	Dirección IP y endpoint del streaming de la ESP32-CAM.	http://192.168.100.18/cam-hi.jpg
CAMARA_ID	Identificador único de la estación de control.	"ESP32_CAM_01"
MINUTOS_DUPLICADO	Tiempo de espera para volver a registrar la misma placa.	5
CONFIANZA_MINIMA	Umbral mínimo de confianza para el detector YOLOv8.	0.40
📋 Formatos de Placas Soportados (Regex)
El sistema valida las estructuras vehiculares oficiales de la SCT mexicana, entre ellas:

AAA-0000 (Automóviles particulares antiguos/nuevos)

AAA-000-A (Combinaciones específicas estatales)

00-AAA-00 (Formatos de camiones o vehículos de carga)

000-AAA (Motos o remolques)

🏁 Ejecución
Para iniciar el sistema de monitoreo automatizado, simplemente ejecuta:

Bash
python main.py
Para cerrar la ventana de visualización y detener el script, presiona la tecla ESC.
