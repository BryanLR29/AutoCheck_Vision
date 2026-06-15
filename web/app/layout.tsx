import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCheck — Dashboard",
  description: "Sistema de detección de placas vehiculares",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Sidebar className="hidden lg:flex" />
            <div className="flex-1 lg:pl-64">
              <Header />
              <main className="p-4 lg:p-6">{children}</main>
            </div>
          </div>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
