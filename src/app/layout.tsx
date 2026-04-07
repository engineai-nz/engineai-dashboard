import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "EngineAI Dashboard | Strategic Operations Centre",
  description: "The autonomous operational nervous system for Engine AI.",
};

export const viewport = {
  themeColor: "#0A0A0A",
};

import { TenantProvider } from "@/features/auth/TenantContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
