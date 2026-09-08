"use client";

import Card from "@/components/ui/Card";
import { Award, Star, Flame, Trophy, Target, Shield } from "lucide-react";
import { Session } from "@/lib/data";
import Link from "next/link";
import React from "react";

interface RecentAchievementsProps {
  sessions?: Session[];
}

export default function RecentAchievements({ sessions = [] }: RecentAchievementsProps) {
  const achievements: Array<{
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    date: string;
  }> = [];

  if (sessions.length > 0) {
    // 1. First session milestone
    const oldestSession = sessions[sessions.length - 1];
    const oldestDate = oldestSession?.createdAt
      ? new Date(oldestSession.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Recorded";

    achievements.push({
      title: "First Session Logged",
      description: `Inaugural session: ${oldestSession.name || "Training Round"}.`,
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      date: oldestDate,
    });

    // 2. High score / 300+ club
    const maxScoreSession = [...sessions].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
    )[0];
    const maxScore = Number(maxScoreSession?.score) || 0;

    if (maxScore >= 300) {
      const bestDate = maxScoreSession?.createdAt
        ? new Date(maxScoreSession.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Latest";
      achievements.push({
        title: "300+ Club",
        description: `Scored ${maxScore} pts in ${maxScoreSession.bow || "scoring round"}.`,
        icon: Trophy,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        date: bestDate,
      });
    }

    // 3. Arrow volume milestone
    const totalArrows = sessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);
    if (totalArrows >= 100) {
      achievements.push({
        title: "Century Club",
        description: `Passed 100 lifetime arrows (${totalArrows} total).`,
        icon: Shield,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        date: "Milestone",
      });
    }

    // 4. Tens & Xs milestone
    const totalTens = sessions.reduce((sum, s) => sum + (Number(s.tens) || 0), 0);
    if (totalTens >= 10) {
      achievements.push({
        title: "Gold Collector",
        description: `Recorded ${totalTens} tens and inner-Xs.`,
        icon: Star,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        date: "Active",
      });
    }

    // 5. Check for perfect end in arrowData if present
    let hasPerfectEnd = false;
    for (const s of sessions) {
      if (s.arrowData) {
        try {
          const ends = JSON.parse(s.arrowData);
          if (Array.isArray(ends)) {
            for (const end of ends) {
              if (Array.isArray(end) && end.length === 6) {
                const isAllTen = end.every((a: unknown) => {
                  const val = typeof a === "object" && a !== null && "score" in a
                    ? (a as { score: unknown }).score
                    : a;
                  return val === "10" || val === "X";
                });
                if (isAllTen) {
                  hasPerfectEnd = true;
                  break;
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
      if (hasPerfectEnd) break;
    }

    if (hasPerfectEnd) {
      achievements.push({
        title: "Perfect End",
        description: "Landed 60/60 points across a 6-arrow end.",
        icon: Flame,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        date: "Verified",
      });
    }
  }

  return (
    <Card className="flex flex-col h-full bg-surface border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <Award className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">
          Recent Achievements
        </h2>
      </div>

      {achievements.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background border border-dashed border-border rounded-xl">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-text-dim mb-2">
            <Trophy className="w-5 h-5 opacity-60" />
          </div>
          <h4 className="text-xs font-bold text-text mb-1">No Achievements Yet</h4>
          <p className="text-[11px] text-text-dim max-w-[200px] mb-3">
            Record your sessions to unlock milestones like First Session, 300+ Club, and Gold Collector.
          </p>
          <Link
            href="/score-entry"
            className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
          >
            <span>Record Live Session</span>
            <span>&rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {achievements.slice(0, 4).map((ach, i) => {
            const Icon = ach.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl"
              >
                <div className={`p-2 rounded-lg ${ach.bg} ${ach.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text leading-tight truncate">
                    {ach.title}
                  </h4>
                  <p className="text-[11px] text-text-dim mt-0.5 truncate">
                    {ach.description}
                  </p>
                </div>
                <div className="text-[10px] font-medium text-text-dim/70 uppercase tracking-wider flex-shrink-0">
                  {ach.date}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
