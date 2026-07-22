import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import PerformanceRadar from "@/components/PerformanceRadar";
import ArrowPlot from "@/components/ArrowPlot";
import { Session } from "@/lib/data";

async function getSessions(): Promise<Session[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${apiUrl}/api/sessions`, {
      next: { revalidate: 5 }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export default async function AnalyticsPage() {
  const sessions = await getSessions();

  return (
    <>
      <TopBar title="Analytics" />
      
      <div className="mt-4">
        <KpiGrid sessions={sessions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[12px] mt-4">
        <ScoreTrend sessions={sessions} />
        <PerformanceRadar sessions={sessions} />
      </div>

      <div className="mt-4">
        <ArrowPlot heatmapMode={true} sessions={sessions} />
      </div>
    </>
  );
}
