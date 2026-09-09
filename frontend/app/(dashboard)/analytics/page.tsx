import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import AnalyticsGoalChart, { Goal } from "@/components/AnalyticsGoalChart";
import ArrowPlot from "@/components/ArrowPlot";
import { Session } from "@/lib/data";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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
      throw new Error(`Failed to fetch sessions: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

async function getGoals(): Promise<Goal[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/goals`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return [];
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
}

export default async function AnalyticsPage() {
  const [sessions, goals] = await Promise.all([
    getSessions(),
    getGoals(),
  ]);

  return (
    <>
      <TopBar title="Analytics" />
      
      <div className="mt-4">
        <KpiGrid sessions={sessions} mode="daily" />
      </div>

      <div className="mt-4">
        <AnalyticsGoalChart sessions={sessions} initialGoals={goals} />
      </div>

      <div className="mt-4">
        <ArrowPlot heatmapMode={true} sessions={sessions} mode="daily" />
      </div>
    </>
  );
}

