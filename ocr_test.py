import easyocr

reader = easyocr.Reader(['en'])

resultado = reader.readtext("placa_detectada.jpg")

for r in resultado:
    print("Texto:", r[1])
    print("Confianza:", round(r[2] * 100, 2), "%")