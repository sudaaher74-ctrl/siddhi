import { heatmap } from "@/lib/data";

const LEGEND = [
  "rgba(0,0,0,.05)",
  "rgba(255,90,78,.25)",
  "rgba(255,90,78,.5)",
  "var(--accent)",
];

export default function PracticeHeatmap() {
  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 flex flex-col">
      <div className="flex items-baseline gap-[10px]">
        <h2 className="text-[13px] font-semibold text-text-mid">Practice intensity</h2>
        <div className="ml-auto font-mono font-medium text-[10px] text-black/40">LAST 14 WKS</div>
      </div>
      <div className="grid gap-[3px] mt-[14px]" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
        {heatmap.map((bg, i) => (
          <div key={i} className="aspect-square rounded-[3px]" style={{ background: bg }} />
        ))}
      </div>
      <div className="flex items-center gap-[5px] mt-[10px] text-[10px] text-black/40">
        Less
        {LEGEND.map((bg, i) => (
          <span key={i} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: bg }} />
        ))}
        More
        <span className="ml-auto">312 arrows / wk avg</span>
      </div>
    </div>
  );
}
