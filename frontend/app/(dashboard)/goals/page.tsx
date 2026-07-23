import TopBar from "@/components/TopBar";
import GoalTracker from "@/components/GoalTracker";

export default function GoalsPage() {
  return (
    <>
      <TopBar title="Goals & Milestones" />
      
      <div className="max-w-3xl mx-auto mt-4">
        <GoalTracker />
      </div>
    </>
  );
}
