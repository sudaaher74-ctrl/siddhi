"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { Wrench, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Equipment } from "@/lib/data";
import Cookies from "js-cookie";

export default function EquipmentStatus() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const token = Cookies.get("token");
        const res = await fetch(`${apiUrl}/api/equipment`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEquipmentList(data);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    };
    fetchEquipment();
  }, []);

  const activeCount = equipmentList.filter(e => e.status === "active").length;
  const backupCount = equipmentList.filter(e => e.status === "backup").length;
  const retiredCount = equipmentList.filter(e => e.status === "retired").length;

  return (
    <Card className="flex flex-col h-full bg-surface border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <Wrench className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">Equipment</h2>
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-center">
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">Active Setups</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeCount} active
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">Backup Equipment</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {backupCount} items
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border">
          <span className="text-xs font-semibold text-text">Retired</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {retiredCount} items
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-dim uppercase">Total Items</span>
          <span className="text-xs font-medium text-text-mid">{equipmentList.length}</span>
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
