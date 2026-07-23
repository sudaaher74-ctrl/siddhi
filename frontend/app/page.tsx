import TopBar from "@/components/TopBar";
import HeroPerformanceCard from "@/components/HeroPerformanceCard";
import HomeKpiGrid from "@/components/HomeKpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import HomeGoalsProgress from "@/components/HomeGoalsProgress";
import AICoachSummary from "@/components/AICoachSummary";
import UpcomingEvents from "@/components/UpcomingEvents";
import EquipmentStatus from "@/components/EquipmentStatus";
import RecentAchievements from "@/components/RecentAchievements";
import QuickActions from "@/components/QuickActions";
import MotivationCard from "@/components/MotivationCard";
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
      <HeroPerformanceCard sessions={sessions} />
      <HomeKpiGrid sessions={sessions} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[12px]">
        {/* Left Column (2/3 width on large screens) */}
        <div className="xl:col-span-2 flex flex-col gap-[12px]">
          <ScoreTrend sessions={sessions} minimal={true} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            <HomeGoalsProgress sessions={sessions} />
            <AICoachSummary sessions={sessions} />
          </div>
          <QuickActions />
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="flex flex-col gap-[12px]">
          <UpcomingEvents />
          <EquipmentStatus />
          <RecentAchievements />
        </div>
      </div>
      
      <MotivationCard />
    </>
  );
}
