"use client";

import { Search } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/context/ProfileContext";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export default function TopBar({ title = "Dashboard", subtitle }: TopBarProps) {
  const { user } = useUser();
  const { openProfile } = useProfile();
  const athleteName = user?.name || "";
  const initials = athleteName
    ? athleteName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="flex flex-col md:flex-row md:items-center gap-4 md:gap-[12px] sticky top-0 z-50 bg-white/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-transparent">
      <div className="flex justify-between items-start w-full md:w-auto">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="md:hidden flex items-center gap-2">
          {athleteName && (
            <button
              type="button"
              onClick={openProfile}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200/80 active:scale-95 transition-all cursor-pointer"
              title="Click to view full profile & stats"
            >
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                {initials}
              </span>
              <span className="max-w-[100px] truncate">{athleteName}</span>
            </button>
          )}
          <div className="flex items-center gap-[7px] p-[5px_10px] rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold w-max shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseCustom" />
            Live
          </div>
        </div>
      </div>
      <div className="md:ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 px-4 h-[44px] rounded-[12px] bg-slate-50 border border-slate-200 text-slate-500 text-[14px] w-[240px] lg:w-[260px] cursor-pointer hover:border-slate-300 hover:bg-white focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all shadow-xs group">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" /> 
          <input 
            type="text" 
            placeholder="Search sessions..." 
            className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400"
          />
          <span className="ml-auto font-mono font-medium text-[11px] border border-slate-200 bg-white rounded-[6px] px-1.5 py-0.5 text-slate-400 shadow-xs">⌘K</span>
        </div>

        {athleteName && (
          <button
            type="button"
            onClick={openProfile}
            className="hidden md:flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs hover:bg-white hover:border-slate-300 hover:shadow-sm active:scale-98 transition-all cursor-pointer group text-left"
            title="Click to view full profile & stats"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-target-red to-[#b71c1c] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] lg:max-w-[150px] truncate group-hover:text-accent transition-colors">
                {athleteName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {user?.role || "Athlete"}
              </span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}

