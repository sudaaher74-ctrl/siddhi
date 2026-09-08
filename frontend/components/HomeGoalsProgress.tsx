"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { Target, Plus, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Goal {
  _id?: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  progress: number;
  completed: boolean;
}

export default function HomeGoalsProgress() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await apiFetch<Goal[]>("/api/goals");
        setGoals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch goals for dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">
            Active Goals
          </h2>
        </div>
        <Link
          href="/goals"
          className="text-[11px] font-bold text-accent hover:text-accent-hover flex items-center gap-0.5 uppercase tracking-wider"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-6 text-xs text-text-dim">
          Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 my-auto">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-2.5">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No active goals yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
            Set target scores, arrow volume, or tournament targets to track your growth.
          </p>
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Goal</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {goals.slice(0, 3).map((goal, idx) => {
            const progress = Math.min(100, Math.max(0, Number(goal.progress) || 0));
            return (
              <div key={goal._id || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    {goal.completed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">
                      {goal.title}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] flex-shrink-0">
                    {goal.current} / {goal.target} ({progress}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      goal.completed
                        ? "bg-emerald-500"
                        : "bg-accent"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
