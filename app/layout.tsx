import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ItemTooltipLayer } from "@/components/ItemGrid";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyBlock Stats",
  description: "Hypixel SkyBlock Profil-Statistiken: Skills, Slayer, Dungeons, Gear und Networth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line/70 backdrop-blur-sm sticky top-0 z-40 bg-base/80">
          <div className="mx-auto max-w-[1400px] px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="size-6 rounded-md bg-accent/15 border border-accent/40 grid place-items-center text-accent text-[13px] font-bold">
                S
              </span>
              <span className="font-semibold tracking-tight">
                SkyBlock<span className="text-ink-faint">Stats</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-[13px] text-ink-dim">
              <a
                href="https://api.hypixel.net"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink transition-colors"
              >
                Hypixel API
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <ItemTooltipLayer />
        <footer className="border-t border-line/70 mt-12">
          <div className="mx-auto max-w-[1400px] px-5 py-6 text-[12px] text-ink-faint">
            Nicht mit Hypixel oder Mojang verbunden. Daten aus der offiziellen Hypixel API.
          </div>
        </footer>
      </body>
    </html>
  );
}
