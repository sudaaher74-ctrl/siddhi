import { Session } from "@/lib/data";
import TopBar from "@/components/TopBar";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import ShotTimeline from "@/components/ShotTimeline";
import SessionsTable from "@/components/SessionsTable";
import ManualSessionModal from "@/components/ManualSessionModal";
import PracticeKPIs from "@/components/PracticeKPIs";
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
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    // Never fall back to mock data here — it hides real sessions and makes it
    // look like saving failed. Show an empty list instead.
    console.error("Error fetching sessions:", error);
    return [];
  }
}

async function getUser(): Promise<{ name: string; email: string; avatar?: string; role?: string } | null> {
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
    console.error("Error fetching user for practice:", error);
    return null;
  }
}

export default async function PracticePage() {
  const [sessions, user] = await Promise.all([getSessions(), getUser()]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-4 p-4 sm:m-0 sm:p-0 sm:bg-transparent sm:text-inherit">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <TopBar title="Practice Sessions" initialUser={user} />
        <div className="self-end sm:self-auto">
          <ManualSessionModal />
        </div>
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
