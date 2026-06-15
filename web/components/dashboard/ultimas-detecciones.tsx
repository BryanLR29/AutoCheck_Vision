"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Deteccion } from "@/types/deteccion";
import { formatTime, formatDateShort } from "@/lib/utils";

interface Props {
  detecciones: Deteccion[];
  loading: boolean;
}

export function UltimasDetecciones({ detecciones, loading }: Props) {
  const ultimas = detecciones.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Últimas Detecciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : ultimas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay detecciones registradas
          </p>
        ) : (
          <div className="space-y-1">
            {ultimas.map((det) => (
              <div
                key={det.id}
                className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">
                    {det.placa}
                  </span>
                  <Badge variant="secondary" className="text-[11px]">
                    {det.confianza.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatDateShort(det.fecha_hora)}</div>
                  <div>{formatTime(det.fecha_hora)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
