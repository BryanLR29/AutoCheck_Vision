"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, TrendingUp, Zap } from "lucide-react";
import { DeteccionStats } from "@/types/deteccion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface StatsCardsProps {
  stats: DeteccionStats;
  loading: boolean;
}

interface CardConfig {
  label: string;
  key: keyof DeteccionStats;
  icon: React.ElementType;
  format: (v: number) => string;
  gradient: string;
  iconBg: string;
}

const cards: CardConfig[] = [
  {
    label: "Total Detecciones",
    key: "total",
    icon: Car,
    format: (v) => v.toLocaleString(),
    gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    iconBg: "bg-indigo-500/10 text-indigo-500",
  },
  {
    label: "Detecciones Hoy",
    key: "hoy",
    icon: Zap,
    format: (v) => v.toLocaleString(),
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-500",
  },
  {
    label: "Última Hora",
    key: "ultimaHora",
    icon: Clock,
    format: (v) => v.toLocaleString(),
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-500",
  },
  {
    label: "Confianza Promedio",
    key: "confianzaPromedio",
    icon: TrendingUp,
    format: (v) => `${v.toFixed(1)}%`,
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-500/10 text-violet-500",
  },
];

function AnimatedCounter({ value, format, enabled }: { value: number; format: (v: number) => string; enabled: boolean }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(value);
      return;
    }

    const start = prevRef.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, enabled]);

  return <>{format(display)}</>;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
          >
            <Card className="group relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]">
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  card.gradient
                )}
              />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="text-2xl font-bold tracking-tight">
                        <AnimatedCounter
                          value={value}
                          format={card.format}
                          enabled={!loading}
                        />
                      </div>
                    )}
                  </div>
                  <div className={cn("rounded-xl p-2.5 transition-colors", card.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
