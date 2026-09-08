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
  
  const hasData = useMemo(() => {
    if (sessions.length === 0) return false;
    if (mode === "daily") {
      const today = new Date().toLocaleDateString();
      return sessions.some((s) => s.createdAt && new Date(s.createdAt).toLocaleDateString() === today);
    }
    return true;
  }, [sessions, mode]);

  const radarData = useMemo(() => {
    if (!hasData) return [];

    let relevantSessions = sessions;
    if (mode === "daily") {
      const today = new Date().toLocaleDateString();
      relevantSessions = sessions.filter(
        (s) => s.createdAt && new Date(s.createdAt).toLocaleDateString() === today
      );
    }

    let totalAvg = 0;
    let totalTens = 0;
    let totalArrows = 0;

    relevantSessions.forEach((s) => {
      totalAvg += Number(s.avg) || 0;
      totalTens += Number(s.tens) || 0;
      totalArrows += Number(s.arrows) || 1;
    });

    const avg = relevantSessions.length > 0 ? totalAvg / relevantSessions.length : 0;
    const accuracy = Math.min(100, Math.max(10, Math.round((avg / 10) * 100)));
    const tenRate = totalArrows > 0 ? totalTens / totalArrows : 0;
    const consistency = Math.min(100, Math.max(10, Math.round(tenRate * 200)));
    const endurance = Math.min(100, Math.max(10, Math.round((totalArrows / 100) * 100)));
    const focus = Math.min(100, Math.max(10, Math.round((accuracy + consistency) / 2)));
    const timing = Math.min(100, Math.max(10, Math.round(accuracy * 0.95)));
    const release = Math.min(100, Math.max(10, Math.round(consistency * 0.9 + accuracy * 0.1)));

    return [
      { subject: "Focus", value: focus, fullMark: 100 },
      { subject: "Accuracy", value: accuracy, fullMark: 100 },
      { subject: "Consistency", value: consistency, fullMark: 100 },
      { subject: "Release", value: release, fullMark: 100 },
      { subject: "Timing", value: timing, fullMark: 100 },
      { subject: "Endurance", value: endurance, fullMark: 100 },
    ];
  }, [sessions, mode, hasData]);

  return (
    <Card>
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Performance radar</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">
          {mode === "daily" ? "TODAY" : "OVERALL"}
        </div>
      </div>

      {!hasData ? (
        <div className="w-full h-[210px] mt-2 flex flex-col items-center justify-center text-center p-4 bg-black/5 rounded-xl border border-dashed border-black/10">
          <p className="text-xs text-text-dim">
            No session data recorded {mode === "daily" ? "today" : "yet"}.
          </p>
          <p className="text-[11px] text-text-dim/70 mt-1">
            Log arrows to generate your multidimensional skill radar.
          </p>
        </div>
      ) : (
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
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  boxShadow: "var(--tw-shadow-card)",
                }}
                itemStyle={{ color: "var(--text)" }}
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
      )}

      <div className="mt-auto flex gap-3 justify-center text-[10.5px] text-black/50 pt-4">
        <span className="flex items-center gap-[5px]">
          <span className="w-[8px] h-[2px] bg-accent" />
          {mode === "daily" ? "Today's Average" : "Overall Average"}
        </span>
      </div>
    </Card>
  );
}
