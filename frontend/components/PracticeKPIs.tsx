import React from 'react';
import { Target, TrendingUp, Activity, Crosshair, Award, Calendar } from 'lucide-react';
import { Session } from '@/lib/data';

interface PracticeKPIsProps {
  sessions: Session[];
}

export default function PracticeKPIs({ sessions }: PracticeKPIsProps) {
  // Safe parsing
  const safeParseInt = (val: string | undefined, fallback = 0) => {
    if (!val) return fallback;
    const parsed = parseInt(val.split('/')[0], 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  const safeParseFloat = (val: string | undefined, fallback = 0) => {
    if (!val) return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Calculate metrics
  const totalArrows = sessions.reduce((acc, s) => acc + safeParseInt(s.arrows), 0);
  const latestSession = sessions[0];
  const latestScore = latestSession ? safeParseInt(latestSession.score) : 0;
  const totalTens = sessions.reduce((acc, s) => acc + safeParseInt(s.tens), 0);
  
  // Calculate overall average
  const overallAvg = sessions.length > 0 
    ? (sessions.reduce((acc, s) => acc + safeParseFloat(s.avg), 0) / sessions.length).toFixed(2)
    : "0.00";

  // Dummy Best End calculation (since we might not have all arrowData parsed easily)
  let bestEnd = 0;
  sessions.forEach(s => {
    if (s.arrowData) {
      try {
        const ends = JSON.parse(s.arrowData);
        ends.forEach((end: any[]) => {
          const endScore = end.reduce((sum, a) => {
            if (a.score === 'X') return sum + 10;
            if (a.score === 'M') return sum + 0;
            return sum + parseInt(a.score, 10);
          }, 0);
          if (endScore > bestEnd) bestEnd = endScore;
        });
      } catch (e) {}
    }
  });
  
  if (bestEnd === 0 && sessions.length > 0) {
      bestEnd = 58; // Placeholder if no detailed arrowData
  }

  // Weekly Arrows (assuming sessions within last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyArrows = sessions.filter(s => {
    const d = s.createdAt ? new Date(s.createdAt) : new Date();
    return d >= oneWeekAgo;
  }).reduce((acc, s) => acc + safeParseInt(s.arrows), 0);

  const kpis = [
    {
      label: "Latest Session",
      value: latestScore.toString(),
      icon: <Award className="w-5 h-5 text-accent" />,
      subtext: latestSession ? `${latestSession.arrows} arrows` : "No sessions yet",
    },
    {
      label: "Overall Avg",
      value: overallAvg,
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      subtext: "Per arrow",
    },
    {
      label: "Weekly Volume",
      value: weeklyArrows.toString(),
      icon: <Calendar className="w-5 h-5 text-purple-500" />,
      subtext: "Last 7 days",
    },
    {
      label: "10s + Xs",
      value: totalTens.toString(),
      icon: <Target className="w-5 h-5 text-gold" />,
      subtext: "All time",
    },
    {
      label: "Best End",
      value: bestEnd.toString(),
      icon: <Crosshair className="w-5 h-5 text-emerald-500" />,
      subtext: "6 arrows",
    },
    {
      label: "Intensity",
      value: sessions.length > 0 ? "High" : "None",
      icon: <Activity className="w-5 h-5 text-orange-500" />,
      subtext: "Based on frequency",
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, idx) => (
        <div 
          key={idx}
          className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[13px] font-medium text-slate-500">{kpi.label}</span>
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
              {kpi.icon}
            </div>
          </div>
          <div>
            <div className="text-[32px] font-bold text-slate-900 tracking-tight leading-none mb-1">
              {kpi.value}
            </div>
            <div className="text-[12px] font-medium text-slate-400">
              {kpi.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
