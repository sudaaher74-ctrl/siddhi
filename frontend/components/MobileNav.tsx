"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, LineChart, Menu, X, Crosshair, Wrench, LogOut, ShieldCheck, MessageSquare, Calendar, Award } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/context/ProfileContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { openProfile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    // Clears the httpOnly cookie server-side.
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };


  const moreNav = [
    { label: "Practice", href: "/practice", icon: Crosshair },
    { label: "Monthly Log", href: "/monthly-log", icon: Calendar },
    { label: "Equipment", href: "/equipment", icon: Wrench },
  ];

  return (
    <>
      {/* Slide-up Menu Drawer */}
      <div 
        className={`fixed inset-0 bg-white/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          className={`absolute bottom-16 left-4 right-4 bg-white/95 backdrop-blur-lg border border-border rounded-2xl p-4 transition-transform duration-300 ${menuOpen ? 'translate-y-0' : 'translate-y-8'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-black/5">
            <h3 className="text-[14px] font-bold text-text">Account & Options</h3>
            <button onClick={() => setMenuOpen(false)} className="p-1 bg-black/5 rounded-full text-black/70 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Athlete Profile Quick Card */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openProfile();
            }}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors mb-3 text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-target-red to-[#b71c1c] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              {user?.name
                ? user.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "AT"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">
                {user?.name || "Athlete Profile"}
              </div>
              <div className="text-[11px] text-accent font-semibold flex items-center gap-1">
                <span>View career data & profile details</span>
              </div>
            </div>
          </button>
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
          <div className="mt-4 pt-4 border-t border-black/5">
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors mb-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[12px] font-bold">Admin Dashboard</span>
            </Link>
            <Link
              href="/feedback"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors mb-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[12px] font-bold">Help & Feedback</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[12px] font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {/* 1. Home */}
          <Link
            href="/"
            onClick={() => {
              setMenuOpen(false);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
            }}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all active:scale-95 ${
              pathname === "/" ? "text-accent font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${pathname === "/" ? "bg-accent/10" : ""}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Home</span>
          </Link>

          {/* 2. Scorecard */}
          <Link
            href="/scorecard"
            onClick={() => {
              setMenuOpen(false);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
            }}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all active:scale-95 ${
              pathname === "/scorecard" || pathname.startsWith("/scorecard/")
                ? "text-accent font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${
              pathname === "/scorecard" || pathname.startsWith("/scorecard/") ? "bg-accent/10" : ""
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Scorecard</span>
          </Link>

          {/* 3. Center Elevated Action: Live Score */}
          <Link
            href="/score-entry"
            onClick={() => {
              setMenuOpen(false);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
            }}
            className="flex flex-col items-center -mt-5 group active:scale-90 transition-transform"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
              pathname === "/score-entry"
                ? "bg-accent text-white ring-4 ring-accent/25 scale-105 shadow-accent/30"
                : "bg-slate-900 text-white hover:bg-slate-800 ring-2 ring-white"
            }`}>
              <Target className="w-6 h-6 animate-none" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight mt-1 ${
              pathname === "/score-entry" ? "text-accent" : "text-slate-700"
            }`}>
              Shoot
            </span>
          </Link>

          {/* 4. Analytics / Stats */}
          <Link
            href="/analytics"
            onClick={() => {
              setMenuOpen(false);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
            }}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all active:scale-95 ${
              pathname === "/analytics" ? "text-accent font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${pathname === "/analytics" ? "bg-accent/10" : ""}`}>
              <LineChart className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Stats</span>
          </Link>

          {/* 5. More Menu Drawer */}
          <button 
            type="button"
            onClick={() => {
              setMenuOpen(!menuOpen);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
            }}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all active:scale-95 cursor-pointer ${
              menuOpen ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${menuOpen ? "bg-slate-100" : ""}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
