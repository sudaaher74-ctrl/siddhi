import { heatmap } from "@/lib/data";

const LEGEND = [
  "rgba(255,255,255,.05)",
  "rgba(255,90,78,.25)",
  "rgba(255,90,78,.5)",
  "#ff5a4e",
];

export default function PracticeHeatmap() {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Practice intensity</div>
        <div className="card-meta">LAST 14 WKS</div>
      </div>
      <div className="heat-grid">
        {heatmap.map((bg, i) => (
          <div key={i} className="heat-cell" style={{ background: bg }} />
        ))}
      </div>
      <div className="heat-legend">
        Less
        {LEGEND.map((bg, i) => (
          <span key={i} className="heat-swatch" style={{ background: bg }} />
        ))}
        More
        <span className="end">312 arrows / wk avg</span>
      </div>
    </div>
  );
}
