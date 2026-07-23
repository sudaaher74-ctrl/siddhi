"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Equipment } from "@/lib/data";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Equipment>) => Promise<void>;
  initialData?: Equipment | null;
}

export default function EquipmentModal({ isOpen, onClose, onSave, initialData }: EquipmentModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState<"active" | "backup" | "retired">("active");
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setStatus(initialData.status);
        setStats(initialData.stats || []);
      } else {
        setName("");
        setType("");
        setStatus("active");
        setStats([{ label: "Draw Weight", value: "" }]); // Default first stat
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out empty stats
    const validStats = stats.filter(s => s.label.trim() && s.value.trim());

    await onSave({
      _id: initialData?._id,
      name,
      type,
      status,
      stats: validStats
    });
    
    setIsSubmitting(false);
    onClose();
  };

  const addStat = () => {
    setStats([...stats, { label: "", value: "" }]);
  };

  const removeStat = (index: number) => {
    const newStats = [...stats];
    newStats.splice(index, 1);
    setStats(newStats);
  };

  const updateStat = (index: number, field: "label" | "value", val: string) => {
    const newStats = [...stats];
    newStats[index][field] = val;
    setStats(newStats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadein">
      <div className="bg-panel w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-[17px] font-bold text-text">
            {initialData ? "Edit Equipment" : "Add Equipment"}
          </h2>
          <button onClick={onClose} className="p-2 text-text-dim hover:text-text bg-black/5 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="equipment-form" onSubmit={handleSave} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-text">Equipment Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Primary Recurve"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-[14px] text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-text">Type / Model</label>
              <input
                type="text"
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Olympic Recurve, Easton X23"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-[14px] text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-text">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "backup" | "retired")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-[14px] text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none"
              >
                <option value="active">Active Setup</option>
                <option value="backup">Backup Setup</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] font-semibold text-text">Tuning Stats</label>
                <button type="button" onClick={addStat} className="flex items-center gap-1 text-[11px] font-bold text-accent hover:text-accent-hover uppercase tracking-wider transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Stat
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Tiller"
                      value={stat.label}
                      onChange={(e) => updateStat(i, "label", e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-[13px] text-text focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="e.g. +4mm top"
                      value={stat.value}
                      onChange={(e) => updateStat(i, "value", e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-[13px] text-text focus:outline-none focus:border-accent"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeStat(i)}
                      className="p-2 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {stats.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-border rounded-xl text-text-dim text-[13px]">
                    No stats added. Click &quot;Add Stat&quot; to configure tune details.
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-[14px] text-text-mid bg-black/5 hover:bg-black/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            form="equipment-form"
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-semibold text-[14px] text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? "Saving..." : "Save Equipment"}
          </button>
        </div>

      </div>
    </div>
  );
}
