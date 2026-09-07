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

    return await res.json();
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export default async function MonthlyLogPage() {
  const sessions = await getSessions();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-4 p-4 sm:m-0 sm:p-0 sm:bg-transparent sm:text-inherit">
      <MonthlyLogView initialSessions={sessions} />
    </div>
  );
}
