export interface Deteccion {
  id: string;
  placa: string;
  confianza: number;
  fecha_hora: string;
  camara: string;
}

export interface DeteccionStats {
  total: number;
  hoy: number;
  ultimaHora: number;
  confianzaPromedio: number;
}

export interface DeteccionPorDia {
  fecha: string;
  count: number;
}

export interface DeteccionPorHora {
  hora: string;
  count: number;
}
