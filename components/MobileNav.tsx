"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, LineChart, Bot, Menu, X, Crosshair, Wrench, Trophy, Flag } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const mainNav = [
    { label: "Home", href: "/", icon: Home },
    { label: "Score", href: "/score-entry", icon: Target },
    { label: "Stats", href: "/analytics", icon: LineChart },
    { label: "Coach", href: "/ai-coach", icon: Bot },
  ];

  const moreNav = [
    { label: "Practice", href: "/practice", icon: Crosshair },
    { label: "Equipment", href: "/equipment", icon: Wrench },
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
    { label: "Goals", href: "/goals", icon: Flag },
  ];

  return (
    <>
      {/* Slide-up Menu Drawer */}
      <div 
        className={`fixed inset-0 bg-white/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          className={`absolute bottom-16 left-4 right-4 bg-[#0a0c10] border border-border rounded-2xl p-4 transition-transform duration-300 ${menuOpen ? 'translate-y-0' : 'translate-y-8'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-black/5">
            <h3 className="text-[14px] font-bold text-text">More Options</h3>
            <button onClick={() => setMenuOpen(false)} className="p-1 bg-black/5 rounded-full text-black/70 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {moreNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    isActive ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-black/5 border-black/5 text-black/70 hover:bg-black/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#08090c]/95 backdrop-blur-md border-t border-border px-4 py-2 pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[48px] transition-colors ${
                  isActive ? "text-accent" : "text-black/40 hover:text-black/80"
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-accent/10' : ''}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center gap-1 min-w-[48px] transition-colors ${
              menuOpen ? "text-black" : "text-black/40 hover:text-black/80"
            }`}
          >
            <div className={`p-1 rounded-full ${menuOpen ? 'bg-black/10' : ''}`}>
              <Menu className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
