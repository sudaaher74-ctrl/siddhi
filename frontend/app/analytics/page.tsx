import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import ScoreTrend from "@/components/ScoreTrend";
import PerformanceRadar from "@/components/PerformanceRadar";
import ArrowPlot from "@/components/ArrowPlot";

export default function AnalyticsPage() {
  return (
    <>
      <TopBar title="Analytics" />
      
      <div className="mt-4">
        <KpiGrid />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[12px] mt-4">
        <ScoreTrend />
        <PerformanceRadar />
      </div>

      <div className="mt-4">
        <ArrowPlot />
      </div>
    </>
  );
}
