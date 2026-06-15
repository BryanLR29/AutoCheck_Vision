"use client";

import { motion } from "framer-motion";
import { useDetecciones } from "@/hooks/use-detecciones";
import { DeteccionesTable } from "@/components/detecciones/detecciones-table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";

export default function DeteccionesPage() {
  const { detecciones, loading, error } = useDetecciones();

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
            <p className="text-sm">{error}</p>
          </AlertDescription>
        </Alert>
        <Alert variant="warning" className="border-amber-500/20">
          <Settings className="h-4 w-4" />
          <AlertTitle>Posibles causas</AlertTitle>
          <AlertDescription>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Variables de entorno no configuradas en <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code></li>
              <li>Reglas de Firestore no permiten lectura</li>
              <li>La colección <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">detecciones</code> no existe o está vacía</li>
            </ul>
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
      <DeteccionesTable detecciones={detecciones} loading={loading} />
    </motion.div>
  );
}
