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
      endsData.forEach((end: Array<{ score: string } | string>) => {
        let endScore = 0;
        if (Array.isArray(end)) {
          end.forEach(a => {
            const val = typeof a === 'object' && a !== null && 'score' in a ? String((a as { score: unknown }).score) : String(a);
            const numVal = val === 'X' ? 10 : val === 'M' ? 0 : parseInt(val, 10);
            endScore += isNaN(numVal) ? 0 : numVal;
            
            let color = "#94a3b8"; // grey for miss / M
            if (val === 'X' || numVal === 10 || numVal === 9) {
              color = "#ca8a04"; // yellow
            } else if (numVal === 8 || numVal === 7) {
              color = "#ef4444"; // red
            } else if (numVal === 6 || numVal === 5) {
              color = "#0284c7"; // blue
            } else if (numVal === 4 || numVal === 3) {
              color = "#1e293b"; // black
            } else if (numVal === 2 || numVal === 1) {
              color = "#475569"; // white
            } else {
              color = "#94a3b8"; // grey for miss
            }
            
            arrows.push({ v: val, c: color });
          });
        }
        if (endScore > bestEndScore) bestEndScore = endScore;
      });
    } catch (e) {
      console.error("Failed to parse arrow data", e);
    }
  }

  // Limit to last 36 for display if there are many
  const displayArrows = arrows.slice(-36);

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h2 className="text-[16px] font-bold text-slate-900">Latest Timeline</h2>
          <div className="text-[12px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {displayArrows.length > 0 ? `Last ${displayArrows.length} arrows` : "No recent arrows"}
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-[12px] text-white bg-gradient-to-r from-accent to-orange-500 rounded-lg shadow-sm hover:shadow-[0_4px_12px_rgba(255,90,78,0.3)] transition-all transform hover:-translate-y-0.5">
          <Play className="w-3.5 h-3.5 fill-white" /> Replay
        </button>
      </div>
      
      <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-12 gap-1.5 sm:gap-2 mt-2 min-h-[50px]">
        {displayArrows.length > 0 ? displayArrows.map((a, i) => (
          <div
            key={i}
            title={`Arrow ${arrows.length - displayArrows.length + i + 1}`}
            className="w-full h-[40px] sm:h-[42px] rounded-[8px] bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-[14px] sm:text-[15px] cursor-pointer hover:bg-slate-100 transition-colors shadow-sm relative overflow-hidden group"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: a.c }} />
            <span style={{ color: a.c }}>{a.v}</span>
          </div>
        )) : (
          <div className="col-span-full text-[13px] text-slate-400 italic py-2">Log a session with arrows to see the timeline.</div>
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
