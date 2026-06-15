import * as XLSX from "xlsx";
import { Deteccion } from "@/types/deteccion";

export function exportToExcel(detecciones: Deteccion[]): void {
  const data = detecciones.map((d) => ({
    Placa: d.placa,
    Confianza: `${d.confianza.toFixed(1)}%`,
    "Fecha y Hora": d.fecha_hora,
    Cámara: d.camara,
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detecciones");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `autocheck-detecciones-${today}.xlsx`);
}
