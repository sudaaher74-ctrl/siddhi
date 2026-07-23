"use client";

import { useState, useMemo } from "react";
import { Session } from "@/lib/data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import Card from "@/components/ui/Card";

const PERIODS = ["D", "W", "M", "Y"] as const;

export default function ScoreTrend({ 
  sessions = [],
  mode = "overall"
}: { 
  sessions?: Session[],
  mode?: "overall" | "daily"
}) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("W");

  // Transform sessions into chart data
  const chartData = useMemo(() => {
    if (mode === "daily") {
      const dailyMap = new Map<string, { totalScore: number; count: number; dateStr: string; timestamp: number }>();
      
      sessions.forEach(s => {
        if (!s.createdAt) return;
        const dateObj = new Date(s.createdAt);
        const dateStr = dateObj.toLocaleDateString();
        const score = parseFloat(s.avg) || 0;
        
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { totalScore: 0, count: 0, dateStr, timestamp: dateObj.getTime() });
        }
        const entry = dailyMap.get(dateStr)!;
        entry.totalScore += score;
        entry.count += 1;
      });
      
      const sortedDaily = Array.from(dailyMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      
      return sortedDaily.map((d, i) => ({
        session: i + 1,
        score: d.totalScore / d.count,
        date: d.dateStr
      }));
    }

    // Overall mode: Sort sessions chronologically for the chart (oldest first)
    const sorted = [...sessions].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    return sorted.map((s, i) => ({
      session: i + 1,
      score: parseFloat(s.avg) || 0,
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Unknown'
    }));
  }, [sessions, mode]);

  // Calculate averages
  const overallAvg = chartData.length > 0 
    ? (chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length).toFixed(2) 
    : "0.00";
    
  const lastSessionAvg = chartData.length > 0 
    ? chartData[chartData.length - 1].score.toFixed(2)
    : "0.00";

  return (
    <Card>
      <div className="flex items-center sm:items-baseline justify-between sm:justify-start gap-2 sm:gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid whitespace-nowrap">Score trend</h2>
        <div className="text-[11px] text-black/40 hidden sm:block">avg per arrow</div>
        <div className="sm:ml-auto flex gap-[2px] bg-black/5 rounded-[7px] p-[2px]">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`font-mono font-medium text-[10px] p-[3px_8px] rounded-[5px] border-0 cursor-pointer transition-colors ${
                p === period ? "bg-accent/25 text-[#ffb0aa]" : "bg-transparent text-black/50"
              }`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[150px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="session" hide />
            <YAxis 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(0,0,0,0.35)", fontSize: 9, fontFamily: "var(--font-mono), monospace" }}
            />
            <Tooltip 
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item ? item.date : `Session ${label}`;
              }}
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: 'var(--tw-shadow-card)' }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Area 
              type="linear" 
              dataKey="score" 
              stroke="var(--accent)" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#trendFill)" 
              animationDuration={1800}
              animationEasing="ease-out"
              activeDot={{ r: 4, fill: "#ffffff", stroke: "var(--accent)", strokeWidth: 2.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-[11px] text-text-dim justify-between sm:justify-start">
        <span>
          <span className="text-accent-soft font-semibold">{lastSessionAvg}</span> latest avg
        </span>
        <span className="hidden sm:inline">
          <span className="text-text-mid font-semibold">{overallAvg}</span> overall avg
        </span>
      </div>
    </Card>
  );
}
