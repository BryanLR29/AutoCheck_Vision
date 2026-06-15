import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Deteccion } from "@/types/deteccion";

const COLLECTION = "detecciones";

export function subscribeDetecciones(
  maxLimit: number,
  onData: (detecciones: Deteccion[]) => void,
  onError: (error: Error) => void
): Unsubscribe | null {
  if (!db) {
    onError(new Error(
      "Firestore no está disponible. Verifica que las variables de entorno NEXT_PUBLIC_FIREBASE_* estén configuradas correctamente en .env.local"
    ));
    return null;
  }

  try {
    const deteccionesRef = collection(db, COLLECTION);
    const q = query(deteccionesRef, orderBy("fecha_hora", "desc"), limit(maxLimit));

    return onSnapshot(
      q,
      (snapshot) => {
        console.log(`[AutoCheck] Snapshot recibido: ${snapshot.size} documentos`);
        const detecciones = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Deteccion
        );
        onData(detecciones);
      },
      (err) => {
        console.error("[AutoCheck] Error en snapshot Firestore:", err);
        onError(new Error(`Error al leer detecciones: ${err.message}`));
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("[AutoCheck] Error al crear query:", e);
    onError(new Error(`Error al conectar con Firestore: ${msg}`));
    return null;
  }
}

export async function fetchAllDetecciones(): Promise<Deteccion[]> {
  if (!db) {
    throw new Error("Firestore no está disponible");
  }

  const deteccionesRef = collection(db, COLLECTION);
  const q = query(deteccionesRef, orderBy("fecha_hora", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Deteccion
  );
}
