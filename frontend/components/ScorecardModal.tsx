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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-[480px] my-auto">
        {/* Close Button on overlay top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-2 text-white/80 hover:text-white flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md transition-all z-10"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>

        <div className="animate-in fade-in zoom-in-95 duration-200">
          <ScorecardView session={session} onBack={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
}
