"use client";

import Card from "@/components/ui/Card";
import { Award, Star, Flame, Trophy } from "lucide-react";

export default function RecentAchievements() {
  const achievements = [
    {
      title: "Perfect End",
      description: "Scored 60/60 in a single end.",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      date: "Today"
    },
    {
      title: "7-Day Streak",
      description: "Practiced for 7 consecutive days.",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      date: "2 days ago"
    },
    {
      title: "New Personal Best",
      description: "Overall average exceeded 9.2.",
      icon: Trophy,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      date: "1 week ago"
    }
  ];

  return (
    <Card className="flex flex-col h-full bg-surface border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <Award className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">Recent Achievements</h2>
      </div>

      <div className="flex flex-col gap-3">
        {achievements.map((ach, i) => {
          const Icon = ach.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
              <div className={`p-2 rounded-lg ${ach.bg} ${ach.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-text leading-tight">{ach.title}</h4>
                <p className="text-[11px] text-text-dim mt-0.5">{ach.description}</p>
              </div>
              <div className="text-[10px] font-medium text-text-dim/70 uppercase tracking-wider">
                {ach.date}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
