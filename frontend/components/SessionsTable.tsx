import { Session } from "@/lib/data";

interface SessionsTableProps {
  sessions: Session[];
}

function groupSessionsByDate(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  
  sessions.forEach(session => {
    // If no createdAt, assume today for mock data
    const dateStr = session.createdAt 
      ? new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(session);
  });
  
  return groups;
}

export default function SessionsTable({ sessions }: SessionsTableProps) {
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groupedSessions).map(([date, daySessions], groupIndex) => (
        <div key={groupIndex} className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-900">{date}</h3>
            <span className="text-[12px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">{daySessions.length} session{daySessions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-200 text-[11px] tracking-wider uppercase text-slate-400 font-semibold">
                  <th className="p-4 pl-5 font-semibold w-[20%]">Session Name</th>
                  <th className="p-4 font-semibold w-[15%]">Type</th>
                  <th className="p-4 font-semibold text-right">Arrows</th>
                  <th className="p-4 font-semibold text-right w-[20%]">Score</th>
                  <th className="p-4 font-semibold text-right">Avg</th>
                  <th className="p-4 font-semibold text-right">10+X</th>
                  <th className="p-4 pr-5 font-semibold w-[20%]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {daySessions.map((s, i) => (
                  <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors h-[64px]" key={i}>
                    <td className="p-4 pl-5">
                      <div className="text-[14px] font-semibold text-slate-900">{s.name}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium">
                        {s.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[16px] font-medium text-slate-600">{s.arrows}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[20px] font-bold text-accent">{s.score}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[16px] font-semibold text-slate-700">{s.avg} <span className="text-[12px] font-normal text-slate-400">Avg</span></div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[16px] font-medium text-slate-600">{s.tens}</div>
                    </td>
                    <td className="p-4 pr-5">
                      <div className="text-[13px] text-slate-500 truncate max-w-[200px]" title={s.note}>{s.note || "—"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      {Object.keys(groupedSessions).length === 0 && (
        <div className="bg-white border border-slate-200 rounded-[16px] p-[40px] text-center text-slate-500 text-[14px] shadow-sm">
          <div className="font-semibold text-slate-900 mb-1 text-[16px]">No practice sessions found</div>
          <p>Go to Score Entry to log your first session!</p>
        </div>
      )}
    </div>
  );
}
