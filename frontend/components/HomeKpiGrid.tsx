"use client";

import { Session } from "@/lib/data";
import Card from "@/components/ui/Card";
import { Activity, Target, Crosshair, Award, Zap, Flame } from "lucide-react";

export default function HomeKpiGrid({ sessions = [] }: { sessions?: Session[] }) {
  const totalArrows = sessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);
  const totalTens = sessions.reduce((sum, s) => sum + (parseInt(s.tens) || 0), 0);
  
  const avg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";
  const tenRate = totalArrows > 0 ? Math.round((totalTens / totalArrows) * 100) : 0;
  
  let bestScore = 0;
  sessions.forEach(s => {
    const sScore = parseInt(s.score) || 0;
    if (sScore > bestScore) bestScore = sScore;
  });

  const kpis = [
    { label: "Total Sessions", value: sessions.length.toString(), icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Arrows", value: totalArrows.toString(), icon: Target, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Overall Average", value: avg, icon: Crosshair, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Best Session", value: bestScore.toString(), icon: Award, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "10+X Rate", value: `${tenRate}%`, icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Practice Streak", value: "1d", icon: Flame, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-[12px]">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card className="animate-fadeup !p-4 hover:shadow-md transition-shadow group cursor-default" key={k.label}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${k.bg} ${k.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-bold text-2xl text-text tracking-tighter mb-1">{k.value}</span>
              <span className="text-[11px] font-semibold tracking-wider text-text-dim uppercase">{k.label}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
