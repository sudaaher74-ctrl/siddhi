"use client";

import { Session } from "@/lib/data";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import Card from "./ui/Card";
import { useUser } from "@/hooks/useUser";

export default function HeroPerformanceCard({ sessions = [] }: { sessions?: Session[] }) {
  const { user } = useUser();
  const today = new Date().toLocaleDateString();
  const todaysSessions = sessions.filter(s => s.createdAt && new Date(s.createdAt).toLocaleDateString() === today);
  
  const practicedToday = todaysSessions.length > 0;
  const arrowsToday = todaysSessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  
  const latestSession = sessions[0];
  const latestScore = latestSession ? latestSession.score : "0";
  
  const totalArrows = sessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);
  const overallAvg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";

  return (
    <Card className="bg-gradient-to-br from-panel to-panel shadow-sm border border-border/50 relative overflow-hidden p-6 md:p-8">
      {/* Abstract background shape for premium feel */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        
        {/* Left Side: Identity & Status */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-text truncate max-w-[200px] sm:max-w-[300px]">
              {user ? user.name : 'Loading...'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold tracking-wide uppercase">
              Elite Rank
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-text-dim text-sm font-medium">
            <div className={`w-2 h-2 rounded-full ${practicedToday ? 'bg-green-500' : 'bg-orange-400'}`} />
            {practicedToday ? 'Practiced Today' : 'Rest Day'}
            <span className="text-black/20">•</span>
            <span>{practicedToday ? "Keep the momentum going!" : "Time to hit the range."}</span>
          </div>
        </div>

        {/* Middle: Core Metrics */}
        <div className="flex gap-6 md:gap-8 hidden md:flex">
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-text-dim uppercase tracking-wider mb-1">Latest Score</span>
            <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter text-text">{latestScore}</span>
          </div>
          <div className="w-[1px] bg-border my-2" />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-text-dim uppercase tracking-wider mb-1">Overall Avg</span>
            <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter text-text">{overallAvg}</span>
          </div>
          <div className="w-[1px] bg-border my-2" />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-text-dim uppercase tracking-wider mb-1">Arrows Today</span>
            <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter text-text">{arrowsToday}</span>
          </div>
        </div>

        {/* Mobile metrics layout */}
        <div className="flex md:hidden w-full gap-4 justify-between bg-surface rounded-xl p-4 border border-border">
           <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Latest</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-text">{latestScore}</span>
          </div>
          <div className="w-[1px] bg-border" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Avg</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-text">{overallAvg}</span>
          </div>
          <div className="w-[1px] bg-border" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Today</span>
            <span className="text-2xl font-mono font-bold tracking-tighter text-text">{arrowsToday}</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-2 md:mt-0">
          <Link href="/practice" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold text-[14px] rounded-xl hover:bg-accent-hover transition-colors shadow-sm hover:shadow-md">
            Continue Practice
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/score-entry" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface text-text font-semibold text-[14px] rounded-xl hover:bg-background border border-border transition-colors">
            <Plus className="w-4 h-4" />
            Log Score
          </Link>
        </div>

      </div>
    </Card>
  );
}
