import React from "react";
import { CheckCircle2, Circle, Target } from "lucide-react";

export default function GoalTracker() {
  const goals = [
    {
      title: "Reach 660 Average in 70m",
      progress: 85,
      target: "660",
      current: "654",
      deadline: "Aug 2026",
      completed: false
    },
    {
      title: "Shoot 10,000 Practice Arrows",
      progress: 60,
      target: "10k",
      current: "6.2k",
      deadline: "Dec 2026",
      completed: false
    },
    {
      title: "Qualify for State Team",
      progress: 100,
      target: "Top 4",
      current: "Rank 3",
      deadline: "May 2026",
      completed: true
    }
  ];

  return (
    <div className="bg-panel border border-border rounded-[14px] p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-text">Season Goals</h3>
        <button className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-[12px] font-semibold transition-colors">
          Add Goal
        </button>
      </div>
      
      <div className="flex flex-col gap-5">
        {goals.map((goal, i) => (
          <div key={i} className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors ${goal.completed ? 'bg-accent/5 border-accent/20' : 'bg-black/5 border-black/5'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-black/30 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`text-[14px] font-semibold ${goal.completed ? 'text-black line-through opacity-70' : 'text-black'}`}>
                    {goal.title}
                  </h4>
                  <div className="text-[12px] text-text-dim flex items-center gap-2 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                    Target: {goal.target} (Current: {goal.current}) • By {goal.deadline}
                  </div>
                </div>
              </div>
              <div className="text-[13px] font-bold text-black/70">
                {goal.progress}%
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-white/40 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${goal.completed ? 'bg-accent' : 'bg-gradient-to-r from-accent to-accent-soft'}`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
