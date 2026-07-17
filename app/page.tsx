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
    <>
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
    </>
  );
}
