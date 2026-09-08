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
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
        {scores.map((score, i) => (
          <button
            key={i}
            onClick={() => handleScoreInput(score, null, null)}
            disabled={isSessionComplete || currentArrows.length >= 6}
            className={`
              flex items-center justify-center h-12 sm:h-14 rounded-xl text-[16px] sm:text-lg font-bold border border-black/5 transition-colors
              ${isSessionComplete || currentArrows.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}
              ${score === 'X' || score === '10' || score === '9' ? 'bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30' : ''}
              ${score === '8' || score === '7' ? 'bg-[#E53935]/20 text-[#E53935] hover:bg-[#E53935]/30' : ''}
              ${score === '6' || score === '5' ? 'bg-[#4FC3F7]/20 text-[#4FC3F7] hover:bg-[#4FC3F7]/30' : ''}
              ${score === '4' || score === '3' ? 'bg-[#1C1C1C]/60 text-black hover:bg-[#1C1C1C]/80' : ''}
              ${score === '2' || score === '1' || score === 'M' ? 'bg-black/10 text-black hover:bg-black/20' : ''}
            `}
          >
            {score}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center bg-black/5 rounded-lg p-3 sm:p-4 border border-black/5">
        <div>
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>Current End</span>
            {currentArrows.some(a => a.score === "10" || a.score === "X") && (
              <span className="text-[9px] text-accent/80 font-normal lowercase">(tap 10/X to switch)</span>
            )}
          </div>
          <div className="text-[20px] sm:text-[24px] font-mono font-bold text-black tracking-widest flex items-center gap-1 sm:gap-2">
            {displayArrows.map((a, i) => {
              if (i < currentArrows.length && handleUpdateArrowScore) {
                const isTenOrX = a === "10" || a === "X";
                return (
                  <button
                    key={i}
                    type="button"
                    title={isTenOrX ? `Click to switch to ${a === "X" ? "10" : "X"}` : `Arrow ${i + 1}: ${a}`}
                    onClick={() => {
                      if (a === "10") handleUpdateArrowScore(i, "X");
                      else if (a === "X") handleUpdateArrowScore(i, "10");
                    }}
                    className={`inline-flex items-center justify-center min-w-[26px] h-8 rounded text-center transition-all ${
                      isTenOrX
                        ? "cursor-pointer hover:bg-gold/30 hover:scale-110 active:scale-95 text-[#B45309]"
                        : "cursor-default text-black"
                    }`}
                  >
                    {a}
                  </button>
                );
              }
              return (
                <span key={i} className="inline-flex items-center justify-center min-w-[26px] h-8 text-black/20">
                  {a}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] sm:text-[11px] text-text-dim uppercase tracking-wider mb-1">End Score</div>
          <div className="text-[20px] sm:text-[24px] font-bold text-accent">{currentEndScore}</div>
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
