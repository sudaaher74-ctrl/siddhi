"use client";

import React from "react";
import { Undo2, Check } from "lucide-react";
import { ScoreValue, ArrowShot } from "./ScoreEntryContainer";

interface ScorePadProps {
  currentArrows: ArrowShot[];
  currentEndIndex: number;
  isSessionComplete: boolean;
  handleScoreInput: (score: ScoreValue, cx?: number | null, cy?: number | null) => void;
  handleUpdateArrowScore?: (index: number, newScore: ScoreValue) => void;
  handleUndo: () => void;
  handleSubmitEnd: () => void;
  handleSaveSession?: () => void;
  isSaving?: boolean;
  currentEndScore: number;
  totalScore: number;
}

export default function ScorePad({
  currentArrows,
  currentEndIndex,
  isSessionComplete,
  handleScoreInput,
  handleUpdateArrowScore,
  handleUndo,
  handleSubmitEnd,
  handleSaveSession,
  isSaving,
  currentEndScore,
  totalScore,
}: ScorePadProps) {
  const scores: ScoreValue[] = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];
  
  // Display arrows (pad with dashes)
  const displayArrows: Array<ScoreValue | "-"> = currentArrows.map(a => a.score);
  while (displayArrows.length < 6) {
    displayArrows.push("-");
  }

  return (
    <div className="bg-panel border border-border rounded-[14px] p-4 sm:p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-[14px] font-semibold text-text">
          {isSessionComplete ? "Session Complete" : `Input Score (End ${currentEndIndex + 1}/6)`}
        </h3>
        <div className="text-[12px] font-bold text-text-dim">Total: {totalScore}</div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {scores.map((score, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
              handleScoreInput(score, null, null);
            }}
            disabled={isSessionComplete || currentArrows.length >= 6}
            className={`
              flex items-center justify-center h-[52px] sm:h-14 rounded-xl text-[18px] sm:text-xl font-bold border border-black/10 transition-all cursor-pointer select-none active:scale-95
              ${isSessionComplete || currentArrows.length >= 6 ? 'opacity-40 cursor-not-allowed active:scale-100' : ''}
              ${score === 'X' || score === '10' || score === '9' ? 'bg-[#FEF08A] text-[#854D0E] hover:bg-[#FDE047] border-amber-300 shadow-xs' : ''}
              ${score === '8' || score === '7' ? 'bg-[#FECACA] text-[#991B1B] hover:bg-[#FCA5A5] border-rose-300 shadow-xs' : ''}
              ${score === '6' || score === '5' ? 'bg-[#BAE6FD] text-[#075985] hover:bg-[#7DD3FC] border-sky-300 shadow-xs' : ''}
              ${score === '4' || score === '3' ? 'bg-[#334155] text-white hover:bg-[#1E293B] border-slate-700 shadow-xs' : ''}
              ${score === '2' || score === '1' ? 'bg-white text-slate-900 hover:bg-slate-50 border-slate-300 shadow-xs' : ''}
              ${score === 'M' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300 shadow-xs' : ''}
            `}
          >
            {score}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/80">
        <div>
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="font-bold text-slate-700">Current End ({currentArrows.length}/6)</span>
            {currentArrows.some(a => a.score === "10" || a.score === "X") && (
              <span className="text-[9px] text-accent font-semibold">(tap 10/X to switch)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {displayArrows.map((a, i) => {
              const isFilled = i < currentArrows.length;
              const isTenOrX = a === "10" || a === "X";

              let badgeStyle = "bg-slate-200/60 text-slate-400 border border-slate-300/40";
              if (isFilled) {
                if (a === "X" || a === "10" || a === "9") badgeStyle = "bg-[#FEF08A] text-[#854D0E] border border-amber-400 shadow-xs";
                else if (a === "8" || a === "7") badgeStyle = "bg-[#FECACA] text-[#991B1B] border border-rose-300 shadow-xs";
                else if (a === "6" || a === "5") badgeStyle = "bg-[#BAE6FD] text-[#075985] border border-sky-300 shadow-xs";
                else if (a === "4" || a === "3") badgeStyle = "bg-[#334155] text-white border border-slate-700 shadow-xs";
                else if (a === "2" || a === "1") badgeStyle = "bg-white text-slate-900 border border-slate-300 shadow-xs";
                else if (a === "M") badgeStyle = "bg-slate-200 text-slate-600 border border-slate-300 shadow-xs";
              }

              if (isFilled && handleUpdateArrowScore) {
                return (
                  <button
                    key={i}
                    type="button"
                    title={isTenOrX ? `Click to switch to ${a === "X" ? "10" : "X"}` : `Arrow ${i + 1}: ${a}`}
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
                      if (a === "10") handleUpdateArrowScore(i, "X");
                      else if (a === "X") handleUpdateArrowScore(i, "10");
                    }}
                    className={`inline-flex items-center justify-center min-w-[34px] sm:min-w-[38px] h-9 sm:h-10 rounded-lg text-[15px] sm:text-base font-mono font-bold transition-all active:scale-95 ${badgeStyle} ${
                      isTenOrX ? "cursor-pointer ring-2 ring-amber-400/40" : "cursor-default"
                    }`}
                  >
                    {a}
                  </button>
                );
              }
              return (
                <span key={i} className={`inline-flex items-center justify-center min-w-[34px] sm:min-w-[38px] h-9 sm:h-10 rounded-lg text-[15px] sm:text-base font-mono font-bold ${badgeStyle}`}>
                  {a}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-right pl-2">
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1 font-semibold">End Score</div>
          <div className="text-[22px] sm:text-[26px] font-bold font-mono text-accent leading-none">{currentEndScore}</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mt-4">
        {!isSessionComplete ? (
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleUndo}
              disabled={currentArrows.length === 0}
              className="flex items-center justify-center px-4 bg-black/5 hover:bg-black/10 border border-black/10 rounded-lg text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Undo last arrow"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={handleSubmitEnd}
              disabled={currentArrows.length < 6}
              className="flex-1 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Submit End ({currentArrows.length}/6)
            </button>
          </div>
        ) : null}

        {/* Save button: ALWAYS visible once any arrow or end is shot, or when session completes */}
        {(totalScore > 0 || currentEndIndex > 0 || currentArrows.length > 0 || isSessionComplete) && (
          <button 
            type="button"
            onClick={handleSaveSession}
            disabled={isSaving}
            className={`w-full py-3 px-4 rounded-xl text-[13px] sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isSessionComplete
                ? "bg-accent hover:bg-accent/90 text-white shadow-md active:scale-98"
                : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isSaving
                ? "Saving to Official Scorecards..."
                : isSessionComplete
                ? "Finish & Save Session to Scorecards"
                : `Finish & Save Round (${totalScore} pts • ${currentEndIndex * 6 + currentArrows.length} arrows)`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
