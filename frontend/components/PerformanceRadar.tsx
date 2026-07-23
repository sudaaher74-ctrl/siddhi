"use client";

import { useMemo } from "react";
import { Session } from "@/lib/data";
import Card from "@/components/ui/Card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function PerformanceRadar({ 
  sessions = [],
  mode = "overall"
}: { 
  sessions?: Session[],
  mode?: "overall" | "daily"
}) {
  
  const radarData = useMemo(() => {
    // We will calculate mock stats based on the user's average score since we don't have
    // physical data for focus, consistency, release, etc. from the backend yet.
    // In a real app, these would come from an AI coach analysis or specific metrics.
    
    // Default stats
    let accuracy = 60;
    let consistency = 60;
    let timing = 60;
    let release = 60;
    let focus = 60;
    let endurance = 60;

    if (sessions.length > 0) {
      let relevantSessions = sessions;
      if (mode === "daily") {
        const today = new Date().toLocaleDateString();
        relevantSessions = sessions.filter(s => s.createdAt && new Date(s.createdAt).toLocaleDateString() === today);
      }

      if (relevantSessions.length > 0) {
        let totalAvg = 0;
        let totalTens = 0;
        let totalArrows = 0;
        
        relevantSessions.forEach(s => {
          totalAvg += parseFloat(s.avg) || 0;
          totalTens += parseInt(s.tens) || 0;
          totalArrows += parseInt(s.arrows) || 1;
        });
        
        const avg = totalAvg / relevantSessions.length;
        
        // Score of 10 -> 100%, Score of 8 -> 50%, etc. (Rough formula)
        accuracy = Math.min(100, Math.max(30, (avg - 7) * (100 / 3)));
        
        const tenRate = totalTens / totalArrows;
        consistency = Math.min(100, Math.max(40, tenRate * 200));

        // Other metrics are randomly varied slightly from accuracy for visual interest
        focus = Math.min(100, accuracy + (Math.random() * 20 - 10));
        release = Math.min(100, accuracy + (Math.random() * 10 - 5));
        timing = 75; // Hardcoded simulation
        endurance = Math.max(30, 100 - (totalArrows / 1.5)); // More arrows = less endurance simulation
      }
    }

    return [
      { subject: 'Focus', value: Math.round(focus), fullMark: 100 },
      { subject: 'Accuracy', value: Math.round(accuracy), fullMark: 100 },
      { subject: 'Consistency', value: Math.round(consistency), fullMark: 100 },
      { subject: 'Release', value: Math.round(release), fullMark: 100 },
      { subject: 'Timing', value: Math.round(timing), fullMark: 100 },
      { subject: 'Endurance', value: Math.round(endurance), fullMark: 100 },
    ];
  }, [sessions, mode]);

  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Performance radar</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">
          {mode === "daily" ? "TODAY" : "OVERALL"}
        </div>
      </div>
      
      <div className="w-full h-[210px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="rgba(0,0,0,0.09)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "rgba(0,0,0,0.6)", fontSize: 10, fontFamily: "var(--font-sans), sans-serif" }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: 'var(--tw-shadow-card)' }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Radar 
              name="Performance" 
              dataKey="value" 
              stroke="var(--accent)" 
              strokeWidth={2}
              fill="var(--accent)" 
              fillOpacity={0.4} 
              animationDuration={1500}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto flex gap-3 justify-center text-[10.5px] text-black/50 pt-4">
        <span className="flex items-center gap-[5px]">
          <span className="w-[8px] h-[2px] bg-accent" />
          {mode === "daily" ? "Today's Average" : "Overall Average"}
        </span>
      </div>
    </Card>
  );
}
