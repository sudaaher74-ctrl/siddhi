"use client";

import Card from "@/components/ui/Card";
import { Wrench, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EquipmentStatus() {
  const status = {
    bow: "Optimal",
    arrows: "Check Fletching",
    string: "Replace Soon",
    lastMaintenance: "Jul 10, 2026",
    nextMaintenance: "Aug 10, 2026"
  };

  return (
    <Card className="flex flex-col h-full bg-surface border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <Wrench className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">Equipment</h2>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">Bow</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status.bow}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">Arrows</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {status.arrows}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">String</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {status.string}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-dim uppercase">Last Checked</span>
          <span className="text-xs font-medium text-text-mid">{status.lastMaintenance}</span>
        </div>
        <Link 
          href="/equipment" 
          className="flex items-center gap-1 text-[11px] font-bold text-accent hover:text-accent-hover uppercase tracking-wider transition-colors"
        >
          Manage
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}
