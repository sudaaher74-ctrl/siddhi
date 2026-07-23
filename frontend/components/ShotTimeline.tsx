import { Session } from "@/lib/data";
import { Play } from "lucide-react";

interface ShotTimelineProps {
  sessions: Session[];
}

export default function ShotTimeline({ sessions }: ShotTimelineProps) {
  // Find the most recent session with arrowData
  const sessionWithArrows = sessions.find(s => s.arrowData);
  const arrows: Array<{ v: string; c: string }> = [];
  let bestEndScore = 0;
  let totalEnds = 0;
  
  if (sessionWithArrows?.arrowData) {
    try {
      const endsData = JSON.parse(sessionWithArrows.arrowData);
      totalEnds = endsData.length;
      endsData.forEach((end: Array<{ score: string }>) => {
        let endScore = 0;
        end.forEach(a => {
          const val = a.score;
          const numVal = val === 'X' ? 10 : val === 'M' ? 0 : parseInt(val, 10);
          endScore += numVal;
          
          let color = "#ef4444"; // red for <= 7
          if (val === 'X' || numVal === 10) color = "#10b981"; // green
          else if (numVal === 9) color = "#eab308"; // yellow
          else if (numVal === 8) color = "#f97316"; // orange
          
          arrows.push({ v: val, c: color });
        });
        if (endScore > bestEndScore) bestEndScore = endScore;
      });
    } catch (e) {
      console.error("Failed to parse arrow data", e);
    }
  }

  // Limit to last 36 for display if there are many
  const displayArrows = arrows.slice(-36);

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[16px] font-bold text-slate-900">Latest Timeline</h2>
          <div className="text-[12px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {displayArrows.length > 0 ? `Last ${displayArrows.length} arrows` : "No recent arrows"}
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-[12px] text-white bg-gradient-to-r from-accent to-orange-500 rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(255,90,78,0.3)] transition-all transform hover:-translate-y-0.5">
          <Play className="w-3.5 h-3.5 fill-white" /> Replay
        </button>
      </div>
      
      <div className="flex gap-1.5 mt-2 flex-wrap min-h-[50px]">
        {displayArrows.length > 0 ? displayArrows.map((a, i) => (
          <div
            key={i}
            title={`Arrow ${arrows.length - displayArrows.length + i + 1}`}
            className="w-[32px] h-[40px] flex-none rounded-[8px] bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-[14px] cursor-pointer hover:bg-slate-100 transition-colors shadow-sm relative overflow-hidden group"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: a.c }} />
            <span style={{ color: a.c }}>{a.v}</span>
          </div>
        )) : (
          <div className="text-[13px] text-slate-400 italic">Log a session with arrows to see the timeline.</div>
        )}
      </div>
      
      {totalEnds > 0 && (
        <div className="flex gap-5 mt-5 pt-4 border-t border-slate-100 text-[13px] text-slate-500 font-medium">
          <span>{totalEnds} Ends Logged</span>
          <span className="flex items-center gap-1">
            Best end: <span className="text-slate-900 font-bold bg-slate-100 px-2 rounded-md">{bestEndScore}</span>
          </span>
        </div>
      )}
    </div>
  );
}
