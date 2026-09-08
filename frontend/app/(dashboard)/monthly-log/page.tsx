import { Session } from "@/lib/data";
import { cookies } from "next/headers";
import MonthlyLogView from "@/components/MonthlyLogView";

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
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

async function getUser(): Promise<{ name: string; email: string; phone?: string; avatar?: string; role?: string } | null> {
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
    console.error("Error fetching user for monthly log:", error);
    return null;
  }
}

export default async function MonthlyLogPage() {
  const [sessions, user] = await Promise.all([getSessions(), getUser()]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-4 p-4 sm:m-0 sm:p-0 sm:bg-transparent sm:text-inherit">
      <MonthlyLogView initialSessions={sessions} initialUser={user} />
    </div>
  );
}

