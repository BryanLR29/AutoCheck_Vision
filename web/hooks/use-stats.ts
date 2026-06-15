"use client";

import { useMemo } from "react";
import { Deteccion, DeteccionStats, DeteccionPorDia, DeteccionPorHora } from "@/types/deteccion";
import { isToday, isWithinLastHour } from "@/lib/utils";

export function useStats(detecciones: Deteccion[]) {
  const stats = useMemo<DeteccionStats>(() => {
    const total = detecciones.length;
    const hoy = detecciones.filter((d) => isToday(d.fecha_hora)).length;
    const ultimaHora = detecciones.filter((d) => isWithinLastHour(d.fecha_hora)).length;
    const confianzaPromedio =
      total > 0
        ? detecciones.reduce((sum, d) => sum + d.confianza, 0) / total
        : 0;

    return { total, hoy, ultimaHora, confianzaPromedio };
  }, [detecciones]);

  const porDia = useMemo<DeteccionPorDia[]>(() => {
    const map = new Map<string, number>();
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      });
      map.set(key, 0);
    }

    for (const det of detecciones) {
      const d = new Date(det.fecha_hora);
      const key = d.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      });
      if (map.has(key)) {
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }

    return Array.from(map.entries()).map(([fecha, count]) => ({
      fecha,
      count,
    }));
  }, [detecciones]);

  const porHora = useMemo<DeteccionPorHora[]>(() => {
    const counts = new Array(24).fill(0);

    for (const det of detecciones) {
      const hour = new Date(det.fecha_hora).getHours();
      counts[hour]++;
    }

    return counts.map((count, hour) => ({
      hora: `${hour.toString().padStart(2, "0")}:00`,
      count,
    }));
  }, [detecciones]);

  return { stats, porDia, porHora };
}
