import { kpis } from "@/lib/data";
import Card from "@/components/ui/Card";

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-[10px]">
      {kpis.map((k) => (
        <Card className="animate-fadeup !p-3" key={k.label}>
          <div className="text-[9.5px] tracking-[0.1em] text-text-dim uppercase font-semibold">{k.label}</div>
          <div className="font-mono font-semibold text-[22px] text-text mt-[5px] tracking-[-0.02em]">{k.value}</div>
          <div className="text-[10.5px] mt-[3px] font-semibold" style={{ color: k.deltaColor }}>
            {k.delta}
          </div>
        </Card>
      ))}
    </div>
  );
}
