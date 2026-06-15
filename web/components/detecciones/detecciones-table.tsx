"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
import { formatDate, formatTime } from "@/lib/utils";
import { exportToExcel } from "@/services/export-service";
import {
  Search,
  ArrowUpDown,
  FileDown,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface Props {
  detecciones: Deteccion[];
  loading: boolean;
}

type SortField = "placa" | "fecha_hora" | "confianza";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

function getConfidenceVariant(confianza: number) {
  if (confianza >= 80) return "success" as const;
  if (confianza >= 60) return "warning" as const;
  return "secondary" as const;
}

export function DeteccionesTable({ detecciones, loading }: Props) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("fecha_hora");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = [...detecciones];

    if (search.trim()) {
      const q = search.trim().toUpperCase();
      result = result.filter((d) => d.placa.toUpperCase().includes(q));
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
      if (sortField === "placa") cmp = a.placa.localeCompare(b.placa);
      else if (sortField === "confianza") cmp = a.confianza - b.confianza;
      else cmp = a.fecha_hora.localeCompare(b.fecha_hora);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [detecciones, search, sortField, sortDir, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/30" />;
    return (
      <ArrowUpDown className={`h-3 w-3 transition-colors ${sortDir === "asc" ? "rotate-180" : ""} text-primary`} />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select
            value={dateFilter}
            onValueChange={(v) => { setDateFilter(v); setPage(0); }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
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

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead
                className="w-[200px] cursor-pointer select-none"
                onClick={() => toggleSort("placa")}
              >
                <div className="flex items-center gap-1.5">
                  Placa
                  <SortIcon field="placa" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("fecha_hora")}
              >
                <div className="flex items-center gap-1.5">
                  Fecha
                  <SortIcon field="fecha_hora" />
                </div>
              </TableHead>
              <TableHead>Hora</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("confianza")}
              >
                <div className="flex items-center gap-1.5">
                  Confianza
                  <SortIcon field="confianza" />
                </div>
              </TableHead>
              <TableHead className="text-right">Cámara</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <ScanLine className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {search || dateFilter !== "all"
                        ? "Sin resultados"
                        : "No hay detecciones registradas"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {search || dateFilter !== "all"
                        ? "Intenta con otros filtros de búsqueda"
                        : "Las detecciones aparecerán aquí automáticamente"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((det, i) => (
                <TableRow
                  key={det.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell>
                    <span className="font-mono text-sm font-semibold tracking-wide">
                      {det.placa}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(det.fecha_hora)}</TableCell>
                  <TableCell className="text-sm">{formatTime(det.fecha_hora)}</TableCell>
                  <TableCell>
                    <Badge variant={getConfidenceVariant(det.confianza)}>
                      {det.confianza.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {det.camara}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Mostrando {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length} detecciones
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-8 min-w-[80px] items-center justify-center rounded-md bg-muted px-3 text-xs font-medium">
              Página {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
