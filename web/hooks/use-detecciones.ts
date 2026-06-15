"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Deteccion } from "@/types/deteccion";
import { subscribeDetecciones } from "@/services/detecciones-service";

const LIMIT = 100;

export function useDetecciones() {
  const [detecciones, setDetecciones] = useState<Deteccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const handleData = useCallback((data: Deteccion[]) => {
    const currentIds = new Set(data.map((d) => d.id));

    const newIds = new Set(
      [...currentIds].filter((id) => !prevIdsRef.current.has(id))
    );

    if (prevIdsRef.current.size > 0 && newIds.size > 0) {
      for (const det of data) {
        if (newIds.has(det.id)) {
          toast(`Nueva placa detectada: ${det.placa}`, {
            description: `Confianza: ${det.confianza.toFixed(1)}% | Cámara: ${det.camara}`,
          });
        }
      }
    }

    prevIdsRef.current = currentIds;
    setDetecciones(data);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error("[AutoCheck] Error en hook useDetecciones:", err);
    setError(err.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDetecciones(LIMIT, handleData, handleError);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleData, handleError]);

  return { detecciones, loading, error };
}
