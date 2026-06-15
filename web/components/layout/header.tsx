"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const titles: Record<string, { name: string; section: string }> = {
  "/": { name: "Dashboard", section: "Panel principal" },
  "/detecciones": { name: "Detecciones", section: "Historial" },
};

export function Header() {
  const pathname = usePathname();
  const current = titles[pathname] ?? { name: "AutoCheck", section: "" };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>AutoCheck</span>
          <span className="text-[10px] opacity-50">/</span>
          <span>{current.section}</span>
        </div>
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-semibold tracking-tight"
        >
          {current.name}
        </motion.h1>
      </div>
    </header>
  );
}
