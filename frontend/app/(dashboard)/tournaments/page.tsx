import TopBar from "@/components/TopBar";
import UpcomingEvents from "@/components/UpcomingEvents";
import SessionsTable from "@/components/SessionsTable";
import { Session, sessions as mockSessions } from "@/lib/data";
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

export default async function TournamentsPage() {
  const sessions = await getSessions();

  return (
    <>
      <TopBar title="Tournaments" />
      
      <div className="mt-4 mb-6">
        <UpcomingEvents />
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-text mb-4 px-1">Tournament History</h3>
        <SessionsTable sessions={sessions} />
      </div>
    </>
  );
}
