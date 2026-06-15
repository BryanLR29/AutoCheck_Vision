"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Deteccion } from "@/types/deteccion";
import { formatTime, formatDateShort } from "@/lib/utils";
import { ScanLine } from "lucide-react";

interface Props {
  detecciones: Deteccion[];
  loading: boolean;
}

function getConfidenceVariant(confianza: number) {
  if (confianza >= 80) return "success";
  if (confianza >= 60) return "warning";
  return "secondary";
}

export function UltimasDetecciones({ detecciones, loading }: Props) {
  const ultimas = detecciones.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Últimas detecciones</CardTitle>
          <p className="text-xs text-muted-foreground">
            Las 10 detecciones más recientes
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : ultimas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <ScanLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No hay detecciones
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Las detecciones aparecerán aquí en tiempo real
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {ultimas.map((det, i) => (
                <motion.div
                  key={det.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ScanLine className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <span className="font-mono text-sm font-semibold tracking-wide">
                        {det.placa}
                      </span>
                      <div className="text-[11px] text-muted-foreground">
                        {det.camara}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getConfidenceVariant(det.confianza)}>
                      {det.confianza.toFixed(1)}%
                    </Badge>
                    <div className="hidden text-right text-xs text-muted-foreground sm:block">
                      <div>{formatDateShort(det.fecha_hora)}</div>
                      <div>{formatTime(det.fecha_hora)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
