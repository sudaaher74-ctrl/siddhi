import TopBar from "@/components/TopBar";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import ShotTimeline from "@/components/ShotTimeline";
import SessionsTable from "@/components/SessionsTable";
import ManualSessionModal from "@/components/ManualSessionModal";

export default function PracticePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <TopBar title="Practice Sessions" />
        <ManualSessionModal />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr] gap-[12px] mt-4">
        <ShotTimeline />
        <PracticeHeatmap />
      </div>
      
      <div className="mt-4">
        <SessionsTable />
      </div>
    </>
  );
}
