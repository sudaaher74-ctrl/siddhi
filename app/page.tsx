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
    <div className="app">
      <Sidebar />
      <main className="main">
        <TopBar />
        <KpiGrid />
        <div className="charts-row">
          <ScoreTrend />
          <ArrowPlot />
          <PerformanceRadar />
        </div>
        <div className="row2">
          <ShotTimeline />
          <PracticeHeatmap />
        </div>
        <SessionsTable />
      </main>
    </div>
  );
}
