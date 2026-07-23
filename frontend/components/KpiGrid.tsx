import { Kpi, Session } from "@/lib/data";
import Card from "@/components/ui/Card";

export default function KpiGrid({ 
  sessions = [], 
  mode = "overall" 
}: { 
  sessions?: Session[],
  mode?: "overall" | "daily"
}) {
  const today = new Date().toLocaleDateString();
  const filteredSessions = mode === "daily" 
    ? sessions.filter(s => s.createdAt && new Date(s.createdAt).toLocaleDateString() === today)
    : sessions;

  const totalArrows = filteredSessions.reduce((sum, s) => sum + (parseInt(s.arrows) || 0), 0);
  const totalScore = filteredSessions.reduce((sum, s) => sum + (parseInt(s.score) || 0), 0);
  const totalTens = filteredSessions.reduce((sum, s) => sum + (parseInt(s.tens) || 0), 0);
  
  const avg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";
  const tenRate = totalArrows > 0 ? Math.round((totalTens / totalArrows) * 100) : 0;
  const practiceTime = `${Math.round(totalArrows * 0.5)}m`;
  
  let bestScore = 0;
  filteredSessions.forEach(s => {
    const sScore = parseInt(s.score) || 0;
    if (sScore > bestScore) bestScore = sScore;
  });

  const kpis: Kpi[] = mode === "overall" ? [
    { label: "Total Sessions", value: sessions.length.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Total Arrows", value: totalArrows.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Overall Avg", value: avg, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Total 10s + Xs", value: totalTens.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "10 + X Rate", value: `${tenRate}%`, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Practice Time", value: practiceTime, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Best Session", value: bestScore.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Streak", value: "1d", delta: "-", deltaColor: "rgba(0,0,0,.4)" },
  ] : [
    { label: "Sessions Today", value: filteredSessions.length.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Arrows Today", value: totalArrows.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's Avg", value: avg, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's 10s + Xs", value: totalTens.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's 10+X Rate", value: `${tenRate}%`, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's Time", value: practiceTime, delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Best Score Today", value: bestScore.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
    { label: "Today's Total", value: totalScore.toString(), delta: "-", deltaColor: "rgba(0,0,0,.4)" },
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
