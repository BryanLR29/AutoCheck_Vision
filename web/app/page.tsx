"use client";

import { useDetecciones } from "@/hooks/use-detecciones";
import { useStats } from "@/hooks/use-stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeteccionesPorDiaChart } from "@/components/dashboard/detecciones-por-dia-chart";
import { DeteccionesPorHoraChart } from "@/components/dashboard/detecciones-por-hora-chart";
import { UltimasDetecciones } from "@/components/dashboard/ultimas-detecciones";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";

export default function DashboardPage() {
  const { detecciones, loading, error } = useDetecciones();
  const { stats, porDia, porHora } = useStats(detecciones);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              Asegúrate de haber configurado correctamente las variables en <code className="rounded bg-muted px-1 py-0.5">.env.local</code>{" "}
              con las credenciales de Firebase Web SDK.
            </p>
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <Settings className="h-4 w-4" />
          <AlertTitle>Pasos para configurar</AlertTitle>
          <AlertDescription>
            <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Abrir Firebase Console → Configuración del proyecto → Tus apps → Web</li>
              <li>Copiar los valores de <code className="rounded bg-muted px-1 py-0.5">apiKey</code>, <code className="rounded bg-muted px-1 py-0.5">authDomain</code>, <code className="rounded bg-muted px-1 py-0.5">projectId</code>, etc.</li>
              <li>Pegarlos en <code className="rounded bg-muted px-1 py-0.5">web/.env.local</code> con el prefijo <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_FIREBASE_</code></li>
              <li>Reglas de Firestore: asegúrate de que permitan lectura:</li>
            </ol>
            <pre className="mt-2 rounded bg-muted p-3 text-xs text-muted-foreground">
              {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read: true;\n      allow write: if false; // solo escritura desde Python\n    }\n  }\n}`}
            </pre>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DeteccionesPorDiaChart data={porDia} loading={loading} />
        <DeteccionesPorHoraChart data={porHora} loading={loading} />
      </div>
      <UltimasDetecciones detecciones={detecciones} loading={loading} />
    </div>
  );
}
