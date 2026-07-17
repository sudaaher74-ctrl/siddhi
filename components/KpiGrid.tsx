import { kpis } from "@/lib/data";

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-[10px]">
      {kpis.map((k) => (
        <div className="bg-panel border border-border rounded-[12px] p-[12px_13px] animate-fadeup" key={k.label}>
          <div className="text-[9.5px] tracking-[0.1em] text-text-dim uppercase font-semibold">{k.label}</div>
          <div className="font-mono font-semibold text-[22px] text-[#f4f5f7] mt-[5px] tracking-[-0.02em]">{k.value}</div>
          <div className="text-[10.5px] mt-[3px] font-semibold" style={{ color: k.deltaColor }}>
            {k.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
