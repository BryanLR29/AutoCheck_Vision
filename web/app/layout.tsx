import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AutoCheck — Dashboard de Monitoreo",
  description:
    "Sistema inteligente de detección y reconocimiento de placas vehiculares",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Sidebar className="hidden lg:flex" />
            <div className="flex-1 lg:pl-60">
              <Header />
              <main className="p-4 lg:p-6">{children}</main>
            </div>
          </div>
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
