"use client";

import Card from "@/components/ui/Card";
import { Target, Plus, BrainCircuit, LineChart, Wrench, Trophy } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { name: "Start Practice", href: "/practice", icon: Target, color: "text-accent", bg: "bg-accent/10" },
    { name: "Score Entry", href: "/score-entry", icon: Plus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "AI Coach", href: "/ai-coach", icon: BrainCircuit, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "Analytics", href: "/analytics", icon: LineChart, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Equipment", href: "/equipment", icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "Goals", href: "/goals", icon: Trophy, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <Card className="bg-surface border-border">
      <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link href={action.href} key={i}>
              <div className="flex flex-col items-center justify-center p-4 bg-background border border-border rounded-xl hover:bg-black/5 hover:border-black/10 transition-all group">
                <div className={`p-3 rounded-xl mb-3 ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-text uppercase tracking-wide">{action.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
