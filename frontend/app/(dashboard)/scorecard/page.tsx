import { Session } from "@/lib/data";
import { cookies } from "next/headers";
import ScorecardView from "@/components/ScorecardView";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

async function getSessions(): Promise<Session[]> {
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
      return [];
    }

    const sessions = await res.json();
    return Array.isArray(sessions) ? sessions : [];
  } catch (error) {
    console.error("Error fetching sessions for scorecard:", error);
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
    console.error("Error fetching user for scorecard:", error);
    return null;
  }
}

export default async function ScorecardPage() {
  const [sessions, user] = await Promise.all([getSessions(), getUser()]);

  return (
    <>
      <TopBar title="Scorecard" />
      <ScorecardView session={sessions[0] || undefined} allSessions={sessions} initialUser={user} />
    </>
  );
}

