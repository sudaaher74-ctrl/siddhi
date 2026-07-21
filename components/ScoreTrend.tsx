"use client";

import { useState } from "react";
import { scoreTrendData } from "@/lib/data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const PERIODS = ["D", "W", "M", "Y"] as const;

export default function ScoreTrend() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("W");

  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 flex flex-col">
      <div className="flex items-center sm:items-baseline justify-between sm:justify-start gap-2 sm:gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid whitespace-nowrap">Score trend</h2>
        <div className="text-[11px] text-black/40 hidden sm:block">avg per 36-arrow block</div>
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
          <AreaChart data={scoreTrendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="session" hide />
            <YAxis 
              domain={[8.0, 9.5]} 
              ticks={[8.0, 8.5, 9.0, 9.5]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(0,0,0,0.35)", fontSize: 9, fontFamily: "var(--font-mono), monospace" }}
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
          <span className="text-accent-soft font-semibold">9.34</span> this week
        </span>
        <span className="hidden sm:inline">
          <span className="text-text-mid font-semibold">9.11</span> 30-day avg
        </span>
        <span className="sm:ml-auto text-green font-semibold">▲ 2.1% wk / wk</span>
      </div>
    </div>
  );
}
