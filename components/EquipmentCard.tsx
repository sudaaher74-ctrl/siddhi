import React from "react";
import { Settings, PenTool, Activity } from "lucide-react";

export default function EquipmentCard({
  title,
  type,
  stats,
  status
}: {
  title: string;
  type: string;
  stats: { label: string; value: string }[];
  status: "active" | "backup" | "retired";
}) {
  return (
    <div className="bg-panel border border-border rounded-[14px] p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[15px] font-bold text-text mb-1">{title}</h3>
          <div className="text-[12px] text-text-dim flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{type}</span>
            {status === "active" && <span className="text-accent flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseCustom"></span> Active Setup</span>}
            {status === "backup" && <span className="text-white/50">Backup Setup</span>}
          </div>
        </div>
        <button className="p-1.5 text-white/40 hover:text-white/80 transition-colors bg-white/5 rounded-md border border-white/5">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-[11px] text-text-dim uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-[13px] font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[12px] font-medium text-white transition-colors flex items-center justify-center gap-2">
          <PenTool className="w-3.5 h-3.5" />
          Edit Tune
        </button>
        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[12px] font-medium text-white transition-colors flex items-center justify-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          View History
        </button>
      </div>
    </div>
  );
}
