"use client";

import Card from "@/components/ui/Card";
import { Session } from "@/lib/data";

export default function HomeGoalsProgress({ sessions = [] }: { sessions?: Session[] }) {
  // Mock goals for demo purposes
  const scoreGoal = 9.0;
  const weeklyArrowGoal = 500;
  const monthlyPracticeGoal = 20; // 20 sessions

  const totalArrows = sessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);
  const avg = totalArrows > 0 ? totalScore / totalArrows : 0;
  
  // Progress calculations
  const scoreProgress = Math.min(100, (avg / scoreGoal) * 100);
  
  // For demo, just use total arrows / sessions
  const arrowProgress = Math.min(100, (totalArrows / weeklyArrowGoal) * 100);
  const sessionProgress = Math.min(100, (sessions.length / monthlyPracticeGoal) * 100);

  return (
    <Card className="flex flex-col h-full">
      <h2 className="text-[13px] font-semibold text-text-mid mb-4 uppercase tracking-wider">Goal Progress</h2>
      
      <div className="flex flex-col gap-5 flex-1 justify-center">
        {/* Score Goal */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-text">Avg Score Goal</span>
            <span className="font-mono text-text-dim">{avg.toFixed(1)} / {scoreGoal.toFixed(1)}</span>
          </div>
          <div className="w-full bg-black/5 rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${scoreProgress}%` }}
            />
          </div>
        </div>

        {/* Weekly Arrows */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-text">Weekly Arrows</span>
            <span className="font-mono text-text-dim">{totalArrows} / {weeklyArrowGoal}</span>
          </div>
          <div className="w-full bg-black/5 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${arrowProgress}%` }}
            />
          </div>
        </div>

        {/* Monthly Practice */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-text">Monthly Sessions</span>
            <span className="font-mono text-text-dim">{sessions.length} / {monthlyPracticeGoal}</span>
          </div>
          <div className="w-full bg-black/5 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${sessionProgress}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
