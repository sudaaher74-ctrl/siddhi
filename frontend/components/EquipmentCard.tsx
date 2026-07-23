import React from "react";
import { Settings, PenTool, Activity } from "lucide-react";

export default function EquipmentCard({
  title,
  type,
  stats,
  status,
  onEdit,
  onDelete
}: {
  title: string;
  type: string;
  stats: { label: string; value: string }[];
  status: "active" | "backup" | "retired";
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-panel border border-border rounded-[14px] p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[15px] font-bold text-text mb-1">{title}</h3>
          <div className="text-[12px] text-text-dim flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-black/5 border border-black/10">{type}</span>
            {status === "active" && <span className="text-accent flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseCustom"></span> Active Setup</span>}
            {status === "backup" && <span className="text-black/50">Backup Setup</span>}
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="p-1.5 text-black/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors bg-black/5 rounded-md border border-black/5"
          title="Delete Equipment"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        {stats.map((stat, i) => (
          <div key={i} className="bg-black/5 p-3 rounded-lg border border-black/5">
            <div className="text-[11px] text-text-dim uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-[13px] font-semibold text-black">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-black/5 flex gap-2">
        <button 
          onClick={onEdit}
          className="flex-1 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-[12px] font-medium text-black transition-colors flex items-center justify-center gap-2"
        >
          <PenTool className="w-3.5 h-3.5" />
          Edit Tune
        </button>
        <button 
          onClick={() => alert("History feature coming soon!")}
          className="flex-1 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-[12px] font-medium text-black transition-colors flex items-center justify-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          View History
        </button>
      </div>
    </div>
  );
}
