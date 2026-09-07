"use client";

import React from "react";
import { X } from "lucide-react";
import { Session } from "@/lib/data";
import ScorecardView from "./ScorecardView";

interface ScorecardModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScorecardModal({
  session,
  isOpen,
  onClose,
}: ScorecardModalProps) {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Scorecard Details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ScorecardView session={session} onBack={onClose} />
        </div>
      </div>
    </div>
  );
}
