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
        {/* Global ambient atmosphere — grid + noise + gold blur blobs.
            Fixed to the viewport so every route inherits the same brand
            background without each page having to re-declare it. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="ambient-grid absolute inset-0 opacity-40" />
          <div className="page-noise absolute inset-0 opacity-20" />
          <div className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-gold/[0.08] blur-[140px]" />
          <div className="absolute right-[-12rem] top-[18rem] h-[26rem] w-[26rem] rounded-full bg-white/[0.03] blur-[160px]" />
          <div className="absolute bottom-[-12rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[180px]" />
        </div>

        <TenantProvider>
          <div className="relative z-10">{children}</div>
        </TenantProvider>
      </body>
    </html>
  );
}
