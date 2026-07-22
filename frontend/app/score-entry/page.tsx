import TopBar from "@/components/TopBar";
import ScorePad from "@/components/ScorePad";
import ArrowPlot from "@/components/ArrowPlot";

export default function ScoreEntryPage() {
  return (
    <>
      <TopBar title="Score Entry" />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[12px] mt-4">
        <div>
          <ScorePad />
        </div>
        <div>
          <ArrowPlot />
        </div>
      </div>
    </>
  );
}
