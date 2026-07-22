import { sessions as mockSessions, Session } from "@/lib/data";

async function getSessions(): Promise<Session[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${apiUrl}/api/sessions`, {
      // Revalidate every 5 seconds to show fresh data without full refresh
      next: { revalidate: 5 }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching sessions, falling back to mock data:", error);
    return mockSessions;
  }
}

export default async function SessionsTable() {
  const sessions = await getSessions();

  return (
    <div className="bg-panel border border-border rounded-[14px] p-[6px_16px_10px] overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-black/5 text-[9.5px] tracking-[0.1em] uppercase text-black/40 font-semibold">
            <th className="py-[10px] font-semibold">Session</th>
            <th className="py-[10px] font-semibold">Type</th>
            <th className="py-[10px] font-semibold">Arrows</th>
            <th className="py-[10px] font-semibold">Score</th>
            <th className="py-[10px] font-semibold">Avg</th>
            <th className="py-[10px] font-semibold">10+X</th>
            <th className="py-[10px] font-semibold">AI note</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr className="border-b border-black/5 text-[12px] text-[#d9dbde] hover:bg-black/5 transition-colors" key={i}>
              <td className="py-[9px] font-semibold text-text-mid">{s.name}</td>
              <td className="py-[9px] text-black/55">{s.type}</td>
              <td className="py-[9px] font-mono">{s.arrows}</td>
              <td className="py-[9px] font-mono text-gold font-semibold">{s.score}</td>
              <td className="py-[9px] font-mono">{s.avg}</td>
              <td className="py-[9px] font-mono">{s.tens}</td>
              <td className="py-[9px] text-[11px] text-black/50">{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
