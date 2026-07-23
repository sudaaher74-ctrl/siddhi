import { Session } from "@/lib/data";

interface PracticeHeatmapProps {
  sessions: Session[];
}

export default function PracticeHeatmap({ sessions }: PracticeHeatmapProps) {
  // Generate last 14 days
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      arrows: 0
    });
  }

  // Populate data
  sessions.forEach(s => {
    if (!s.createdAt) return;
    const sDate = new Date(s.createdAt);
    sDate.setHours(0,0,0,0);
    const dayMatch = days.find(d => d.date.getTime() === sDate.getTime());
    if (dayMatch) {
      dayMatch.arrows += (parseInt(s.arrows) || 0);
    }
  });

  const maxArrows = Math.max(...days.map(d => d.arrows), 100); // minimum scale 100
  const avgArrows = days.reduce((sum, d) => sum + d.arrows, 0) / 14;

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-bold text-slate-900">Practice Intensity</h2>
        <div className="text-[12px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
          Last 14 Days
        </div>
      </div>
      
      <div className="relative flex-1 min-h-[140px] mt-auto">
        {/* Y-axis background lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-slate-100 w-full h-0" />
          <div className="border-b border-slate-100 w-full h-0" />
          <div className="border-b border-slate-100 w-full h-0" />
          <div className="border-b border-slate-200 w-full h-0" />
        </div>
        
        {/* Average line */}
        {avgArrows > 0 && (
          <div 
            className="absolute left-0 right-0 border-b border-dashed border-accent/50 z-0 flex items-end pointer-events-none"
            style={{ bottom: `${(avgArrows / maxArrows) * 100}%` }}
          >
            <span className="text-[9px] font-semibold text-accent -mb-3 bg-white px-1 ml-1">{Math.round(avgArrows)} avg</span>
          </div>
        )}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-between px-1 md:px-2 z-10 pt-4 pb-0">
          {days.map((day, i) => {
            const heightPct = Math.max((day.arrows / maxArrows) * 100, 2); // 2% minimum height for visibility if 0
            const isZero = day.arrows === 0;
            return (
              <div 
                key={i} 
                className="group relative flex flex-col items-center justify-end w-full h-full mx-[2px] md:mx-[4px]"
              >
                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  {day.arrows} arrows
                </div>
                {/* Bar */}
                <div 
                  className={`w-full rounded-t-[4px] transition-all duration-500 ${isZero ? 'bg-slate-100' : 'bg-slate-800 hover:bg-accent cursor-pointer'}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between px-1 md:px-2 mt-2 text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        {days.map((day, i) => (
          <div key={i} className="w-full text-center truncate">
            {i % 2 === 0 ? day.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
