import TopBar from "@/components/TopBar";
import GoalTracker from "@/components/GoalTracker";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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
    console.error("Error fetching user for goals:", error);
    return null;
  }
}

export default async function GoalsPage() {
  const user = await getUser();

  return (
    <>
      <TopBar title="Goals & Milestones" initialUser={user} />
      
      <div className="max-w-3xl mx-auto mt-4">
        <GoalTracker />
      </div>
    </>
  );
}
