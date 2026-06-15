"use client";

import { useDetecciones } from "@/hooks/use-detecciones";
import { DeteccionesTable } from "@/components/detecciones/detecciones-table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";

export default function DeteccionesPage() {
  const { detecciones, loading, error } = useDetecciones();

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              Verifica la configuración de Firebase en <code className="rounded bg-muted px-1 py-0.5">.env.local</code>
            </p>
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <Settings className="h-4 w-4" />
          <AlertTitle>Posibles causas</AlertTitle>
          <AlertDescription>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Las variables de entorno no están configuradas</li>
              <li>Las reglas de Firestore no permiten lectura</li>
              <li>El proyecto de Firebase no existe o está deshabilitado</li>
              <li>La colección <code className="rounded bg-muted px-1 py-0.5">detecciones</code> no tiene documentos</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeteccionesTable detecciones={detecciones} loading={loading} />
    </div>
  );
}
