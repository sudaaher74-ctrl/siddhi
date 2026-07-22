import TopBar from "@/components/TopBar";
import AIChat from "@/components/AIChat";

export default function AICoachPage() {
  return (
    <>
      <TopBar title="AI Coach" />
      <div className="mt-4">
        <AIChat />
      </div>
    </>
  );
}
