"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { Session } from "@/lib/data";
import ScorecardView from "./ScorecardView";

interface ScorecardModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  isLivePreview?: boolean;
  isSaving?: boolean;
}

export default function ScorecardModal({
  session,
  isOpen,
  onClose,
  onSave,
  isLivePreview = false,
  isSaving = false,
}: ScorecardModalProps) {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scorecard Details
            </span>
            {isLivePreview && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide border border-amber-300">
                Live Preview (Unsaved)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLivePreview && onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save to Official Scorecards"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ScorecardView session={session} onBack={onClose} onSaveLiveRound={onSave} />
        </div>
      </div>
    </div>
  );
}
