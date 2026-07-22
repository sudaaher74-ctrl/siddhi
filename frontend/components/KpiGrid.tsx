import { Kpi, Session } from "@/lib/data";
import Card from "@/components/ui/Card";

export default function KpiGrid({ sessions = [] }: { sessions?: Session[] }) {
  // Calculate today's stats
  const today = new Date().toLocaleDateString();
  const todaysSessions = sessions.filter(s => {
    if (!s.createdAt) return false;
    return new Date(s.createdAt).toLocaleDateString() === today;
  });

  const arrowsToday = todaysSessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const scoreToday = todaysSessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);

  // Overall stats
  const totalArrows = sessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);
  const overallAvg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";

  const totalTens = sessions.reduce((sum, s) => sum + (parseInt(s.tens) || 0), 0);
  const tenRate = totalArrows > 0 ? Math.round((totalTens / totalArrows) * 100) : 0;

  const kpis: Kpi[] = [
    { label: "Arrows today", value: arrowsToday.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's score", value: scoreToday.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Overall Avg", value: overallAvg, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "10 + X rate", value: `${tenRate}%`, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Total Sessions", value: sessions.length.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Total Arrows", value: totalArrows.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Practice time", value: `${Math.round(totalArrows * 0.5)}m`, delta: "-", deltaColor: "rgba(0,0,0,.4)" }, // Estimate 30s per arrow
    { label: "Streak", value: "1d", delta: "-", deltaColor: "rgba(0,0,0,.4)" }, // Simplified streak
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-[10px]">
      {kpis.map((k) => (
        <Card className="animate-fadeup !p-3" key={k.label}>
          <div className="text-[9.5px] tracking-[0.1em] text-text-dim uppercase font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{k.label}</div>
          <div className="font-mono font-semibold text-[22px] text-text mt-[5px] tracking-[-0.02em]">{k.value}</div>
          <div className="text-[10.5px] mt-[3px] font-semibold" style={{ color: k.deltaColor }}>
            {k.delta}
          </div>
        </Card>
      ))}
    </div>
  );
}
