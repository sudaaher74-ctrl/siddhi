import { Session } from "@/lib/data";
import { cookies } from "next/headers";
import ScorecardView from "@/components/ScorecardView";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

async function getLatestSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/sessions`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const sessions = await res.json();
    return Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error("Error fetching latest session for scorecard:", error);
    return null;
  }
}

export default async function ScorecardPage() {
  const latestSession = await getLatestSession();

  return (
    <div className="min-h-screen py-2">
      <div className="hidden sm:block mb-4">
        <TopBar title="Official Scorecard" />
      </div>
      <ScorecardView session={latestSession || undefined} />
    </div>
  );
}
