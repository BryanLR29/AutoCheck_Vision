"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Deteccion } from "@/types/deteccion";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { exportToExcel } from "@/services/export-service";
import { Download, ArrowUpDown, FileDown } from "lucide-react";

interface Props {
  detecciones: Deteccion[];
  loading: boolean;
}

type SortField = "placa" | "fecha_hora" | "confianza";
type SortDir = "asc" | "desc";

export function DeteccionesTable({ detecciones, loading }: Props) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("fecha_hora");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...detecciones];

    if (search.trim()) {
      const q = search.trim().toUpperCase();
      result = result.filter((d) => d.placa.includes(q));
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (dateFilter) {
        case "today":
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      result = result.filter((d) => new Date(d.fecha_hora) >= cutoff);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "placa") {
        cmp = a.placa.localeCompare(b.placa);
      } else if (sortField === "confianza") {
        cmp = a.confianza - b.confianza;
      } else {
        cmp = a.fecha_hora.localeCompare(b.fecha_hora);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [detecciones, search, sortField, sortDir, dateFilter]);

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Input
            placeholder="Buscar por placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToExcel(filtered)}
          disabled={filtered.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="placa">Placa</SortHeader>
              <SortHeader field="fecha_hora">Fecha</SortHeader>
              <TableHead>Hora</TableHead>
              <SortHeader field="confianza">Confianza</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  {search || dateFilter !== "all"
                    ? "No se encontraron detecciones con los filtros actuales"
                    : "No hay detecciones registradas"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((det) => (
                <TableRow key={det.id}>
                  <TableCell className="font-mono font-semibold">
                    {det.placa}
                  </TableCell>
                  <TableCell>{formatDate(det.fecha_hora)}</TableCell>
                  <TableCell>{formatTime(det.fecha_hora)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        det.confianza >= 80
                          ? "success"
                          : det.confianza >= 60
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {det.confianza.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {detecciones.length} detecciones
      </p>
    </div>
  );
}
