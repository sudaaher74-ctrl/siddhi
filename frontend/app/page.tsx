import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import ArrowPlot from "@/components/ArrowPlot";
import PerformanceRadar from "@/components/PerformanceRadar";
import ShotTimeline from "@/components/ShotTimeline";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import SessionsTable from "@/components/SessionsTable";
import { Session, sessions as mockSessions } from "@/lib/data";

async function getSessions(): Promise<Session[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/sessions`, {
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

export default async function DashboardPage() {
  const sessions = await getSessions();

  return (
    <>
      <TopBar />
      <KpiGrid />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr_1fr] gap-[12px]">
        <ScoreTrend />
        <ArrowPlot />
        <PerformanceRadar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr] gap-[12px]">
        <ShotTimeline sessions={sessions} />
        <PracticeHeatmap sessions={sessions} />
      </div>
      <SessionsTable sessions={sessions} />
    </>
  );
}
