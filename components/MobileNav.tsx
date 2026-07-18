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
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          className={`absolute bottom-20 left-4 right-4 bg-panel border border-border rounded-2xl p-4 transition-transform duration-300 ${menuOpen ? 'translate-y-0' : 'translate-y-8'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
            <h3 className="text-[15px] font-bold text-text">More Options</h3>
            <button onClick={() => setMenuOpen(false)} className="p-1.5 bg-white/5 rounded-full text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {moreNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                    isActive ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[12px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-panel/90 backdrop-blur-md border-t border-border px-6 py-3 pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[56px] transition-colors ${
                  isActive ? "text-accent" : "text-white/50 hover:text-white/80"
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-accent/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center gap-1 min-w-[56px] transition-colors ${
              menuOpen ? "text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            <div className={`p-1.5 rounded-full ${menuOpen ? 'bg-white/10' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
