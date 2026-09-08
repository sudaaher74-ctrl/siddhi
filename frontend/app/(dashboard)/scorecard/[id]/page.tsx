import { Session } from "@/lib/data";
import { cookies } from "next/headers";
import ScorecardView from "@/components/ScorecardView";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

interface ScorecardPageProps {
  params: Promise<{ id: string }>;
}

async function getSession(id: string): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const res = await fetch(`${apiUrl}/api/sessions/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching session for scorecard:", error);
    return null;
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

export default async function ScorecardByIdPage({ params }: ScorecardPageProps) {
  const { id } = await params;
  const [session, user] = await Promise.all([getSession(id), getUser()]);

  return (
    <>
      <TopBar title="Scorecard" />
      <ScorecardView session={session || undefined} initialUser={user} />
    </>
  );
}

