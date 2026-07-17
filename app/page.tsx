import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import ArrowPlot from "@/components/ArrowPlot";
import PerformanceRadar from "@/components/PerformanceRadar";
import ShotTimeline from "@/components/ShotTimeline";
import PracticeHeatmap from "@/components/PracticeHeatmap";
import SessionsTable from "@/components/SessionsTable";

export default function DashboardPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-[14px] p-[14px] min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(255,90,78,0.07),transparent_60%),var(--surface)]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col gap-[12px]">
        <TopBar />
        <KpiGrid />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr_1fr] gap-[12px]">
          <ScoreTrend />
          <ArrowPlot />
          <PerformanceRadar />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr] gap-[12px]">
          <ShotTimeline />
          <PracticeHeatmap />
        </div>
        <SessionsTable />
      </main>
    </div>
  );
}
