"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/detecciones": "Detecciones",
};

export function Header() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "AutoCheck";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
