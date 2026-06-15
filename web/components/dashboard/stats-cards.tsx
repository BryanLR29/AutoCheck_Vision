"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, TrendingUp, Zap } from "lucide-react";
import { DeteccionStats } from "@/types/deteccion";

interface StatsCardsProps {
  stats: DeteccionStats;
  loading: boolean;
}

const cards = [
  {
    label: "Total Detecciones",
    key: "total" as const,
    icon: Car,
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Detecciones Hoy",
    key: "hoy" as const,
    icon: Zap,
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Última Hora",
    key: "ultimaHora" as const,
    icon: Clock,
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Confianza Promedio",
    key: "confianzaPromedio" as const,
    icon: TrendingUp,
    format: (v: number) => `${v.toFixed(1)}%`,
  },
];

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{card.format(value)}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
