import TopBar from "@/components/TopBar";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import ShotTimeline from "@/components/ShotTimeline";
import SessionsTable from "@/components/SessionsTable";
import { Plus } from "lucide-react";

export default function PracticePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <TopBar title="Practice Sessions" />
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-panel font-semibold text-sm rounded-lg hover:bg-accent-hover transition-colors">
          <Plus className="w-4 h-4" />
          New Session
        </button>
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
