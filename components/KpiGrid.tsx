import { kpis } from "@/lib/data";

export default function KpiGrid() {
  return (
    <div className="kpi-grid">
      {kpis.map((k) => (
        <div className="kpi-card" key={k.label}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-delta" style={{ color: k.deltaColor }}>
            {k.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
