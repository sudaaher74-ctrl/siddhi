import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ArcherX AI — Dashboard",
  description: "Elite archery self-tracking: scores, grouping, AI coaching.",
};

import GoogleAuthProviderWrapper from "@/components/GoogleAuthProviderWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${plexMono.variable} bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(255,90,78,0.07),transparent_60%),var(--surface)] text-text`}>
        <GoogleAuthProviderWrapper>
          <div className="flex flex-col lg:flex-row gap-[14px] p-[14px] pb-[80px] lg:pb-[14px] min-h-screen">
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            <main className="flex-1 min-w-0 flex flex-col gap-[12px]">
              {children}
            </main>
          </div>
          <MobileNav />
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
