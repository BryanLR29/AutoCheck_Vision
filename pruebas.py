from ultralytics import YOLO
import cv2

model = YOLO("models/best.pt")

img = cv2.imread("fotoscoches/foto1.jpeg")

results = model(img)

for r in results:

    boxes = r.boxes.xyxy.cpu().numpy()

    # tomar la última detección (placa)
    x1, y1, x2, y2 = map(int, boxes[-1])

    placa = img[y1:y2, x1:x2]

    cv2.imshow("Placa", placa)

    cv2.imwrite("placa_detectada.jpg", placa)

cv2.waitKey(0)
cv2.destroyAllWindows()