import { Session } from "@/lib/data";
import TopBar from "@/components/TopBar";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import ShotTimeline from "@/components/ShotTimeline";
import SessionsTable from "@/components/SessionsTable";
import ManualSessionModal from "@/components/ManualSessionModal";
import PracticeKPIs from "@/components/PracticeKPIs";
import { sessions as mockSessions } from "@/lib/data";
import { cookies } from "next/headers";

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
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching sessions, falling back to mock data:", error);
    return mockSessions;
  }
}

export default async function PracticePage() {
  const sessions = await getSessions();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-4 p-4 sm:m-0 sm:p-0 sm:bg-transparent sm:text-inherit">
      <div className="flex items-center justify-between mb-6">
        <TopBar title="Practice Sessions" />
        <ManualSessionModal />
      </div>
      
      <PracticeKPIs sessions={sessions} />
      
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 my-6">
        <ShotTimeline sessions={sessions} />
        <PracticeHeatmap sessions={sessions} />
      </div>
      
      <div className="mt-6">
        <SessionsTable sessions={sessions} />
      </div>
    </div>
  );
}
