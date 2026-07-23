"use client";

import Card from "@/components/ui/Card";
import { Session } from "@/lib/data";
import { ArrowRight, BrainCircuit, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AICoachSummary({ sessions = [] }: { sessions?: Session[] }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = sessions;
  // In a real app, these would be generated dynamically based on the session data
  const mainStrength = "Consistent grouping in your last 3 sessions.";
  const areaToImprove = "Your release timing is slightly varying on your 5th arrow.";
  const recommendation = "Focus on a clean follow-through and holding your anchor point for an extra 1 second today.";

  return (
    <Card className="flex flex-col h-full bg-surface border-accent/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <BrainCircuit className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">AI Coach Insight</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="bg-background rounded-xl p-3 border border-border">
          <span className="block text-[10px] font-bold text-text-dim uppercase mb-1">Today&apos;s Focus</span>
          <p className="text-sm text-text font-medium leading-relaxed">{recommendation}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <span className="block text-[10px] font-bold text-text-dim uppercase">Strength</span>
              <p className="text-xs text-text-mid">{mainStrength}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
            <div>
              <span className="block text-[10px] font-bold text-text-dim uppercase">Improvement</span>
              <p className="text-xs text-text-mid">{areaToImprove}</p>
            </div>
          </div>
        </div>
      </div>

      <Link 
        href="/ai-coach" 
        className="mt-4 flex items-center justify-between px-4 py-2.5 bg-accent/5 hover:bg-accent/10 text-accent font-semibold text-xs rounded-xl transition-colors"
      >
        View Full Analysis
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Card>
  );
}
