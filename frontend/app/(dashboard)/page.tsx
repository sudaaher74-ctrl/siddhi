import TopBar from "@/components/TopBar";
import HeroPerformanceCard from "@/components/HeroPerformanceCard";
import HomeKpiGrid from "@/components/HomeKpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import HomeGoalsProgress from "@/components/HomeGoalsProgress";
import EquipmentStatus from "@/components/EquipmentStatus";
import RecentAchievements from "@/components/RecentAchievements";
import QuickActions from "@/components/QuickActions";
import MotivationCard from "@/components/MotivationCard";
import { Session } from "@/lib/data";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

async function getUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching user for dashboard:", error);
    return null;
  }
}

async function getSessions(): Promise<Session[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/sessions`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const [sessions, user] = await Promise.all([getSessions(), getUser()]);

  return (
    <>
      <TopBar subtitle={user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : undefined} />
      <HeroPerformanceCard sessions={sessions} initialUser={user} />

      <HomeKpiGrid sessions={sessions} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[12px]">
        {/* Left Column (2/3 width on large screens) */}
        <div className="xl:col-span-2 flex flex-col gap-[12px]">
          <ScoreTrend sessions={sessions} minimal={true} />
          <HomeGoalsProgress />
          <QuickActions />
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="flex flex-col gap-[12px]">
          <EquipmentStatus />
          <RecentAchievements sessions={sessions} />
        </div>
      </div>
      
      <MotivationCard />
    </>
  );
}
