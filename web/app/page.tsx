"use client";

import { motion } from "framer-motion";
import { useDetecciones } from "@/hooks/use-detecciones";
import { useStats } from "@/hooks/use-stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeteccionesPorDiaChart } from "@/components/dashboard/detecciones-por-dia-chart";
import { DeteccionesPorHoraChart } from "@/components/dashboard/detecciones-por-hora-chart";
import { UltimasDetecciones } from "@/components/dashboard/ultimas-detecciones";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { detecciones, loading, error } = useDetecciones();
  const { stats, porDia, porHora } = useStats(detecciones);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Alert variant="destructive" className="border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>
            <p className="mb-2 text-sm">{error}</p>
          </AlertDescription>
        </Alert>
        <Alert variant="warning" className="border-amber-500/20">
          <Settings className="h-4 w-4" />
          <AlertTitle>Configuración requerida</AlertTitle>
          <AlertDescription>
            <ol className="ml-5 list-decimal space-y-1.5 text-sm text-muted-foreground">
              <li>Abrir Firebase Console → Configuración del proyecto → Tus apps → Web</li>
              <li>Copiar los valores de configuración del SDK</li>
              <li>Pegarlos en <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">web/.env.local</code> con prefijo <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_FIREBASE_</code></li>
              <li>Reglas de Firestore deben permitir lectura:</li>
            </ol>
            <pre className="mt-3 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
  }
}`}
            </pre>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <StatsCards stats={stats} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DeteccionesPorDiaChart data={porDia} loading={loading} />
        <DeteccionesPorHoraChart data={porHora} loading={loading} />
      </div>
      <UltimasDetecciones detecciones={detecciones} loading={loading} />
    </motion.div>
  );
}
